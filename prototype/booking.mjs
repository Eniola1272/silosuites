// Design-preview fixtures only. Production availability and totals must come from Hostaway.
const DAY = 86400000;
export const MAX_GUESTS = 18;
export const STORAGE_KEY = 'silosuites-preview-search-v1';

export function dateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const stamp = Date.UTC(year, month - 1, day);
  return new Date(stamp).toISOString().slice(0, 10) === value ? stamp : null;
}
export function isoDate(value) { return new Date(value).toISOString().slice(0, 10); }
export function addDays(value, count) {
  const stamp = dateValue(value);
  if (stamp === null || !Number.isInteger(count)) throw new Error('Invalid date offset');
  return isoDate(stamp + count * DAY);
}
export function todayInUtah(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = type => parts.find(p => p.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function nightCount(checkIn, checkOut) {
  const start = dateValue(checkIn), end = dateValue(checkOut);
  return start === null || end === null ? 0 : (end - start) / DAY;
}
export function validateSearch(state, today = todayInUtah()) {
  if (dateValue(state.checkIn) === null || dateValue(state.checkOut) === null) return 'Choose your check-in and check-out dates.';
  if (state.checkIn < today) return 'Choose a check-in date from today onwards.';
  if (state.checkOut <= state.checkIn) return 'Check-out must be after check-in.';
  if (nightCount(state.checkIn, state.checkOut) > 30) return 'For this preview, choose a stay of up to 30 nights.';
  if (state.checkOut > addDays(today, 365)) return 'Choose dates within the next 12 months.';
  if (!Number.isInteger(state.guests) || state.guests < 1 || state.guests > MAX_GUESTS) return `Choose between 1 and ${MAX_GUESTS} guests.`;
  return '';
}
export function overlaps(start, end, blockedStart, blockedEnd) {
  return start < blockedEnd && end > blockedStart;
}
export const suites = [
  { id: 'silo-1', name: 'Silo Suite 1', category: 'silo', label: 'The original character', capacity: 4, bedrooms: 1, baths: 1, rate: 17500, image: 'silo-wide.jpg', secondary: 'quiet-bedroom.jpg', minStay: 2, description: 'Exposed brick, a timber loft, and a welcome that feels personal. A characterful place to settle in between Southern Utah adventures.' },
  { id: 'silo-2', name: 'Silo Suite 2', category: 'silo', label: 'Room to slow down', capacity: 5, bedrooms: 2, baths: 1, rate: 18900, image: 'silo-interior.jpg', secondary: 'quiet-bedroom.jpg', minStay: 2, description: 'A little extra room for your favourite people, with the distinctive character of a converted silo and an easy sense of comfort.' },
  { id: 'silo-3', name: 'Silo Suite 3', category: 'silo', label: 'Thoughtfully considered', capacity: 5, bedrooms: 2, baths: 1, rate: 18900, image: 'quiet-bedroom.jpg', secondary: 'silo-wide.jpg', minStay: 2, description: 'Quiet corners and thoughtful details. Unpack, make yourself comfortable, and settle into the slower rhythm of the farm.' },
  { id: 'silo-4', name: 'Silo Suite 4', category: 'silo', label: 'Your own little escape', capacity: 4, bedrooms: 1, baths: 1, rate: 17500, image: 'silo-loft.jpg', secondary: 'quiet-bedroom.jpg', minStay: 2, description: 'Farmhouse character, familiar comforts, and a space to make your own. Come back from a day out and feel at home.' },
  { id: 'dairy', name: 'The Dairy Suite', category: 'dairy', label: 'A new chapter on the farm', capacity: 4, bedrooms: 1, baths: 1, rate: 15900, image: 'dairy-interior.jpg', secondary: 'quiet-bedroom.jpg', minStay: 2, description: 'Natural timber, warm light, and an open, welcoming interior. A fresh chapter in the story of this historic dairy farm.' },
  { id: 'all-silos', name: 'All Four Silos', category: 'group', label: 'Better together', capacity: 18, bedrooms: 6, baths: 4, rate: 70000, image: 'silo-wide.jpg', secondary: 'silo-interior.jpg', minStay: 2, description: 'Four distinctive silos, one shared getaway. Bring your favourite people and enjoy your own spaces on the same historic farm.' },
];
export function sampleBlocks(today = todayInUtah()) {
  const block = (a, b) => [addDays(today, a), addDays(today, b)];
  return { 'silo-1': [block(12, 14)], 'silo-2': [block(14, 17)], 'silo-3': [block(7, 10)], 'silo-4': [block(22, 25)], dairy: [block(18, 20)], 'all-silos': [] };
}
export function isAvailable(suite, state, blocks = sampleBlocks(), today = todayInUtah()) {
  if (validateSearch(state, today) || state.guests > suite.capacity || nightCount(state.checkIn, state.checkOut) < suite.minStay) return false;
  if ((blocks[suite.id] || []).some(([a, b]) => overlaps(state.checkIn, state.checkOut, a, b))) return false;
  // A parent/group reservation also blocks every child silo.
  if (suite.category === 'silo' && (blocks['all-silos'] || []).some(([a, b]) => overlaps(state.checkIn, state.checkOut, a, b))) return false;
  if (suite.category === 'group') {
    return suites.filter(s => s.category === 'silo').every(child => isAvailable(child, { ...state, guests: 1 }, blocks, today));
  }
  return true;
}
export function sampleQuote(suite, state) {
  const nights = nightCount(state.checkIn, state.checkOut);
  if (nights <= 0 || nights > 30) throw new Error('A valid stay is required');
  let accommodation = 0;
  for (let n = 0; n < nights; n++) {
    const day = new Date(dateValue(addDays(state.checkIn, n))).getUTCDay();
    accommodation += suite.rate + ([5, 6].includes(day) ? 2500 : 0);
  }
  const cleaning = suite.category === 'group' ? 12000 : 3500;
  const tax = Math.round((accommodation + cleaning) * .11);
  return { nights, accommodation, cleaning, tax, total: accommodation + cleaning + tax, currency: 'USD', sample: true };
}
export function money(cents) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100); }
export function formatDate(date, options = {}) {
  const stamp = dateValue(date);
  return stamp === null ? 'Choose a date' : new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', ...options }).format(new Date(stamp));
}
export function searchParams(state) {
  const params = new URLSearchParams();
  if (state.checkIn) params.set('check_in', state.checkIn);
  if (state.checkOut) params.set('check_out', state.checkOut);
  params.set('guests', String(state.guests));
  return params;
}
