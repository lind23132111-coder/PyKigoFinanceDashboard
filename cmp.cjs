const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    console.log("Starting comparison...");

    // 1. Read CSV totals
    const csvStr = fs.readFileSync('data.csv', 'utf8');
    const lines = csvStr.split('\n').filter(l => l.trim().length > 0);
    const parseNumber = (str) => {
        if (!str) return 0;
        str = str.replace(/"/g, '').replace(/,/g, '').replace('NT$', '').replace('#N/A', '0');
        const v = parseFloat(str);
        return isNaN(v) ? 0 : v;
    };

    const csvTotals = {};
    for (let i = 1; i < lines.length; i++) {
        let rowStr = lines[i];
        let cols = [];
        let inQuote = false;
        let buf = '';
        for (let c = 0; c < rowStr.length; c++) {
            if (rowStr[c] === '"') { inQuote = !inQuote; }
            else if (rowStr[c] === ',' && !inQuote) { cols.push(buf); buf = ''; }
            else { buf += rowStr[c]; }
        }
        cols.push(buf);
        let val = parseNumber(cols[7]); // NTD
        let p = cols[8];
        if (p === '2026/2') p = '2026/02';
        if (!csvTotals[p]) csvTotals[p] = 0;
        csvTotals[p] += val;
    }

    // 2. Read DB totals
    console.log("Fetching snapshots...");
    const { data: snaps, error: snapErr } = await supabase.from('snapshots').select('id, period_name');
    if (snapErr) { console.error(snapErr); return; }

    const snapMap = {};
    snaps.forEach(s => {
        if (!s.period_name.startsWith('ARCHIVE')) {
            snapMap[s.id] = s.period_name;
        }
    });

    console.log("Fetching snapshot records...");
    const { data: records, error: recErr } = await supabase.from('snapshot_records').select('snapshot_id, total_twd_value');
    if (recErr) { console.error(recErr); return; }

    const dbTotals = {};
    records.forEach(r => {
        const p = snapMap[r.snapshot_id];
        if (p) {
            if (!dbTotals[p]) dbTotals[p] = 0;
            dbTotals[p] += Number(r.total_twd_value);
        }
    });

    console.log('\n--- Comparison (CSV vs DB) ---');
    console.log(`Period      | CSV          | DB           | Diff (DB - CSV)`);
    console.log(`---------------------------------------------------------`);
    for (const p of Object.keys(csvTotals).sort()) {
        const c = Math.round(csvTotals[p]);
        const d = Math.round(dbTotals[p] || 0);
        console.log(`${p.padEnd(11)} | ${c.toString().padEnd(12)} | ${d.toString().padEnd(12)} | ${d - c}`);
    }
    console.log("Done.");
}
run();
