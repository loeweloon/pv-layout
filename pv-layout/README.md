# PV Unit Layout Comparison — Deploy Guide

## What's in this folder

```
pv-layout/
├── public/
│   └── index.html      ← The widget (served as the website)
├── api/
│   └── data.js         ← Serverless function (calls Notion API securely)
├── vercel.json         ← Vercel config
└── README.md
```

## How it works

```
Your browser → index.html → calls /api/data → Notion API → returns live data
```

The Notion token lives only on Vercel's servers inside `api/data.js`.
It is never exposed to the browser. Anyone viewing the page source
cannot access your Notion workspace.

---

## Deploy steps

### Step 1 — Get a Notion Integration Token

1. Go to https://www.notion.so/my-integrations
2. Click **New integration**
3. Name it `PV Layout Widget`, select your workspace, click **Submit**
4. Copy the **Internal Integration Token** (starts with `secret_...`)
5. Open your **PV Unit Layout Reference v2** database in Notion
6. Click ··· (top right) → **Connections** → Add your new integration

### Step 2 — Push to GitHub

1. Create a new repo at github.com (name: `pv-layout`, Public or Private)
2. Push these files:
   ```bash
   cd pv-layout
   git init
   git add .
   git commit -m "initial deploy"
   git branch -M main
   git remote add origin https://github.com/loeweloon/pv-layout.git
   git push -u origin main
   ```

### Step 3 — Deploy to Vercel

1. Go to https://vercel.com → **Add New Project**
2. Import your `pv-layout` GitHub repo
3. Set **Root Directory** to `/` (the repo root)
4. Under **Environment Variables**, add:
   - Key: `NOTION_TOKEN`
   - Value: `secret_xxxxxxxxxxxx` (your token from Step 1)
5. Click **Deploy**

Vercel gives you a URL like `https://pv-layout.vercel.app` — that's your widget URL.

### Step 4 — Embed in Notion

1. Open your **PV Layout Comparison — Widget View** Notion page
2. Type `/embed` → paste your Vercel URL
3. Resize the embed to full width
4. Publish via **Share → Publish to web** → copy the Notion Sites URL
5. Share that Notion Sites URL with your boss

---

## Updating data

- **Dimensions / project info**: Edit directly in the Notion database. The widget shows a ↻ Refresh button — click it to pull latest data without reloading the page.
- **Floor plan images**: Paste a public image URL into the relevant `Plan — Bed 1`, `Plan — Bath 1` etc. column in Notion → click ↻ Refresh in the widget.
- **New projects**: Add a new row in the Notion database → widget picks it up on next refresh.

No code changes needed for any of the above.

---

## Notion database
https://www.notion.so/2e685d29c3de4011a02aa9916aaf685d
