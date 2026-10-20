"""Build/start the prepared synthetic fixture with no application credentials."""
from pathlib import Path
import os,shutil,subprocess,sys
source=Path(__file__).resolve().parents[2]
out=Path(sys.argv[1]).resolve();app=out/'app';port=sys.argv[2] if len(sys.argv)>2 else '4360'
node=shutil.which('node')
if not node:raise SystemExit('Put the repository Node version on PATH first.')
next_bin=str(source/'node_modules/next/dist/bin/next')
env={'PATH':os.environ['PATH'],'LANG':'en_US.UTF-8','TZ':'UTC','NEXT_TELEMETRY_DISABLED':'1','REVIEW_PROBE_LOG':str(out/'combined-probe.jsonl'),'NODE_OPTIONS':'--import='+str(source/'qa/ticker-scope/guard.mjs')}
with (out/'next-build.log').open('w') as log:
 result=subprocess.run([node,next_bin,'build',str(app),'--webpack'],cwd=app,env=env,stdout=log,stderr=subprocess.STDOUT)
if result.returncode:raise SystemExit(f'Fixture build failed; see {out}/next-build.log')
print('Synthetic production Next fixture ready',flush=True)
os.chdir(app)
os.execve(node,[node,next_bin,'start',str(app),'--hostname','127.0.0.1','--port',port],env)
