"""Synthetic integration suite; creates its own loopback-only Postgres cluster matching the selected binaries."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('job',ROOT/'copy_job.py')
job=importlib.util.module_from_spec(spec); spec.loader.exec_module(job)
PG=os.environ.get('TIGER_SYNTHETIC_PG_BIN','/opt/homebrew/opt/postgresql@16/bin').rstrip('/')+'/'
MAJOR=int(subprocess.check_output([PG+'pg_dump','--version'],text=True).split()[2].split('.')[0])
PORT='55491'
SENTINEL='dummy-password-NEVER-LOG-941'
ROW='SYNTHETIC-CUSTOMER-ROW-NEVER-LOG-941'


class Integration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory(prefix='tiger-copy-job-')
        cls.base=Path(cls.temp.name)
        cls.cluster=cls.base/'cluster'
        subprocess.run([PG+'initdb','-D',str(cls.cluster),'-A','trust','--no-locale'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
        subprocess.run([PG+'pg_ctl','-D',str(cls.cluster),'-l',str(cls.base/'synthetic-server.log'),'-o',f'-h 127.0.0.1 -p {PORT} -c shared_buffers=16MB -c max_connections=12','-w','start'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
        cls.env={**os.environ,'PGHOST':'127.0.0.1','PGPORT':PORT,'PGDATABASE':'postgres','PGPASSWORD':SENTINEL}
        cls.sql('CREATE DATABASE tiger_job_source;')
        cls.source={**cls.env,'PGDATABASE':'tiger_job_source','PGOPTIONS':'-c default_transaction_read_only=on'}
        cls.sql("""CREATE TYPE public.test_status AS ENUM ('new','paid');
          CREATE TABLE public._prisma_migrations(id text PRIMARY KEY);
          INSERT INTO public._prisma_migrations VALUES ('migration-1');
          CREATE TABLE public.orders(id text PRIMARY KEY, status public.test_status NOT NULL, payload jsonb NOT NULL);
          ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
          INSERT INTO public.orders VALUES ('synthetic-1','paid','{\"email\":\""""+ROW+"""\",\"nested\":{\"amount\":2500}}');
          CREATE TABLE public.order_items(id text PRIMARY KEY,order_id text REFERENCES public.orders(id));
          ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
          INSERT INTO public.order_items VALUES ('line-1','synthetic-1');
          CREATE UNIQUE INDEX order_item_order_unique ON public.order_items(order_id);""",cls.source,readonly=False)
        cls.counter=0

    @classmethod
    def tearDownClass(cls):
        subprocess.run([PG+'pg_ctl','-D',str(cls.cluster),'-m','fast','-w','stop'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
        cls.temp.cleanup()

    @classmethod
    def sql(cls,sql,env=None,readonly=True):
        e=dict(env or cls.env)
        if not readonly:e.pop('PGOPTIONS',None)
        r=subprocess.run([PG+'psql','-X','-qAt','-v','ON_ERROR_STOP=1'],input=sql,text=True,env=e,capture_output=True)
        if r.returncode:raise RuntimeError('SYNTHETIC_SQL_FAILED')
        return r.stdout.strip()

    def setUp(self):
        type(self).counter+=1
        name='tiger_job_target_'+str(type(self).counter)
        self.sql('CREATE DATABASE '+name+';')
        self.target={**self.env,'PGDATABASE':name,'PGOPTIONS':'-c log_min_messages=panic -c log_min_error_statement=panic -c log_error_verbosity=terse'}
        self.marker_dir=self.base/name
        self.marker_dir.mkdir()

    def run_copy(self,**kwargs):
        return job.copy(self.source,self.target,self.marker_dir,psql=PG+'psql',pg_dump=PG+'pg_dump',expected_major=MAJOR,expected_tables=3,expected_migrations=1,expected_client_major=MAJOR,**kwargs)

    def tables(self):
        return int(self.sql("SELECT count(*) FROM pg_tables WHERE schemaname='public';",self.target))

    def fake_dump(self,body):
        path=self.marker_dir/'fake-dump.sh'
        path.write_text('#!/bin/sh\n'+body+'\n');path.chmod(0o755)
        return [str(path)]

    def test_success_exact_manifest_and_source_untouched(self):
        out=io.StringIO()
        with contextlib.redirect_stdout(out):receipt=self.run_copy()
        self.assertTrue(receipt['validated']);self.assertEqual(self.tables(),3)
        self.assertEqual(receipt['counts'],{'_prisma_migrations':1,'order_items':1,'orders':1})
        self.assertEqual(self.sql("SELECT count(*) FROM orders;",self.source),'1')
        self.assertEqual(self.sql("SELECT count(*) FROM pg_tables WHERE schemaname='public' AND rowsecurity;",self.target),'2')
        self.assertNotIn(SENTINEL,out.getvalue());self.assertNotIn(ROW,out.getvalue())
        self.assertTrue((self.marker_dir/job.MARKER).exists())

    def test_dropped_column_slots_do_not_change_logical_schema(self):
        self.sql('ALTER TABLE orders ADD COLUMN removed_fixture text; ALTER TABLE orders ADD COLUMN retained_fixture text; ALTER TABLE orders DROP COLUMN removed_fixture;', self.source, readonly=False)
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                receipt=self.run_copy()
            self.assertTrue(receipt['validated'])
            self.assertEqual(self.tables(),3)
        finally:
            self.sql('ALTER TABLE orders DROP COLUMN retained_fixture;', self.source, readonly=False)

    def test_corrupt_restore_rolls_back_schema_and_rows(self):
        cmd=self.fake_dump("printf 'CREATE SCHEMA public; CREATE TABLE public.orders(id text); INSERT INTO public.orders VALUES (\"'\"'partial\"'\"'); INVALID SQL;\\n'")
        with self.assertRaises(job.JobError):self.run_copy(dump_command=cmd)
        self.assertEqual(self.tables(),0)
        self.assertFalse((self.marker_dir/job.MARKER).exists())

    def test_valid_partial_dump_manifest_mismatch_rolls_back(self):
        cmd=self.fake_dump("printf 'CREATE SCHEMA public; CREATE TABLE public.orders(id text);\\n'")
        with self.assertRaisesRegex(job.JobError,'RESTORE_MANIFEST_MISMATCH'):self.run_copy(dump_command=cmd)
        self.assertEqual(self.tables(),0)

    def test_export_failure_before_restore_even_with_valid_stdout(self):
        cmd=self.fake_dump("printf 'CREATE SCHEMA public; CREATE TABLE public.orders(id text);\\n'; exit 1")
        with self.assertRaisesRegex(job.JobError,'DUMP_FAILED'):self.run_copy(dump_command=cmd)
        self.assertEqual(self.tables(),0)

    def test_secret_and_rows_in_child_error_never_log(self):
        cmd=self.fake_dump('echo '+SENTINEL+' '+ROW+' >&2; exit 1')
        out=io.StringIO()
        with contextlib.redirect_stdout(out),contextlib.redirect_stderr(out):
            with self.assertRaises(job.JobError):self.run_copy(dump_command=cmd)
        self.assertNotIn(SENTINEL,out.getvalue());self.assertNotIn(ROW,out.getvalue())

    def test_retry_does_not_export_or_duplicate(self):
        self.run_copy()
        cmd=self.fake_dump('touch '+str(self.marker_dir/'DUMP_RERAN')+'; exit 1')
        with self.assertRaisesRegex(job.JobError,'ALREADY_COPIED'):self.run_copy(dump_command=cmd)
        self.assertFalse((self.marker_dir/'DUMP_RERAN').exists());self.assertEqual(self.tables(),3)

    def test_existing_target_rejected_without_overwrite(self):
        self.sql('CREATE TABLE public.keep_me(id integer); INSERT INTO public.keep_me VALUES (42);',self.target)
        with self.assertRaisesRegex(job.JobError,'TARGET_NOT_EMPTY'):self.run_copy()
        self.assertEqual(self.sql('SELECT id FROM public.keep_me;',self.target),'42')

    def test_missing_marker_blocks_restart_and_wrong_version(self):
        env={**os.environ,'PGDATA':str(self.marker_dir)}
        (self.marker_dir/'PG_VERSION').write_text('17')
        r=subprocess.run(['python3',str(ROOT/'check_marker.py')],env=env,capture_output=True,text=True)
        self.assertEqual(r.returncode,1)
        self.assertNotIn(SENTINEL,r.stdout+r.stderr)

    def test_marker_restart_does_not_need_source_secret(self):
        self.run_copy()
        p=self.marker_dir/job.MARKER
        # Synthetic physical server is16; unit-test the PG17 startup-marker contract.
        m=json.loads(p.read_text());m.update(server_major=17,tables=24,migrations=9);p.write_text(json.dumps(m))
        (self.marker_dir/'PG_VERSION').write_text('17')
        env={k:v for k,v in os.environ.items() if k!='SOURCE_DB_PASSWORD'};env['PGDATA']=str(self.marker_dir)
        r=subprocess.run(['python3',str(ROOT/'check_marker.py')],env=env,capture_output=True,text=True)
        self.assertEqual(r.returncode,0);self.assertEqual(self.tables(),3)

    def test_dump_bounded_in_memory(self):
        cmd=self.fake_dump("printf '123456789'")
        with self.assertRaisesRegex(job.JobError,'DUMP_SIZE_LIMIT'):job.bounded_dump(cmd,self.source,limit=4)

    def test_new_sequence_is_explicit_review_gate(self):
        self.sql('CREATE SEQUENCE public.unreviewed_sequence;',self.source,readonly=False)
        try:
            with self.assertRaisesRegex(job.JobError,'SOURCE_DEPENDENCIES_REQUIRE_REVIEW'):self.run_copy()
        finally:self.sql('DROP SEQUENCE public.unreviewed_sequence;',self.source,readonly=False)
        self.assertEqual(self.tables(),0)

    def test_production_cli_requires_project_and_handoff(self):
        r=subprocess.run(['python3',str(ROOT/'copy_job.py')],env={'PATH':os.environ['PATH']},capture_output=True,text=True)
        self.assertEqual(r.returncode,1);self.assertIn('WRONG_RAILWAY_PROJECT',r.stdout)

    def test_source_write_after_snapshot_not_in_copy(self):
        original=job.bounded_dump
        def during(command,env,limit=job.MAX_DUMP):
            self.sql("INSERT INTO public.orders VALUES ('after-snapshot','new','{}');",self.source,readonly=False)
            return original(command,env,limit)
        job.bounded_dump=during
        try:
            self.run_copy()
            self.assertEqual(self.sql('SELECT count(*) FROM orders;',self.target),'1')
            self.assertEqual(self.sql('SELECT count(*) FROM orders;',self.source),'2')
        finally:
            job.bounded_dump=original
            self.sql("DELETE FROM public.orders WHERE id='after-snapshot';",self.source,readonly=False)

    def test_server_and_client_errors_do_not_log_sensitive_literals(self):
        cmd=self.fake_dump("printf \"CREATE SCHEMA public; SELECT '"+SENTINEL+"'::int;\\n\"")
        out=io.StringIO()
        with contextlib.redirect_stdout(out),contextlib.redirect_stderr(out):
            with self.assertRaises(job.JobError):self.run_copy(dump_command=cmd)
        self.assertNotIn(SENTINEL,out.getvalue())
        self.assertNotIn(SENTINEL,(self.base/'synthetic-server.log').read_text())
        self.assertEqual(self.tables(),0)

    def test_sourced_hook_removes_secrets_before_parent_exec(self):
        tools=self.marker_dir/'tools';tools.mkdir()
        fake=tools/'timeout';fake.write_text('#!/bin/sh\nexit 0\n');fake.chmod(0o755)
        env={**os.environ,'PATH':str(tools)+':'+os.environ['PATH'],'SOURCE_DB_PASSWORD':SENTINEL,'PGPASSWORD':SENTINEL}
        cmd='set -e; source '+str(ROOT/'init-copy.sh')+'; test -z "${SOURCE_DB_PASSWORD+x}"; test -z "${PGPASSWORD+x}"; printf secret-cleared'
        r=subprocess.run(['bash','-c',cmd],env=env,capture_output=True,text=True)
        self.assertEqual(r.returncode,0);self.assertEqual(r.stdout,'secret-cleared')
        self.assertNotIn(SENTINEL,r.stdout+r.stderr)

    def test_owner_handoff_missing_blocks_before_connection(self):
        env={'PATH':os.environ['PATH'],'RAILWAY_PROJECT_ID':'be407546-f840-4ed8-b58e-7c254d77c6dd',
             'RAILWAY_SERVICE_NAME':'tiger-rehearsal-pg17','TIGER_COPY_APPROVED':'true'}
        r=subprocess.run(['python3',str(ROOT/'copy_job.py')],env=env,capture_output=True,text=True)
        self.assertEqual(r.returncode,1);self.assertIn('OWNER_SECRET_HANDOFF_MISSING',r.stdout)

    def test_public_proxy_blocks_before_connection(self):
        env={'PATH':os.environ['PATH'],'RAILWAY_PROJECT_ID':'be407546-f840-4ed8-b58e-7c254d77c6dd',
             'RAILWAY_SERVICE_NAME':'tiger-rehearsal-pg17','RAILWAY_TCP_PROXY_DOMAIN':'example.invalid'}
        r=subprocess.run(['python3',str(ROOT/'copy_job.py')],env=env,capture_output=True,text=True)
        self.assertEqual(r.returncode,1);self.assertIn('PUBLIC_ACCESS_NOT_ALLOWED',r.stdout)

    def test_marker_failure_keeps_complete_data_but_blocks_start_and_recopy(self):
        original=Path.replace
        def fail_marker(path,target):
            if path.name==job.MARKER+'.tmp':raise OSError('synthetic marker fault')
            return original(path,target)
        Path.replace=fail_marker
        try:
            with self.assertRaises(OSError):self.run_copy()
        finally:Path.replace=original
        self.assertEqual(self.tables(),3);self.assertFalse((self.marker_dir/job.MARKER).exists())
        with self.assertRaisesRegex(job.JobError,'TARGET_NOT_EMPTY'):self.run_copy()


if __name__=='__main__':unittest.main(verbosity=2)
