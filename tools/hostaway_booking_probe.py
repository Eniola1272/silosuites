#!/usr/bin/env python3
"""Bounded, non-transactional account proof: metadata, calendars and price calculation only."""
import json,re,time
from datetime import datetime,timedelta
from zoneinfo import ZoneInfo
from urllib.parse import urlencode
from urllib.request import Request,build_opener
from urllib.error import HTTPError
from hostaway_discover import read_private,save_private,request_json,NoRedirect
BASE='https://api.hostaway.com/v1'
def call(path,token,body=None):
    method='POST' if body is not None else 'GET'
    allowed=(method=='GET' and re.fullmatch(r'/listings/[0-9]+(?:\?.+|/calendar\?.+)',path)) or (method=='POST' and re.fullmatch(r'/listings/[0-9]+/calendar/priceDetails',path))
    if not allowed:raise ValueError('Operation outside non-transactional allowlist')
    req=Request(BASE+path,headers={'Authorization':'Bearer '+token,'Accept':'application/json','Content-Type':'application/json'},data=json.dumps(body).encode() if body is not None else None,method=method)
    with build_opener(NoRedirect()).open(req,timeout=25) as response:
        raw=response.read(8388609)
    if len(raw)>8388608:raise ValueError('Response too large')
    data=json.loads(raw)
    if data.get('status')!='success':raise ValueError('Provider rejected probe; details suppressed')
    return data['result']
def main():
    credentials=read_private('hostaway.json');cached=read_private('hostaway-token.json');token=cached.get('access_token')
    if not token or cached.get('account_id')!=str(credentials['account_id']) or cached.get('expires_at',0)<time.time()+60:
        auth=request_json('/accessTokens',auth={'grant_type':'client_credentials','client_id':credentials['account_id'],'client_secret':credentials['client_secret'],'scope':'general'})
        token=auth['access_token'];save_private('hostaway-token.json',{'account_id':str(credentials['account_id']),'access_token':token,'expires_at':time.time()+auth['expires_in']});time.sleep(1)
    rows=[]
    for lid in ['143824','143823','143826','143825','603415']:
        row=call('/listings/'+lid+'?'+urlencode({'attachObjects[]':'bookingEngineUrls','includeResources':1}),token)
        safe={k:row.get(k) for k in ['id','name','personCapacity','bedroomsNumber','bedsNumber','bathroomsNumber','currencyCode','minNights','maxNights','timeZoneName','bookingEngineUrls']}
        safe['images']=[{'url':i.get('url'),'caption':i.get('caption'),'sortOrder':i.get('sortOrder')} for i in (row.get('listingImages') or [])[:30]]
        rows.append(safe)
    start=(datetime.now(ZoneInfo('America/Denver')).date()+timedelta(days=1)).isoformat();end=(datetime.fromisoformat(start)+timedelta(days=89)).date().isoformat()
    days=call('/listings/143823/calendar?'+urlencode({'startDate':start,'endDate':end}),token)
    safe_days=[{k:d.get(k) for k in ['date','isAvailable','status','price','minimumStay','maximumStay','closedOnArrival','closedOnDeparture']} for d in days]
    available={d['date']:d for d in safe_days};quote=None;selection=None
    for day in safe_days:
        if day.get('isAvailable')!=1 or day.get('closedOnArrival')==1:continue
        n=max(2,int(day.get('minimumStay') or 1));arrival=day['date'];departure=(datetime.fromisoformat(arrival)+timedelta(days=n)).date().isoformat()
        nights=[(datetime.fromisoformat(arrival)+timedelta(days=i)).date().isoformat() for i in range(n)]
        if n>30 or any(available.get(d,{}).get('isAvailable')!=1 for d in nights) or departure not in available or available[departure].get('closedOnDeparture')==1:continue
        selection={'startingDate':arrival,'endingDate':departure,'numberOfGuests':2,'version':2}
        price=call('/listings/143823/calendar/priceDetails',token,selection)
        quote={k:price.get(k) for k in ['totalPrice','originalTotalPrice','selectedComponentsAmount']}
        quote['components']=[{k:c.get(k) for k in ['type','name','title','alias','quantity','value','total','isIncludedInTotalPrice','isMandatory','isDeleted','listingFeeSettingId','isQuantitySelectable']} for c in price.get('components',[])]
        break
    save_private('hostaway-booking-proof.json',{'checked_at_utc':datetime.now(ZoneInfo('UTC')).isoformat(),'listings':rows,'calendar':safe_days,'selection':selection,'quote':quote})
    print(json.dumps({'listings':len(rows),'booking_url_counts':[len(r.get('bookingEngineUrls') or []) for r in rows],'calendar_days':len(safe_days),'quote_received':quote is not None,'quote_component_types':sorted(set(str(c.get('type')) for c in (quote or {}).get('components',[]))),'selection':selection,'scope':'Non-transactional metadata/calendar/price calculation; no bookings, payments or messages created.'}))
if __name__=='__main__':
    try:main()
    except HTTPError as e:raise SystemExit('Probe returned HTTP '+str(e.code)+'. Provider body suppressed.')
    except Exception as e:raise SystemExit('Probe could not complete ('+type(e).__name__+'). No credential or response details displayed.')
