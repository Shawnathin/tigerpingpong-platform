import json, os
from pathlib import Path
try:
    p=Path(os.environ['PGDATA'])
    m=json.loads((p/'.tiger-rehearsal-complete.json').read_text())
    assert p.joinpath('PG_VERSION').read_text().strip()=='17'
    assert m['validated'] is True and m['server_major']==17
    assert m['source_ref']=='vjmrzvdevpuowzmabrog' and m['tables']==24 and m['migrations']==9
    assert len(m['manifest_sha256'])==64
except BaseException:
    print('{"event":"COPY_START_BLOCKED","code":"INCOMPLETE_OR_INVALID_COPY"}')
    raise SystemExit(1)
