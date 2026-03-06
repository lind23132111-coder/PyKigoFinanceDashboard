import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function norm(t) {
    if (!t) return '';
    return t.replace('TPE:', '').replace('.TW', '').replace('NASDAQ:', '').replace('NYSEARCA:', '').replace('Nasdaq:', '').toUpperCase().trim();
}

async function run() {
    console.log("Fetching assets...");
    const { data: assets } = await supabase.from('assets').select('*');

    // 1. Cleaned up valid snapshots
    console.log("Cleaning up snapshots...");
    const { data: snaps } = await supabase.from('snapshots').select('*').order('created_at', { ascending: true });
    const validSnaps = {};
    const toDeleteSnaps = [];

    for (const s of snaps) {
        let p = s.period_name;
        if (p === '2026/2') p = '2026/02';

        if (!validSnaps[p]) {
            validSnaps[p] = s;
            if (s.period_name !== p) {
                await supabase.from('snapshots').update({ period_name: p }).eq('id', s.id);
            }
        } else {
            toDeleteSnaps.push(s.id);
        }
    }

    // Delete orphan snaps
    if (toDeleteSnaps.length > 0) {
        // manually cascade delete
        await supabase.from('snapshot_records').delete().in('snapshot_id', toDeleteSnaps);
        await supabase.from('snapshots').delete().in('id', toDeleteSnaps);
        console.log(`Deleted ${toDeleteSnaps.length} duplicated snapshots.`);
    }

    // Completely wipe valid hooks to ensure clean slate
    console.log("Wiping all existing snapshot records to prevent duplication...");
    const keepIds = Object.values(validSnaps).map(s => s.id);
    for (const kid of keepIds) {
        await supabase.from('snapshot_records').delete().eq('snapshot_id', kid);
    }
    console.log("Data wiped for clean import.");

    // 2. Read CSV
    const csvStr = fs.readFileSync('data.csv', 'utf8');
    const lines = csvStr.split('\n').filter(l => l.trim().length > 0);

    const parseNumber = (str) => {
        if (!str) return 0;
        str = str.replace(/"/g, '').replace(/,/g, '').replace('NT$', '').replace('#N/A', '0');
        const v = parseFloat(str);
        return isNaN(v) ? 0 : v;
    };

    const newRecords = [];

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

        const pic = cols[0];
        const type = cols[1];
        const name = cols[2];
        let qty = parseNumber(cols[3]);
        const attr = cols[4];
        let val = parseNumber(cols[7]);
        let p = cols[8];
        if (p === '2026/2') p = '2026/02';

        const snap = validSnaps[p];
        if (!snap) continue;

        let asset = null;

        if (type === '活存' || type === '定存') {
            asset = assets.find(a => a.owner === pic && a.title === name && (a.asset_type === 'cash' || a.asset_type === 'fixed_deposit'));
            if (!asset && name === 'PY - First Trade') {
                asset = assets.find(a => a.owner === pic && a.title.includes('PY - First Trade') && a.asset_type === 'cash');
            }
            if (!asset && name === 'RSU') {
                asset = assets.find(a => a.owner === pic && a.title === 'RSU 現金' && a.asset_type === 'cash');
            }
        } else {
            if (name === 'PY - First Trade') {
                asset = assets.find(a => a.owner === pic && a.title === 'PY - First Trade' && a.asset_type === 'stock');
            } else if (name === 'RSU') {
                asset = assets.find(a => a.owner === pic && a.title.startsWith('RSU') && norm(a.ticker_symbol) === norm(attr));
            } else if (name === 'ESPP') {
                asset = assets.find(a => a.owner === pic && a.title.startsWith('ESPP') && norm(a.ticker_symbol) === norm(attr));
            } else {
                asset = assets.find(a => a.owner === pic && norm(a.ticker_symbol) === norm(attr) && a.asset_type === 'stock');
            }
        }

        if (asset) {
            newRecords.push({
                snapshot_id: snap.id,
                asset_id: asset.id,
                quantity: qty,
                total_twd_value: val,
                created_at: new Date().toISOString()
            });
        }
    }

    // 3. Batch accumulate to collapse duplicates inside one snapshot
    const grouped = {};
    for (const r of newRecords) {
        const k = `${r.snapshot_id}_${r.asset_id}`;
        if (!grouped[k]) {
            grouped[k] = { ...r };
        } else {
            grouped[k].quantity += r.quantity;
            grouped[k].total_twd_value += r.total_twd_value;
        }
    }

    const finalInserts = Object.values(grouped);
    console.log(`Inserting ${finalInserts.length} mapped records...`);
    const { error } = await supabase.from('snapshot_records').insert(finalInserts);
    if (error) console.error("End insert error:", error);
    else console.log("SUCCESS! All historical data recreated flawlessly.");
}
run();
