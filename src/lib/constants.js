export const C = {
  bgPage:       '#f5f4ef',
  bgSurface:    '#faf9f6',
  bgPanel:      '#ffffff',
  bgHover:      '#f0efe9',
  border:       '#e8e6df',
  borderMid:    '#d4d1c9',
  borderStrong: '#b8b5ac',
  textPrimary:  '#1a1915',
  textSecondary:'#5c5a52',
  textMuted:    '#9b9890',
  textDisabled: '#c4c2ba',
  accent:       '#c96442',
  accentHover:  '#b85a3a',
  accentLight:  '#fdf0eb',
  accentBorder: '#e8bfb0',
  green:        '#2d7d52',
  greenLight:   '#edf6f0',
  greenBorder:  '#b5d9c4',
  red:          '#c0392b',
  redLight:     '#fdf0ee',
  redBorder:    '#e8bab5',
  yellow:       '#b5860d',
  yellowLight:  '#fdf8ec',
  yellowBorder: '#e8d8a0',
  orange:       '#f2994a',
  shadow:       '0 1px 3px rgba(26,25,21,0.08), 0 1px 2px rgba(26,25,21,0.04)',
  shadowMd:     '0 4px 12px rgba(26,25,21,0.08), 0 2px 4px rgba(26,25,21,0.04)',
  shadowLg:     '0 8px 24px rgba(26,25,21,0.10), 0 4px 8px rgba(26,25,21,0.06)',
};

export const EXPENSE_SECTIONS = [
  { section:'Home & Utilities', color:{ dot:'#1a8c6e', bg:'#edf6f3', border:'#b0d9cc' }, items:[
    { name:'Flat Maintenance',  desc:'Apartment association monthly maintenance' },
    { name:'Electricity',       desc:'Power bill' },
    { name:'Gas',               desc:'Cooking gas cylinder' },
    { name:'Water',             desc:'Water supply charges' },
    { name:'Internet',          desc:'Broadband / Fiber connection' },
    { name:'Mobile Phone',      desc:'Mobile phone bills' },
    { name:'TV & OTT',          desc:'DTH, cable TV, streaming subscriptions' },
    { name:'Newspaper',         desc:'Newspaper or magazine subscription' },
  ]},
  { section:'Groceries & Household', color:{ dot:'#3b82b8', bg:'#eff6fc', border:'#b8d9f0' }, items:[
    { name:'Groceries',           desc:'General grocery shopping' },
    { name:'Milk & Dairy',        desc:'Milk and dairy products (Milk Basket, BB Daily etc.)' },
    { name:'Fruits & Vegetables', desc:'Fresh produce' },
    { name:'Meat & Fish',         desc:'Chicken, mutton, fish etc.' },
    { name:'Snacks & Sweets',     desc:'Weekend snacks, sweets, junk food' },
    { name:'Household Supplies',  desc:'Cleaning items, toiletries, kitchen consumables' },
  ]},
  { section:'Domestic Help & Cleaning', color:{ dot:'#7c5cbf', bg:'#f4f0fb', border:'#cfc0ed' }, items:[
    { name:'Maid',              desc:'Housemaid salary' },
    { name:'Laundry & Ironing', desc:'Dress ironing and dry cleaning' },
    { name:'Bathroom Cleaning', desc:'Professional bathroom cleaning' },
    { name:'Deep Cleaning',     desc:'Sofa cleaning, kitchen deep cleaning, full house cleaning' },
  ]},
  { section:'Transportation', color:{ dot:'#2563a8', bg:'#eff5fc', border:'#b0cced' }, items:[
    { name:'Fuel',             desc:'Petrol or diesel' },
    { name:'Public Transport', desc:'Bus, metro, auto' },
    { name:'Taxi & Cab',       desc:'App-based taxis (Ola, Uber etc.)' },
    { name:'Fastag & Tolls',   desc:'Toll payments and Fastag recharge' },
  ]},
  { section:'Vehicle Maintenance', color:{ dot:'#5c6e7a', bg:'#f0f3f5', border:'#c0ccd4' }, items:[
    { name:'Car Service & Repairs', desc:'Car servicing and repair work' },
    { name:'Car Wash',              desc:'Regular or deep car cleaning' },
    { name:'Vehicle Insurance',     desc:'Car insurance' },
  ]},
  { section:'Kids & Education', color:{ dot:'#e07b45', bg:'#fdf3ec', border:'#f0c8a8' }, items:[
    { name:'School Fees',       desc:'Tuition fees' },
    { name:'School Expenses',   desc:'Books, uniforms, school transport' },
    { name:'Kids Activities',   desc:'Sports, drawing, hobby classes' },
    { name:'Toys & Kids Items', desc:'Toys, story books, learning materials' },
  ]},
  { section:'Food & Dining', color:{ dot:'#c96442', bg:'#fdf0eb', border:'#e8bfb0' }, items:[
    { name:'Outside Food (Family)', desc:'Restaurants, takeaways, food delivery' },
    { name:'Social Dining / Party', desc:'Dining out with friends or colleagues' },
  ]},
  { section:'Health & Personal Care', color:{ dot:'#2d7d52', bg:'#edf6f0', border:'#b5d9c4' }, items:[
    { name:'Medical',          desc:'Medicines, doctor consultations, health tests' },
    { name:'Health Insurance', desc:'Health insurance and term insurance' },
    { name:'Salon & Grooming', desc:'Haircut, beauty parlor, grooming services' },
  ]},
  { section:'Shopping & Lifestyle', color:{ dot:'#bf4a7a', bg:'#fbf0f5', border:'#edafc8' }, items:[
    { name:'Clothing',                 desc:'Clothes and tailoring charges' },
    { name:'Accessories',              desc:'Shoes, watches, belts, hair accessories' },
    { name:'Electronics & Appliances', desc:'Phone, TV, fridge, washing machine etc.' },
    { name:'Home Improvement',         desc:'Curtains, bedsheets, furniture, decor' },
    { name:'Home Repairs',             desc:'Plumbing, carpentry, repair work' },
  ]},
  { section:'Entertainment', color:{ dot:'#b5860d', bg:'#fdf8ec', border:'#e8d8a0' }, items:[
    { name:'Movies',               desc:'Cinema tickets' },
    { name:'Digital Subscriptions',desc:'Office 365, cloud storage, paid apps, games' },
    { name:'Alcohol',              desc:'Alcohol purchases' },
  ]},
  { section:'Travel', color:{ dot:'#9c4abf', bg:'#f7f0fb', border:'#d4b0ed' }, items:[
    { name:'Short Trips',     desc:'Bus, train, flight travel to hometown or relatives' },
    { name:'Vacation Travel', desc:'Tourist vacations including stay and activities' },
  ]},
  { section:'Social & Cultural', color:{ dot:'#4a9c7a', bg:'#eef7f3', border:'#b0d9c8' }, items:[
    { name:'Gifts',               desc:'Gifts for birthdays, weddings, functions' },
    { name:'Festivals & Pooja',   desc:'Festival purchases, temple offerings' },
    { name:'Donations / Charity', desc:'Donations, philanthropy, tips' },
  ]},
  { section:'Financial', color:{ dot:'#5a8c2d', bg:'#f0f6ea', border:'#c4d9a8' }, items:[
    { name:'Investments',    desc:'PPF, NPS, RD, Sukanya Samruddhi, NCS etc.' },
    { name:'Gold',           desc:'Gold purchases' },
    { name:'Parents Support',desc:'Financial support for parents' },
  ]},
  { section:'Miscellaneous', color:{ dot:'#7a7870', bg:'#f2f1ee', border:'#cccab8' }, items:[
    { name:'Others', desc:'Any uncategorized expense' },
  ]},
];

export const CAT_COLORS = {};
EXPENSE_SECTIONS.forEach(sec => { sec.items.forEach(item => { CAT_COLORS[item.name] = sec.color; }); });

export const INC_COLORS = {
  'Salary':                { dot:'#2d7d52', bg:'#edf6f0', border:'#b5d9c4' },
  'Freelance':             { dot:'#2563a8', bg:'#eff5fc', border:'#b0cced' },
  'Rental Income':         { dot:'#b5860d', bg:'#fdf8ec', border:'#e8d8a0' },
  'Business Income':       { dot:'#c96442', bg:'#fdf0eb', border:'#e8bfb0' },
  'Investments/Dividends': { dot:'#7c5cbf', bg:'#f4f0fb', border:'#cfc0ed' },
  'Gifts':                 { dot:'#bf4a7a', bg:'#fbf0f5', border:'#edafc8' },
  'Other':                 { dot:'#7a7870', bg:'#f2f1ee', border:'#cccab8' },
};

export const DEFAULT_EXPENSE_CATS = EXPENSE_SECTIONS.flatMap(s => s.items.map(i => i.name));
export const DEFAULT_INCOME_TYPES = Object.keys(INC_COLORS);

export const FULL_MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const getColor = (cat, field = 'dot') =>
  (CAT_COLORS[cat] || INC_COLORS[cat] || { dot:'#9b9890', bg:'#f2f1ee', border:'#cccab8' })[field];

export const fmt = n =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const padZ = n => String(n).padStart(2, '0');
export const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
