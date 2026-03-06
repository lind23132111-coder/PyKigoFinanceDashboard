require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching all snapshot_record IDs...');
    let deleted = 0;
    while (true) {
        let { data, error } = await supabase.from('snapshot_records').select('id').limit(500);
        if (error) { console.error(error); break; }
        if (!data || data.length === 0) break;

        let ids = data.map(d => d.id);
        await supabase.from('snapshot_records').delete().in('id', ids);
        deleted += ids.length;
        console.log('Deleted batch of ' + ids.length);
    }
    console.log(`Done cleaning! Deleted total: ${deleted}`);
}
run();
