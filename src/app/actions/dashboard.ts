"use server";

import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────────
// DEMO MODE MOCK DATA
// Toggle by setting NEXT_PUBLIC_DEMO_MODE=true in .env.local
// ─────────────────────────────────────────────────────────────────
const DEMO_DASHBOARD_DATA = {
    totalNetWorth: 98420000,
    currencyData: [
        { name: "USD", value: 68.0, raw_value: 66925600, color: "#f59e0b", originalKey: "USD" },
        { name: "TWD", value: 22.0, raw_value: 21652400, color: "#3b82f6", originalKey: "TWD" },
        { name: "JPY", value: 10.0, raw_value: 9842000, color: "#ef4444", originalKey: "JPY" }
    ],
    allocationData: [
        { name: "RSU", value: 18.0, raw_value: 17715600, color: "#10b981", originalKey: "rsu" },
        { name: "stock", value: 62.0, raw_value: 61020400, color: "#8b5cf6", originalKey: "stock" },
        { name: "cash", value: 12.0, raw_value: 11810400, color: "#3b82f6", originalKey: "cash" },
        { name: "fixed_deposit", value: 8.0, raw_value: 7873600, color: "#f59e0b", originalKey: "fixed_deposit" }
    ],
    ownershipData: [
        { name: "PY", value: 45.0, raw_value: 44289000, color: "#10b981", originalKey: "PY" },
        { name: "Kigo", value: 30.0, raw_value: 29526000, color: "#fcd34d", originalKey: "Kigo" },
        { name: "Both", value: 25.0, raw_value: 24605000, color: "#6366f1", originalKey: "Both" }
    ],
    trendData: [
        { id: "snap-1", name: "2024/4", assets: 4200, fullAssets: 4200, filteredAssets: 4200, color: "#94a3b8" },
        { id: "snap-2", name: "2024/5", assets: 4850, fullAssets: 4850, filteredAssets: 4850, color: "#94a3b8" },
        { id: "snap-3", name: "2024/8", assets: 6200, fullAssets: 6200, filteredAssets: 6200, color: "#94a3b8" },
        { id: "snap-4", name: "2025/5", assets: 8400, fullAssets: 8400, filteredAssets: 8400, color: "#94a3b8" },
        { id: "demo-snap-v3", name: "2026/2", assets: 9842, fullAssets: 9842, filteredAssets: 9842, color: "#22c55e" }
    ],
    strategyAllocationData: [
        { name: "核心持股 (大型股)", value: 48.0, raw_value: 47241600, color: "#10b981", originalKey: "核心持股 (大型股)" },
        { name: "成長動能 (科技股)", value: 28.0, raw_value: 27557600, color: "#6366f1", originalKey: "成長動能 (科技股)" },
        { name: "定存股 (領息資產)", value: 14.0, raw_value: 13778800, color: "#f59e0b", originalKey: "定存股 (領息資產)" },
        { name: "投機/現金資產", value: 10.0, raw_value: 9842000, color: "#94a3b8", originalKey: "投機/現金資產" }
    ],
    latestSnapshot: { id: "demo-snap-v3", period_name: "2026/2", created_at: new Date().toISOString() },
    snapshotDetails: {
        "demo-snap-v3": {
            period_name: "2026/2",
            totalNetWorth: 98420000,
            rawRecords: [
                { id: "r1", total_twd_value: 17715600, assets: { currency: "USD", asset_type: "rsu", owner: "PY" } },
                { id: "r2", total_twd_value: 49210000, assets: { currency: "USD", asset_type: "stock", owner: "PY" } },
                { id: "r3", total_twd_value: 11810400, assets: { currency: "USD", asset_type: "stock", owner: "Kigo" } },
                { id: "r4", total_twd_value: 9842000, assets: { currency: "TWD", asset_type: "cash", owner: "Both" } },
                { id: "r5", total_twd_value: 7873600, assets: { currency: "JPY", asset_type: "fixed_deposit", owner: "Kigo" } },
                { id: "r6", total_twd_value: 1968400, assets: { currency: "TWD", asset_type: "cash", owner: "Both" } }
            ]
        },
        "snap-4": {
            period_name: "2025/5",
            totalNetWorth: 84000000,
            rawRecords: [
                { id: "s4-1", total_twd_value: 50000000, assets: { currency: "USD", asset_type: "stock", owner: "PY" } },
                { id: "s4-2", total_twd_value: 10000000, assets: { currency: "TWD", asset_type: "cash", owner: "Both" } },
                { id: "s4-3", total_twd_value: 15000000, assets: { currency: "USD", asset_type: "rsu", owner: "PY" } },
                { id: "s4-4", total_twd_value: 9000000, assets: { currency: "USD", asset_type: "stock", owner: "Kigo" } }
            ]
        },
        "snap-3": {
            period_name: "2024/8",
            totalNetWorth: 62000000,
            rawRecords: [
                { id: "s3-1", total_twd_value: 35000000, assets: { currency: "USD", asset_type: "stock", owner: "PY" } },
                { id: "s3-2", total_twd_value: 12000000, assets: { currency: "TWD", asset_type: "cash", owner: "Both" } },
                { id: "s3-3", total_twd_value: 10000000, assets: { currency: "USD", asset_type: "rsu", owner: "PY" } },
                { id: "s3-4", total_twd_value: 5000000, assets: { currency: "JPY", asset_type: "fixed_deposit", owner: "Kigo" } }
            ]
        },
        "snap-2": {
            period_name: "2024/5",
            totalNetWorth: 48500000,
            rawRecords: [
                { id: "s2-1", total_twd_value: 28000000, assets: { currency: "USD", asset_type: "stock", owner: "PY" } },
                { id: "s2-2", total_twd_value: 10500000, assets: { currency: "TWD", asset_type: "cash", owner: "Both" } },
                { id: "s2-3", total_twd_value: 10000000, assets: { currency: "USD", asset_type: "rsu", owner: "PY" } }
            ]
        },
        "snap-1": {
            period_name: "2024/4",
            totalNetWorth: 42000000,
            rawRecords: [
                { id: "s1-1", total_twd_value: 25000000, assets: { currency: "USD", asset_type: "stock", owner: "PY" } },
                { id: "s1-2", total_twd_value: 10000000, assets: { currency: "TWD", asset_type: "cash", owner: "Both" } },
                { id: "s1-3", total_twd_value: 7000000, assets: { currency: "USD", asset_type: "rsu", owner: "PY" } }
            ]
        }
    },
    rawRecords: [
        { id: "r1", total_twd_value: 17715600, assets: { currency: "USD", asset_type: "rsu", owner: "PY" } },
        { id: "r2", total_twd_value: 49210000, assets: { currency: "USD", asset_type: "stock", owner: "PY" } },
        { id: "r3", total_twd_value: 11810400, assets: { currency: "USD", asset_type: "stock", owner: "Kigo" } },
        { id: "r4", total_twd_value: 9842000, assets: { currency: "TWD", asset_type: "cash", owner: "Both" } },
        { id: "r5", total_twd_value: 7873600, assets: { currency: "JPY", asset_type: "fixed_deposit", owner: "Kigo" } },
        { id: "r6", total_twd_value: 1968400, assets: { currency: "TWD", asset_type: "cash", owner: "Both" } }
    ]
};

const DEMO_REPORT_DATA = {
    summaryCards: [
        { title: "家庭總資產淨值", amount: 98420000, subtitle: "資料期數：2026/2", borderColor: "border-blue-500" },
        { title: "PY 個人份額", amount: 44289000, subtitle: "分配佔比 45%", borderColor: "border-emerald-500" },
        { title: "Kigo 個人份額", amount: 29526000, subtitle: "分配佔比 30%", borderColor: "border-amber-400" },
        { title: "Both (共同帳戶)", amount: 24605000, subtitle: "分配佔比 25%", borderColor: "border-indigo-500" },
    ],
    assetItems: [
        { id: 1, owner: "PY", ownerColor: "bg-emerald-100 text-emerald-700", type: "RSU", name: "Global Tech RSU", originalAmount: "2,000 股 (@ $280.00 USD)", ntdAmount: 17715600, category: "Stocks" },
        { id: 2, owner: "Kigo", ownerColor: "bg-amber-100 text-amber-700", type: "股票", name: "Semi Giant (2330)", originalAmount: "1,500 股 (@ $1,050.00 TWD)", ntdAmount: 1575000, category: "Stocks" },
        { id: 3, owner: "Both", ownerColor: "bg-indigo-100 text-indigo-700", type: "活存", name: "Family Reserve Fund", originalAmount: "$ 8,500,000 (TWD)", ntdAmount: 8500000, category: "Cash" }
    ],
    liveMarketData: [
        { symbol: "MSFT", price: 420.5, type: "stock" },
        { symbol: "GOOGL", price: 155.1, type: "stock" },
        { symbol: "TSM", price: 145.2, type: "stock" },
        { symbol: "USD/TWD", price: 31.6, type: "fx" },
        { symbol: "JPY/TWD", price: 0.208, type: "fx" }
    ],
    periodName: "2026/2"
};

// ─────────────────────────────────────────────────────────────────
// LIVE DATA FUNCTIONS
// ─────────────────────────────────────────────────────────────────
export async function getLatestDashboardData(): Promise<any> {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_DASHBOARD_DATA;

    // 1. Fetch the recent snapshots for trend
    const { data: recentSnapshots, error: snapError } = await supabase
        .from('snapshots')
        .select('*')
        .not('period_name', 'like', 'ARCHIVE%')
        .order('created_at', { ascending: false })
        .limit(5);

    if (snapError || !recentSnapshots || recentSnapshots.length === 0) {
        return { totalNetWorth: 0, currencyData: [], allocationData: [], ownershipData: [], trendData: [], latestSnapshot: null };
    }

    const latestSnapshot = recentSnapshots[0];
    const snapshotIds = recentSnapshots.map((s: any) => s.id);

    // 2. Fetch records for all snapshots, joined with assets
    const { data: allRecords, error: recordsError } = await supabase
        .from('snapshot_records')
        .select(`*, assets (title, owner, asset_type, currency, ticker_symbol, strategy_category)`)
        .in('snapshot_id', snapshotIds);

    if (recordsError || !allRecords) {
        return { totalNetWorth: 0, currencyData: [], allocationData: [], ownershipData: [], trendData: [], strategyAllocationData: [], latestSnapshot };
    }

    const snapshotDetails: Record<string, any> = {};

    recentSnapshots.forEach((snap: any) => {
        const records = allRecords.filter(r => r.snapshot_id === snap.id);
        let totalNetWorth = 0;
        const currencyMap: Record<string, number> = {};
        const allocationMap: Record<string, number> = {};
        const ownershipMap: Record<string, number> = {};
        const strategyMap: Record<string, number> = {};

        records.forEach(record => {
            const val = Number(record.total_twd_value) || 0;
            totalNetWorth += val;
            const asset = Array.isArray(record.assets) ? record.assets[0] : record.assets;
            if (asset) {
                currencyMap[asset.currency] = (currencyMap[asset.currency] || 0) + val;
                allocationMap[asset.asset_type] = (allocationMap[asset.asset_type] || 0) + val;
                ownershipMap[asset.owner] = (ownershipMap[asset.owner] || 0) + val;

                const cat = asset.strategy_category || '核心持股 (大型股)'; // Default fallback for now
                strategyMap[cat] = (strategyMap[cat] || 0) + val;
            }
        });

        const formatPieData = (map: Record<string, number>, colorMap: Record<string, string>) =>
            Object.entries(map).map(([name, value]) => ({
                name, value: Number((value / (totalNetWorth || 1) * 100).toFixed(1)),
                raw_value: value, color: colorMap[name] || "#CBD5E1", originalKey: name
            })).sort((a, b) => b.value - a.value);

        snapshotDetails[snap.id] = {
            period_name: snap.period_name || snap.created_at.split('T')[0],
            totalNetWorth, rawRecords: records,
            currencyData: formatPieData(currencyMap, { USD: "#f59e0b", TWD: "#3b82f6", JPY: "#ef4444" }),
            allocationData: formatPieData(allocationMap, { cash: "#3b82f6", stock: "#8b5cf6", fixed_deposit: "#f59e0b", rsu: "#10b981" }),
            ownershipData: formatPieData(ownershipMap, { PY: "#10b981", Kigo: "#fcd34d", Both: "#6366f1" }),
            strategyAllocationData: formatPieData(strategyMap, {})
        };
    });

    const trendMap: Record<string, number> = {};
    allRecords.forEach(r => { trendMap[r.snapshot_id] = (trendMap[r.snapshot_id] || 0) + (Number(r.total_twd_value) || 0); });

    const trendData = [...recentSnapshots].reverse().map((snap: any, index: number, arr: any[]) => ({
        id: snap.id,
        name: snap.period_name || snap.created_at.split('T')[0],
        assets: Math.round((trendMap[snap.id] || 0) / 10000),
        color: index === arr.length - 1 ? "#22c55e" : "#94a3b8"
    }));

    const latestDetails = snapshotDetails[latestSnapshot.id] || {};
    return {
        totalNetWorth: latestDetails.totalNetWorth || 0,
        currencyData: latestDetails.currencyData || [],
        allocationData: latestDetails.allocationData || [],
        ownershipData: latestDetails.ownershipData || [],
        strategyAllocationData: latestDetails.strategyAllocationData || [],
        trendData, latestSnapshot, snapshotDetails,
        rawRecords: allRecords.filter(r => r.snapshot_id === latestSnapshot.id)
    };
}

export async function getReportData() {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_REPORT_DATA;

    const { data: marketCache } = await supabase.from('market_cache').select('*');
    const { data: latestSnapshot } = await supabase
        .from('snapshots').select('*')
        .not('period_name', 'like', 'ARCHIVE%')
        .order('created_at', { ascending: false }).limit(1).single();

    let records: any[] = [];
    if (latestSnapshot) {
        const { data } = await supabase.from('snapshot_records')
            .select(`*, assets (id, title, owner, asset_type, currency, ticker_symbol)`)
            .eq('snapshot_id', latestSnapshot.id);
        if (data) records = data;
    }

    let totalAmount = 0;
    const ownerTotals = { PY: 0, Kigo: 0, Both: 0 };

    const assetItems = records.map((record) => {
        const asset = Array.isArray(record.assets) ? record.assets[0] : record.assets;
        if (!asset) return null;
        const val = Number(record.total_twd_value) || 0;
        totalAmount += val;
        if (asset.owner === 'PY') ownerTotals.PY += val;
        else if (asset.owner === 'Kigo') ownerTotals.Kigo += val;
        else if (asset.owner === 'Both') ownerTotals.Both += val;

        const isCash = asset.asset_type === 'cash' || asset.asset_type === 'fixed_deposit';
        const isNTD = asset.currency === 'TWD';
        const originalAmount = isCash
            ? (isNTD ? `$ ${Number(record.quantity).toLocaleString()} (TWD)` : `$ ${Number(record.quantity).toLocaleString()} (${asset.currency})`)
            : `${Number(record.quantity).toLocaleString()} 股 (@ $${Number(record.unit_price).toFixed(2)} ${asset.currency})`;

        return {
            id: record.id,
            owner: asset.owner,
            ownerColor: asset.owner === 'PY' ? 'bg-emerald-100 text-emerald-700' : asset.owner === 'Kigo' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700',
            type: asset.asset_type === 'rsu' ? 'RSU' : asset.asset_type === 'stock' ? '股票' : asset.asset_type === 'fixed_deposit' ? '定存' : '活存',
            name: asset.title,
            originalAmount,
            ntdAmount: val,
            category: isCash ? 'Cash' : 'Stocks'
        };
    }).filter(Boolean);

    const liveMarketData = (marketCache || []).map((mc: any) => ({
        symbol: mc.symbol,
        price: Number(mc.price),
        type: mc.symbol.includes('/') ? 'fx' : 'stock'
    }));

    const summaryCards = [
        { title: "家庭總資產淨值", amount: totalAmount, subtitle: `資料期數：${latestSnapshot?.period_name || '-'}`, borderColor: "border-blue-500" },
        { title: "PY 資產總計", amount: ownerTotals.PY, subtitle: "個人獨立帳戶合計", borderColor: "border-emerald-500" },
        { title: "Kigo 資產總計", amount: ownerTotals.Kigo, subtitle: "個人獨立帳戶合計", borderColor: "border-amber-400" },
        { title: "Both (共同帳戶)", amount: ownerTotals.Both, subtitle: "共同家用與投資", borderColor: "border-indigo-500" },
    ];

    return { summaryCards, assetItems, liveMarketData, periodName: latestSnapshot?.period_name || '-' };
}
