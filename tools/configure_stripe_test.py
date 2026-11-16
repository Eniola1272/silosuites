#!/usr/bin/env python3
"""Save only matching-account Stripe TEST keys privately; no network calls or charges."""
from getpass import getpass
from hostaway_discover import save_private,PRIVATE
import re

def main():
    PRIVATE.mkdir(mode=0o700,exist_ok=True)
    if PRIVATE.is_symlink() or PRIVATE.stat().st_mode & 0o077:raise ValueError('Private folder must be protected (0700) and not a symlink')
    print('Use test-mode keys from the SAME Stripe account connected to Hostaway. No live keys.')
    public=getpass('Stripe test publishable key (hidden): ').strip()
    secret=getpass('Stripe test secret key (hidden): ').strip()
    if not re.fullmatch(r'pk_test_[A-Za-z0-9]+',public) or not re.fullmatch(r'(?:sk|rk)_test_[A-Za-z0-9]+',secret):raise ValueError('Only Stripe test-mode keys are accepted. Nothing saved.')
    save_private('stripe-test.json',{'publishable_key':public,'secret_key':secret,'mode':'test','scope':'Custom WordPress checkout development; no live payments authorised'})
    print('Saved privately. No Stripe or Hostaway request was made.')
if __name__=='__main__':
    try:main()
    except (ValueError,EOFError,KeyboardInterrupt) as error:raise SystemExit(str(error) or 'Cancelled. Nothing saved.')
