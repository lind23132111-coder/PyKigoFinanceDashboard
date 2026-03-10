"use server";

import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────────
// DEMO MODE MOCK DATA
// Toggle by setting NEXT_PUBLIC_DEMO_MODE=true in .env.local
// ─────────────────────────────────────────────────────────────────
const DEMO_GOALS = [
    {
        id: "demo-goal-1", name: "新家裝修", target_amount: 1500000,
        current_funding: 800000, progress: 53.3, category: "upcoming_expense", target_date: "2026-12-31",
        meta: { spent_balance: 14500 }
    },
    {
        id: "demo-goal-2", name: "日本滑雪之旅", target_amount: 200000,
        current_funding: 150000, progress: 75.0, category: "upcoming_expense", target_date: "2026-02-28",
        meta: { spent_balance: 0 }
    }
];

const DEMO_ASSETS = [
    { id: "demo-asset-1", title: "Global Savings (USD)", owner: "PY", currency: "USD", asset_type: "cash" },
    { id: "demo-asset-2", title: "Family Trust (TWD)", owner: "Both", currency: "TWD", asset_type: "cash" }
];

// ─────────────────────────────────────────────────────────────────
// LIVE DATA FUNCTIONS
// ─────────────────────────────────────────────────────────────────
export async function getGoalsWithProgress() {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_GOALS;

    // Parallelize all 4 initial queries
    const [goalsRes, snapshotsRes, expRes] = await Promise.all([
        supabase.from('goals').select(`*, goal_asset_mapping (asset_id)`).order('priority', { ascending: true }),
        supabase.from('snapshots').select('id').not('period_name', 'like', 'ARCHIVE%').order('created_at', { ascending: false }).limit(1),
        supabase.from('expenses').select('goal_id, amount').eq('is_reviewed', true).not('goal_id', 'is', null)
    ]);

    const { data: goals, error: goalsError } = goalsRes;
    const { data: latestSnapshots } = snapshotsRes;
    const { data: expenseSums, error: expError } = expRes;

    if (goalsError || !goals) return [];

    const latestSnapshot = latestSnapshots?.[0];
    let records: any[] = [];

    if (latestSnapshot) {
        const { data } = await supabase
            .from('snapshot_records').select('asset_id, total_twd_value')
            .eq('snapshot_id', latestSnapshot.id);
        if (data) records = data;
    }

    const valueMap = new Map();
    records.forEach(r => valueMap.set(r.asset_id, Number(r.total_twd_value)));

    const expenseMap = new Map();
    if (!expError && expenseSums) {
        expenseSums.forEach(e => {
            const current = expenseMap.get(e.goal_id) || 0;
            expenseMap.set(e.goal_id, current + Number(e.amount));
        });
    }

    return goals.map(goal => {
        let current_funding = 0;
        const mappings = Array.isArray(goal.goal_asset_mapping) ? goal.goal_asset_mapping : [];
        mappings.forEach((m: any) => { current_funding += valueMap.get(m.asset_id) || 0; });
        
        // Add reviewed expenses to total progress as per Issue #12
        const spentAmount = expenseMap.get(goal.id) || 0;
        const totalProgressAmount = current_funding + spentAmount;
        
        const progress = goal.target_amount > 0 ? (totalProgressAmount / goal.target_amount) * 100 : 0;
        return { 
            ...goal, 
            current_funding: totalProgressAmount, // This reflects the total 'allocated' amount (cash + spent)
            progress: Math.min(progress, 100),
            meta: { cash_balance: current_funding, spent_balance: spentAmount }
        };
    });
}

export async function createGoal(payload: { name: string, target_amount: number, category: string, target_date: string | null, asset_ids?: string[] }) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return { id: `demo-goal-${Date.now()}` };

    const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert({ name: payload.name, target_amount: payload.target_amount, category: payload.category || 'long_term', target_date: payload.target_date || null, status: 'on_track' })
        .select().single();

    if (goalError) throw goalError;

    if (payload.asset_ids && payload.asset_ids.length > 0) {
        const mappings = payload.asset_ids.map(asset_id => ({ goal_id: goalData.id, asset_id }));
        const { error: mappingError } = await supabase.from('goal_asset_mapping').insert(mappings);
        if (mappingError) throw mappingError;
    }

    return goalData;
}

export async function getActiveAssets() {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_ASSETS;

    const { data, error } = await supabase.from('assets').select('*').eq('is_active', true).order('title', { ascending: true });
    if (error) return [];
    return data;
}

export async function toggleAssetActive(assetId: string, isActive: boolean) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
    const { error } = await supabase.from('assets').update({ is_active: isActive }).eq('id', assetId);
    if (error) throw error;
    return true;
}

export async function addNewAsset(payload: { title: string, owner: string, asset_type: string, currency: string, ticker_symbol?: string }) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
        return { id: `demo-asset-${Date.now()}`, ...payload, is_active: true, ticker_symbol: payload.ticker_symbol || null };
    }
    const { data, error } = await supabase.from('assets')
        .insert({ ...payload, ticker_symbol: payload.ticker_symbol || null, is_active: true })
        .select().single();
    if (error) throw error;
    return data;
}

export async function deleteGoal(goalId: string) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;

    // Delete asset mappings first (foreign key constraint)
    await supabase.from('goal_asset_mapping').delete().eq('goal_id', goalId);

    // Then delete the goal itself
    const { error } = await supabase.from('goals').delete().eq('id', goalId);
    if (error) throw error;
    return true;
}

export async function updateGoal(goalId: string, payload: { name: string, target_amount: number, category: string, target_date: string | null, asset_ids?: string[] }) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return { id: goalId };

    // 1. Update Goal basic info
    const { error: goalError } = await supabase
        .from('goals')
        .update({
            name: payload.name,
            target_amount: payload.target_amount,
            category: payload.category,
            target_date: payload.target_date || null
        })
        .eq('id', goalId);

    if (goalError) throw goalError;

    // 2. Refresh Asset Mapping
    // Delete existing
    await supabase.from('goal_asset_mapping').delete().eq('goal_id', goalId);

    // Insert new
    if (payload.asset_ids && payload.asset_ids.length > 0) {
        const mappings = payload.asset_ids.map(asset_id => ({
            goal_id: goalId,
            asset_id: asset_id
        }));
        const { error: mappingError } = await supabase.from('goal_asset_mapping').insert(mappings);
        if (mappingError) throw mappingError;
    }

    return { id: goalId };
}
