import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, dateValue, nightCount, overlaps, todayInUtah, validateSearch, suites, isAvailable, sampleQuote } from '../prototype/booking.mjs';

const today = '2027-03-01';
const search = { checkIn: '2027-03-12', checkOut: '2027-03-15', guests: 2 };
const emptyBlocks = Object.fromEntries(suites.map(s => [s.id, []]));

test('stay dates remain date-only across the Utah daylight-saving boundary', () => {
  assert.equal(nightCount('2027-03-13', '2027-03-15'), 2);
  assert.equal(addDays('2027-03-13', 2), '2027-03-15');
  assert.equal(todayInUtah(new Date('2027-03-12T03:00:00Z')), '2027-03-11');
});
test('rejects malformed dates, impossible dates, past arrivals, reversed and overlong stays', () => {
  assert.equal(dateValue('2027-02-30'), null);
  assert.equal(dateValue('2027-2-03'), null);
  assert.ok(validateSearch({ ...search, checkIn: '2027-02-28' }, today));
  assert.ok(validateSearch({ ...search, checkOut: search.checkIn }, today));
  assert.ok(validateSearch({ ...search, checkOut: '2027-05-15' }, today));
  assert.ok(validateSearch({ ...search, guests: 2.5 }, today));
  assert.ok(validateSearch({ ...search, guests: 0 }, today));
  assert.equal(validateSearch(search, today), '');
});
test('checkout boundaries do not overlap an arriving or departing booking', () => {
  assert.equal(overlaps('2027-03-10', '2027-03-12', '2027-03-12', '2027-03-15'), false);
  assert.equal(overlaps('2027-03-15', '2027-03-17', '2027-03-12', '2027-03-15'), false);
  assert.equal(overlaps('2027-03-11', '2027-03-13', '2027-03-12', '2027-03-15'), true);
});
test('a blocked child prevents group booking without blocking its sibling', () => {
  const blocks = { ...emptyBlocks, 'silo-2': [['2027-03-12', '2027-03-15']] };
  assert.equal(isAvailable(suites[5], search, blocks, today), false);
  assert.equal(isAvailable(suites[0], search, blocks, today), true);
  assert.equal(isAvailable(suites[5], { ...search, guests: 18 }, emptyBlocks, today), true);
});
test('a group reservation blocks each child but leaves Dairy independent', () => {
  const blocks = { ...emptyBlocks, 'all-silos': [['2027-03-12', '2027-03-15']] };
  for (const s of suites.filter(s => s.category === 'silo')) assert.equal(isAvailable(s, search, blocks, today), false);
  assert.equal(isAvailable(suites[4], search, blocks, today), true);
});
test('minimum stay and suite capacity apply independently of calendar gaps', () => {
  assert.equal(isAvailable(suites[0], { ...search, guests: 5 }, emptyBlocks, today), false);
  assert.equal(isAvailable(suites[0], { ...search, checkOut: '2027-03-13' }, emptyBlocks, today), false);
});
test('sample quote uses integer cents and includes all displayed line items', () => {
  const q = sampleQuote(suites[0], search);
  assert.equal(q.nights, 3);
  assert.equal(q.total, q.accommodation + q.cleaning + q.tax);
  assert.equal(Number.isInteger(q.total), true);
  assert.equal(q.sample, true);
  assert.throws(() => sampleQuote(suites[0], { ...search, checkOut: search.checkIn }));
});
