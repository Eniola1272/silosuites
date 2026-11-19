#!/usr/bin/env python3
"""Generate preview and plugin defaults from the client's published card-rate copy."""
import json
import shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'shared/client-starting-rates.json'
data=json.loads(source.read_text())
assert data['currency']=='USD' and set(data['rates_minor'])=={'silo-1','silo-2','silo-3','silo-4','dairy'}
assert all(type(rate) is int and 0<rate<=100000000 for rate in data['rates_minor'].values())
target=ROOT/'wordpress/plugins/silosuites-booking/data/starting-rates.json'
target.parent.mkdir(exist_ok=True)
shutil.copyfile(source,target)
(ROOT/'prototype/client-starting-rates.mjs').write_text('// Client-published marketing starting rates. Selected-date quotes remain separate.\nconst rates = '+json.dumps(data['rates_minor'],indent=2)+''';
export function startingRateLabel(id){
 const amount=rates[id];if(!Number.isInteger(amount)||amount<=0)return '';
 return 'Rates from '+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:amount%100?2:0,maximumFractionDigits:2}).format(amount/100);
}
''')
print('Generated five published card-rate defaults; no quote or provider rate modified.')
