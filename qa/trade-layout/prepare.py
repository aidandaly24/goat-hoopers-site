"""Actual Trade Analyzer route/shell; synthetic quotes, no credentials or providers."""
from pathlib import Path
import runpy,sys

source=Path(__file__).resolve().parents[2]
out=Path(sys.argv[1]).resolve()
sys.argv=[str(source/'qa/news-date/prepare.py'),str(out)]
runpy.run_path(str(source/'qa/news-date/prepare.py'),run_name='__main__')
fixture=out/'app/fixture-base.ts'
text=fixture.read_text()
needle="quote.playerName='Alperen Şengün';quote.price=76.54;"
assert text.count(needle)==1
text=text.replace(needle,needle+"\n  raw.market.stocks[1].playerName='Synthetic extraordinarily long basketball player surname';\n  raw.market.stocks[2].playerName='SyntheticUnbrokenPlayerNameThatMustRemainFullyReadableAtLargeText';")
fixture.write_text(text)
print('Prepared Trade Analyzer quotes with accented, long and unbroken names.')
