#!/usr/bin/env python3
"""Bounded, memory-only application copy. No credential or row logging."""
import hashlib
import json
import os
from pathlib import Path
import queue
import subprocess
import threading
import time

SOURCE_REF = "vjmrzvdevpuowzmabrog"
MARKER = ".tiger-rehearsal-complete.json"
MAX_DUMP = 32 * 1024 * 1024


class JobError(Exception):
    pass


class Session:
    def __init__(self, psql, env):
        self.proc = subprocess.Popen(
            [psql, "-X", "-qAt", "-v", "ON_ERROR_STOP=1"], env=env,
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        )
        self.lines = queue.Queue()
        def read():
            for line in self.proc.stdout:
                self.lines.put(line.decode().strip())
            self.lines.put(None)
        self.reader = threading.Thread(target=read, daemon=True)
        self.reader.start()

    def send(self, sql):
        try:
            self.proc.stdin.write(sql if isinstance(sql, (bytes, bytearray)) else sql.encode())
            self.proc.stdin.flush()
        except (BrokenPipeError, OSError):
            raise JobError("SQL_SESSION_FAILED") from None

    def query(self, sql, timeout=60):
        prefix = "TJ_" + os.urandom(8).hex() + "="
        self.send("SELECT '" + prefix + "' || (" + sql + ")::text;\n")
        until = time.monotonic() + timeout
        while True:
            try:
                line = self.lines.get(timeout=max(.01, until-time.monotonic()))
            except queue.Empty:
                raise JobError("SQL_TIMEOUT") from None
            if line is None:
                raise JobError("SQL_SESSION_FAILED")
            if line.startswith(prefix):
                return line[len(prefix):]

    def close(self):
        # Closing a live connection rolls back its uncommitted transaction.
        if self.proc.poll() is None:
            try:
                self.proc.stdin.close()
            except (BrokenPipeError, OSError):
                pass
            try:
                self.proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.proc.kill()
                self.proc.wait()
        self.proc.stdout.close()


def quoted(value):
    return '"' + value.replace('"', '""') + '"'


def manifest(session):
    # pg_dump changes search_path; canonicalize names before comparing definitions.
    session.send("SET search_path=public,pg_catalog;\n")
    catalog = json.loads(session.query("""jsonb_build_object(
      'tables',(SELECT jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,'forced',c.relforcerowsecurity) ORDER BY c.relname COLLATE "C") FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'),
      'columns',(SELECT jsonb_agg(jsonb_build_array(table_name,column_name,ordinal_position,udt_name,is_nullable,column_default) ORDER BY table_name COLLATE "C",ordinal_position) FROM information_schema.columns WHERE table_schema='public'),
      'constraints',(SELECT jsonb_agg(jsonb_build_array(c.relname,k.conname,pg_get_constraintdef(k.oid)) ORDER BY c.relname COLLATE "C",k.conname COLLATE "C") FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'),
      'indexes',(SELECT jsonb_agg(jsonb_build_array(tablename,indexname,indexdef) ORDER BY tablename COLLATE "C",indexname COLLATE "C") FROM pg_indexes WHERE schemaname='public'),
      'enums',(SELECT jsonb_agg(jsonb_build_array(t.typname,e.enumlabel,e.enumsortorder) ORDER BY t.typname COLLATE "C",e.enumsortorder) FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public'),
      'policies',(SELECT count(*) FROM pg_policies WHERE schemaname='public'),
      'functions',(SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'),
      'views',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('v','m')),
      'triggers',(SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal),
      'sequences',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='S'))"""))
    rows = {}
    for table in catalog['tables'] or []:
        name = table['name']
        rows[name] = json.loads(session.query(
            "(SELECT jsonb_build_object('count',count(*),'hash',md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY to_jsonb(t)::text COLLATE \"C\"),''))) FROM public."
            + quoted(name) + " t)"))
    return {'catalog': catalog, 'rows': rows}


def bounded_dump(command, env, limit=MAX_DUMP):
    proc = subprocess.Popen(command, env=env, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    result = bytearray()
    try:
        while chunk := proc.stdout.read(65536):
            result.extend(chunk)
            if len(result) > limit:
                raise JobError("DUMP_SIZE_LIMIT")
        if proc.wait(timeout=30) != 0:
            raise JobError("DUMP_FAILED")
        return result
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait()
        proc.stdout.close()


def copy(source_env, target_env, pgdata, psql="psql", pg_dump="pg_dump",
         expected_major=17, expected_tables=24, expected_migrations=9,
         dump_command=None, expected_client_major=17):
    """Test harness can inject synthetic transports; CLI has fixed production defaults."""
    if Path(pgdata, MARKER).exists():
        raise JobError("ALREADY_COPIED")
    version = subprocess.run([pg_dump, '--version'], capture_output=True, text=True, check=True).stdout
    if int(version.split()[2].split('.')[0]) != expected_client_major:
        raise JobError("CLIENT_VERSION_MISMATCH")
    src, dst = Session(psql, source_env), Session(psql, target_env)
    try:
        for session in (src, dst):
            if int(session.query("current_setting('server_version_num')")) // 10000 != expected_major:
                raise JobError("SERVER_VERSION_MISMATCH")
        src.send("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;\n")
        snapshot = src.query("pg_export_snapshot()")
        before = manifest(src)
        cat = before['catalog']
        if len(cat['tables'] or []) != expected_tables:
            raise JobError("SOURCE_TABLE_COUNT_CHANGED")
        if any(cat[k] for k in ('policies','functions','views','triggers','sequences')):
            raise JobError("SOURCE_DEPENDENCIES_REQUIRE_REVIEW")
        if before['rows'].get('_prisma_migrations', {}).get('count') != expected_migrations:
            raise JobError("MIGRATION_COUNT_CHANGED")
        target_catalog = manifest(dst)['catalog']
        if target_catalog['tables'] or any(target_catalog[k] for k in ('policies','functions','views','triggers','sequences')):
            raise JobError("TARGET_NOT_EMPTY")
        # Buffer is bounded RAM, never a local archive. Successful dump is required
        # BEFORE restore begins, including the case of a valid dump followed by exit1.
        command = dump_command or [pg_dump, '--format=plain', '--schema=public',
            '--no-owner','--no-acl','--no-publications','--no-subscriptions',
            '--lock-wait-timeout=10000', '--snapshot='+snapshot]
        dump = bounded_dump(command, source_env)
        dst.send("BEGIN;\nDROP SCHEMA public;\n")
        dst.send(dump)
        after = manifest(dst)
        if after != before:
            raise JobError("RESTORE_MANIFEST_MISMATCH")
        dst.send("COMMIT;\n")
        # Roundtrip ensures COMMIT actually completed, not merely buffered.
        if dst.query("'commit-confirmed'") != 'commit-confirmed':
            raise JobError("COMMIT_NOT_CONFIRMED")
        receipt = {'source_ref': SOURCE_REF, 'server_major': expected_major,
            'tables': expected_tables, 'migrations': expected_migrations,
            'manifest_sha256': hashlib.sha256(json.dumps(before,sort_keys=True).encode()).hexdigest(),
            'counts': {k:v['count'] for k,v in before['rows'].items()}, 'validated':True}
        temporary = Path(pgdata, MARKER+'.tmp')
        with temporary.open('x') as f:
            json.dump(receipt,f,sort_keys=True)
            f.flush(); os.fsync(f.fileno())
        temporary.replace(Path(pgdata, MARKER))
        directory = os.open(pgdata, os.O_RDONLY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
        return receipt
    finally:
        src.close(); dst.close()


def main():
    # Production CLI accepts no test overrides, URLs, passwords in arguments.
    if os.environ.get('RAILWAY_PROJECT_ID') != 'be407546-f840-4ed8-b58e-7c254d77c6dd':
        raise JobError('WRONG_RAILWAY_PROJECT')
    if os.environ.get('RAILWAY_SERVICE_NAME') != 'tiger-rehearsal-pg17':
        raise JobError('WRONG_RAILWAY_SERVICE')
    if os.environ.get('RAILWAY_PUBLIC_DOMAIN') or os.environ.get('RAILWAY_TCP_PROXY_DOMAIN'):
        raise JobError('PUBLIC_ACCESS_NOT_ALLOWED')
    if os.environ.get('TIGER_COPY_APPROVED') != 'true':
        raise JobError('APPROVAL_GATE_CLOSED')
    password = os.environ.pop('SOURCE_DB_PASSWORD', '')
    if not password:
        raise JobError('OWNER_SECRET_HANDOFF_MISSING')
    base = {k:v for k,v in os.environ.items() if not k.startswith('PG') and k != 'SOURCE_DB_PASSWORD'}
    source = dict(base,PGHOST='aws-1-us-west-2.pooler.supabase.com',PGPORT='5432',
        PGUSER='postgres.'+SOURCE_REF,PGDATABASE='postgres',PGPASSWORD=password,
        PGSSLMODE='verify-full',PGSSLROOTCERT='/job/source-root-ca.crt',
        PGCONNECT_TIMEOUT='10',PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=60000')
    target = dict(base,PGHOST='/var/run/postgresql',PGPORT=os.environ.get('PGPORT','5432'),
        PGUSER=os.environ.get('POSTGRES_USER','postgres'),PGDATABASE=os.environ.get('POSTGRES_DB','tiger_rehearsal'),
        PGCONNECT_TIMEOUT='10',PGOPTIONS='-c log_min_messages=panic -c log_min_error_statement=panic -c log_error_verbosity=terse -c statement_timeout=60000')
    result = copy(source,target,os.environ['PGDATA'])
    print(json.dumps({'event':'COPY_VALIDATED','tables':result['tables'],
        'migrations':result['migrations'],'manifest_sha256':result['manifest_sha256'],'counts':result['counts']}))


if __name__ == '__main__':
    try:
        main()
    except JobError as e:
        print(json.dumps({'event':'COPY_STOPPED','code':str(e)}))
        raise SystemExit(1)
    except BaseException:
        # Tracebacks/subprocess errors may contain secrets or SQL/customer details.
        print(json.dumps({'event':'COPY_STOPPED','code':'INTERNAL_FAILURE'}))
        raise SystemExit(1)
