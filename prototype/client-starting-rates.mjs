// Client-published marketing starting rates. Selected-date quotes remain separate.
const rates = {
  "silo-1": 15000,
  "silo-2": 16500,
  "silo-3": 16500,
  "silo-4": 15900,
  "dairy": 15900
};
export function startingRateLabel(id){
 const amount=rates[id];if(!Number.isInteger(amount)||amount<=0)return '';
 return 'Rates from '+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:amount%100?2:0,maximumFractionDigits:2}).format(amount/100);
}
