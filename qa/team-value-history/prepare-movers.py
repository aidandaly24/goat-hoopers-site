"""Actual Next homepage, synthetic changed-player cards and approved local portraits only."""
from pathlib import Path
import contextlib, io, runpy, shutil, sys
here = Path(__file__).resolve().parent
with contextlib.redirect_stdout(io.StringIO()):
    runpy.run_path(str(here / 'prepare-changes.py'), run_name='__main__')
app = Path(sys.argv[1]).resolve() / 'app'
shutil.copyfile(here/'movers-fixture.ts', app/'movers-fixture.ts')
p = app/'fixture-history.ts'
p.write_text(p.read_text().replace("import {changesHistory,changesDetail} from './changes-fixture';", "import {moversHistory as changesHistory,moversDetail as changesDetail} from './movers-fixture';"))
p = app/'fixture-league.ts'
p.write_text(p.read_text().replace("return homeReviewFixture('member').portraits;", "return {...homeReviewFixture('member').portraits,'2259':'/courtside/portraits/player-2259.png','2577':'/courtside/portraits/player-2577.png'};"))
print('Actual member Next homepage, synthetic values, approved matching portrait identities, no live provider/DB access.')
