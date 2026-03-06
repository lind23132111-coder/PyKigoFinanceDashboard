import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://eybenbeprqtgcoeozezo.supabase.co',
    'sb_publishable_cFSLTvbG_VC6iolm-ToT2A_1vXPK9Tw'
);

async function checkAssets() {
    const { data: latestSnapshot } = await supabase
        .from('snapshots')
        .select('id, period_name')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    console.log("Latest snapshot:", latestSnapshot);

    const { data: assets } = await supabase
        .from('assets')
        .select('id, title, is_active')
        .eq('is_active', true);

    console.log(`Total active assets: ${assets.length}`);

    const { data: records } = await supabase
        .from('snapshot_records')
        .select('asset_id, quantity')
        .eq('snapshot_id', latestSnapshot.id);

    const recordMap = new Map();
    records.forEach(r => recordMap.set(r.asset_id, r.quantity));

    let emptyCount = 0;
    for (const asset of assets) {
        const qty = recordMap.get(asset.id);
        if (qty === 0 || qty === undefined || qty === null) {
            console.log(`Empty/Missing Asset: ${asset.title} (Qty: ${qty})`);
            emptyCount++;
        }
    }
}

checkAssets();
