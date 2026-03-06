require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
    // 1. Check snapshots
    const { data: snaps } = await supabase.from('snapshots').select('id, period_name').like('period_name', '%2026%');
    console.log("Snapshots:", snaps);

    // 2. See how many records the single 2026/02 has
    const validSnap = snaps.find(s => s.period_name === '2026/02');
    if (!validSnap) {
        console.log("No valid snap matching '2026/02' found.");
        return;
    }
    const { data: counts } = await supabase.from('snapshot_records').select('id', { count: 'exact' }).eq('snapshot_id', validSnap.id);
    console.log("Records for valid 2026/02 snapshot_id " + validSnap.id + " count: " + counts.length);

    // 3. Optional cleanup if count is > 24
    if (counts.length > 24) {
        console.log("Wait, why are there > 24 records? Let's check duplicates.");
        const { data: recs } = await supabase.from('snapshot_records').select('*').eq('snapshot_id', validSnap.id);
        const grouped = {};
        for (const r of recs) {
            if (!grouped[r.asset_id]) grouped[r.asset_id] = 0;
            grouped[r.asset_id]++;
        }
        for (const k in grouped) {
            if (grouped[k] > 1) {
                console.log("Asset ID " + k + " appears " + grouped[k] + " times!");
            }
        }

        // Wipe all and reinsert cleanly
        console.log("Wiping all 2026/02 records...");
        await supabase.from('snapshot_records').delete().eq('snapshot_id', validSnap.id);
        console.log("Wiped.");
    }
})();
