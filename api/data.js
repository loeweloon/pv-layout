// api/data.js — Vercel serverless function
// Node.js 18+ — fetch is built-in, no extra packages needed
// Required env var: NOTION_TOKEN (set in Vercel project settings)

const DB_ID = 'eeb44e71b1e6489481ad6a813c5833e0';
const NOTION_API = 'https://api.notion.com/v1';

function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };
}

function extractProp(prop) {
  if (!prop) return null;
  switch (prop.type) {
    case 'title':     return prop.title?.map(t => t.plain_text).join('') || null;
    case 'rich_text': return prop.rich_text?.map(t => t.plain_text).join('') || null;
    case 'number':    return prop.number ?? null;
    case 'select':    return prop.select?.name || null;
    case 'checkbox':  return prop.checkbox ?? false;
    case 'url':       return prop.url || null;
    case 'formula':
      if (prop.formula?.type === 'number') return prop.formula.number ?? null;
      if (prop.formula?.type === 'string') return prop.formula.string || null;
      return null;
    default:          return null;
  }
}

function mapRow(page) {
  const p = page.properties;
  const g = name => extractProp(p[name]);
  const num = name => g(name) ?? 0;

  const sqft = num('Size (sqft)');
  const band = sqft <= 882 ? 800 : sqft <= 989 ? 900 : 1000;
  const baths = num('Bathrooms');

  return {
    notionId:    page.id,
    project:     g('Project Name'),
    type:        g('Unit Type'),
    sqft,
    band,
    rooms:       num('Bedrooms'),
    baths,
    dualKey:     g('Dual-Key') || false,
    status:      g('Completion Status'),
    badge:       g('Completion Badge') || null,

    mb:          [num('MB L (mm)'),          num('MB W (mm)')],
    mbath:       [num('MBath L (mm)'),       num('MBath W (mm)')],
    mbShower:    [num('MB Shower L (mm)'),   num('MB Shower W (mm)')],
    bed2:        [num('Bed2 L (mm)'),        num('Bed2 W (mm)')],
    bath2:       baths >= 2 ? [num('Bath2 L (mm)'),        num('Bath2 W (mm)')]        : null,
    bath2Shower: baths >= 2 ? [num('Bath2 Shower L (mm)'), num('Bath2 Shower W (mm)')] : null,
    living:      [num('Living L (mm)'),      num('Living W (mm)')],
    dining:      [num('Dining L (mm)'),      num('Dining W (mm)')],
    kitchen:     [num('Kitchen L (mm)'),     num('Kitchen W (mm)')],
    balcony:     [num('Balcony L (mm)'),     num('Balcony W (mm)')],

    planBed1:    g('Plan — Bed 1'),
    planBed2:    g('Plan — Bed 2'),
    planBed3:    g('Plan — Bed 3'),
    planBed4:    g('Plan — Bed 4'),
    planBath1:   g('Plan — Bath 1'),
    planShower1: g('Plan — Shower 1'),
    planBath2:   g('Plan — Bath 2'),
    planShower2: g('Plan — Shower 2'),
    planBath3:   g('Plan — Bath 3'),
    planShower3: g('Plan — Shower 3'),
    planBath4:   g('Plan — Bath 4'),
    planShower4: g('Plan — Shower 4'),
    planLiving:  g('Plan — Living & Dining'),
    planKitchen: g('Plan — Kitchen'),
    planYard:    g('Plan — Yard'),
    planBalcony: g('Plan — Balcony'),
  };
}

async function fetchAllRows() {
  const rows = [];
  let cursor = undefined;

  do {
    const body = {
      page_size: 100,
      sorts: [{ property: 'Size (sqft)', direction: 'ascending' }],
    };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(`${NOTION_API}/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Notion API ${res.status}: ${err.message}`);
    }

    const data = await res.json();
    rows.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return rows;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (!process.env.NOTION_TOKEN) {
    res.status(500).json({ error: 'NOTION_TOKEN environment variable is not set.' });
    return;
  }

  try {
    const raw = await fetchAllRows();
    const data = raw.map(mapRow).filter(r => r.project);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({ data, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Notion fetch failed:', err);
    res.status(500).json({ error: err.message });
  }
};
