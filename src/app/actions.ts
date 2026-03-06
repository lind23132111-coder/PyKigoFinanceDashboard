"use server";

import { supabase } from "@/utils/supabase/client";
import { GoogleGenAI } from "@google/genai";

export async function getLatestDashboardData() {
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

    // 2. Fetch the records for all these snapshots, join with assets
    const { data: allRecords, error: recordsError } = await supabase
        .from('snapshot_records')
        .select(`
            *,
            assets (
                title, owner, asset_type, currency, ticker_symbol
            )
        `)
        .in('snapshot_id', snapshotIds);

    if (recordsError || !allRecords) {
        return { totalNetWorth: 0, currencyData: [], allocationData: [], ownershipData: [], trendData: [], latestSnapshot };
    }

    const snapshotDetails: Record<string, any> = {};

    recentSnapshots.forEach((snap: any) => {
        const records = allRecords.filter(r => r.snapshot_id === snap.id);

        let totalNetWorth = 0;
        const currencyMap: Record<string, number> = {};
        const allocationMap: Record<string, number> = {};
        const ownershipMap: Record<string, number> = {};

        records.forEach(record => {
            const val = Number(record.total_twd_value) || 0;
            totalNetWorth += val;

            const asset = Array.isArray(record.assets) ? record.assets[0] : record.assets;
            if (asset) {
                currencyMap[asset.currency] = (currencyMap[asset.currency] || 0) + val;
                allocationMap[asset.asset_type] = (allocationMap[asset.asset_type] || 0) + val;
                ownershipMap[asset.owner] = (ownershipMap[asset.owner] || 0) + val;
            }
        });

        const formatPieData = (map: Record<string, number>, colorMap: Record<string, string>) => {
            return Object.entries(map).map(([name, value]) => ({
                name,
                value: Number((value / (totalNetWorth || 1) * 100).toFixed(1)),
                raw_value: value,
                color: colorMap[name] || "#CBD5E1"
            })).sort((a, b) => b.value - a.value);
        };

        snapshotDetails[snap.id] = {
            period_name: snap.period_name || snap.created_at.split('T')[0],
            totalNetWorth,
            rawRecords: records, // NEW: Expose raw records for client-side filtering
            currencyData: formatPieData(currencyMap, {
                USD: "#f59e0b", TWD: "#3b82f6", JPY: "#ef4444"
            }),
            allocationData: formatPieData(allocationMap, {
                cash: "#3b82f6", stock: "#8b5cf6", fixed_deposit: "#f59e0b", rsu: "#10b981"
            }),
            ownershipData: formatPieData(ownershipMap, {
                PY: "#10b981", Kigo: "#fcd34d", Both: "#6366f1"
            })
        };
    });

    // Build trendData by grouping by snapshot_id
    const trendMap: Record<string, number> = {};
    allRecords.forEach(r => {
        trendMap[r.snapshot_id] = (trendMap[r.snapshot_id] || 0) + (Number(r.total_twd_value) || 0);
    });

    // Sort snapshots ascending (oldest to newest) for the chart
    const trendData = [...recentSnapshots].reverse().map((snap: any, index: number, arr: any[]) => {
        const val = trendMap[snap.id] || 0;
        return {
            id: snap.id, // NEW
            name: snap.period_name || snap.created_at.split('T')[0],
            assets: Math.round(val / 10000), // Display in "萬"
            color: index === arr.length - 1 ? "#22c55e" : "#94a3b8"
        };
    });

    const latestDetails = snapshotDetails[latestSnapshot.id] || {};

    return {
        totalNetWorth: latestDetails.totalNetWorth || 0,
        currencyData: latestDetails.currencyData || [],
        allocationData: latestDetails.allocationData || [],
        ownershipData: latestDetails.ownershipData || [],
        trendData,
        latestSnapshot,
        snapshotDetails, // Make available to UI
        rawRecords: allRecords.filter(r => r.snapshot_id === latestSnapshot.id)
    };
}

export async function getGoalsWithProgress() {
    // 1. Fetch Goals and their mappings
    const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select(`
            *,
            goal_asset_mapping (
                asset_id
            )
        `)
        .order('priority', { ascending: true });

    if (goalsError || !goals) return [];

    // 2. Fetch the latest snapshot records to compute current values
    const { data: latestSnapshot } = await supabase
        .from('snapshots')
        .select('id')
        .not('period_name', 'like', 'ARCHIVE%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    let records: any[] = [];
    if (latestSnapshot) {
        const { data } = await supabase
            .from('snapshot_records')
            .select('asset_id, total_twd_value')
            .eq('snapshot_id', latestSnapshot.id);
        if (data) Object.assign(records, data);
    }

    const valueMap = new Map();
    records.forEach(r => valueMap.set(r.asset_id, Number(r.total_twd_value)));

    return goals.map(goal => {
        let current_funding = 0;
        const mappings = Array.isArray(goal.goal_asset_mapping) ? goal.goal_asset_mapping : [];

        mappings.forEach((m: any) => {
            current_funding += valueMap.get(m.asset_id) || 0;
        });

        const progress = goal.target_amount > 0 ? (current_funding / goal.target_amount) * 100 : 0;

        return {
            ...goal,
            current_funding,
            progress: Math.min(progress, 100)
        };
    });
}

// DTO for cash input from wizard
export type CashInputDTO = {
    asset_id: string;
    quantity: number;
};

export async function submitQuarterlySnapshot(cashInputs: CashInputDTO[], periodName: string = "2026/02") {
    // 1. Read market_cache
    const { data: marketCache, error: mcError } = await supabase.from('market_cache').select('*');
    if (mcError) throw mcError;

    const cacheMap = new Map();
    marketCache?.forEach(mc => cacheMap.set(mc.symbol, Number(mc.price)));

    // Helper: Get FX Rate
    const getFxRate = (currency: string) => {
        if (currency === 'TWD') return 1;
        return cacheMap.get(`${currency}/TWD`) || 1;
    };

    // 2. Get active assets
    const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('is_active', true);
    if (assetsError || !assets) throw assetsError;

    // 3. Get previous snapshot quantity for stocks
    const { data: latestSnapshot } = await supabase
        .from('snapshots')
        .select('id')
        .not('period_name', 'like', 'ARCHIVE%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    let prevQuantities = new Map();
    if (latestSnapshot) {
        const { data: prevRecords } = await supabase
            .from('snapshot_records')
            .select('asset_id, quantity')
            .eq('snapshot_id', latestSnapshot.id);
        prevRecords?.forEach(r => prevQuantities.set(r.asset_id, Number(r.quantity)));
    }

    // 4. Create new Snapshot
    const { data: newSnapshot, error: snapError } = await supabase
        .from('snapshots')
        .insert({
            period_name: periodName,
            notes: 'Quarterly Update Wizard (V2 Logic)'
        })
        .select()
        .single();
    if (snapError) throw snapError;

    // 5. Build records payload
    const cashInputMap = new Map();
    cashInputs.forEach(c => cashInputMap.set(c.asset_id, c.quantity));

    const recordsToInsert = assets.map(asset => {
        let quantity = 0;
        let unitPrice = 1;

        if (asset.asset_type === 'cash' || asset.asset_type === 'fixed_deposit') {
            quantity = cashInputMap.has(asset.id) ? cashInputMap.get(asset.id) : (prevQuantities.get(asset.id) || 0);
        } else {
            // For stocks & rsus, use prev quantity for now. Wait, wizard logic might let them update shares.
            // If cashInputs also includes stock edits, we could override. Let's respect cashInputs for stocks too just in case.
            quantity = cashInputMap.has(asset.id) ? cashInputMap.get(asset.id) : (prevQuantities.get(asset.id) || 0);
            unitPrice = cacheMap.get(asset.ticker_symbol) || 1; // Default to 1 if not in cache
        }

        const fxRate = getFxRate(asset.currency);
        const totalTwdValue = quantity * unitPrice * fxRate;

        return {
            snapshot_id: newSnapshot.id,
            asset_id: asset.id,
            quantity: quantity,
            unit_price: unitPrice,
            fx_rate: fxRate,
            total_twd_value: totalTwdValue
        };
    });

    // 6. Bulk Insert
    const { error: insertError } = await supabase
        .from('snapshot_records')
        .insert(recordsToInsert);
    if (insertError) throw insertError;

    return { success: true, snapshot_id: newSnapshot.id };
}

export async function getReportData() {
    // 1. Fetch live market data
    const { data: marketCache } = await supabase.from('market_cache').select('*');

    // 2. Fetch the latest snapshot and its records
    const { data: latestSnapshot } = await supabase
        .from('snapshots')
        .select('*')
        .not('period_name', 'like', 'ARCHIVE%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    let records: any[] = [];
    if (latestSnapshot) {
        const { data } = await supabase
            .from('snapshot_records')
            .select(`
                *,
                assets (
                    id, title, owner, asset_type, currency, ticker_symbol
                )
            `)
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
        if (asset.owner === 'Kigo') ownerTotals.Kigo += val;
        if (asset.owner === 'Both') ownerTotals.Both += val;

        const ownerColorMap: Record<string, string> = {
            PY: "bg-emerald-100 text-emerald-700",
            Kigo: "bg-amber-100 text-amber-700",
            Both: "bg-indigo-100 text-indigo-700"
        };

        const typeMap: Record<string, string> = {
            cash: "活存",
            fixed_deposit: "定存",
            stock: "股票",
            rsu: "RSU"
        };

        const isCashOrFD = asset.asset_type === 'cash' || asset.asset_type === 'fixed_deposit';
        const displayType = typeMap[asset.asset_type] || "資產";

        let originalAmount = "";
        if (isCashOrFD) {
            originalAmount = `$ ${Number(record.quantity).toLocaleString()} (${asset.currency})`;
        } else {
            const price = record.unit_price ? ` (@ $${record.unit_price})` : "";
            originalAmount = `${Number(record.quantity).toLocaleString()} 股${price}`;
        }

        return {
            id: record.id,
            owner: asset.owner,
            ownerColor: ownerColorMap[asset.owner] || "bg-slate-100 text-slate-700",
            type: displayType,
            name: asset.title,
            originalAmount,
            ntdAmount: val,
            category: isCashOrFD ? "Cash" : "Stocks"
        };
    }).filter(Boolean);

    const summaryCards = [
        {
            title: "家庭總資產淨值",
            amount: totalAmount,
            subtitle: latestSnapshot ? `資料期數：${latestSnapshot.period_name}` : "無資料",
            borderColor: "border-blue-500",
        },
        {
            title: "PY 資產總計",
            amount: ownerTotals.PY,
            subtitle: "個人獨立帳戶合計",
            borderColor: "border-emerald-500",
        },
        {
            title: "Kigo 資產總計",
            amount: ownerTotals.Kigo,
            subtitle: "個人獨立帳戶合計",
            borderColor: "border-amber-400",
        },
        {
            title: "Both (共同帳戶)",
            amount: ownerTotals.Both,
            subtitle: "共同家用與投資",
            borderColor: "border-indigo-500",
        },
    ];

    const liveMarketMapped = (marketCache || []).map(mc => {
        const isFx = mc.symbol.includes('/');
        return {
            symbol: mc.symbol,
            price: Number(mc.price),
            type: isFx ? 'fx' : 'stock'
        };
    });

    return {
        summaryCards,
        assetItems,
        liveMarketData: liveMarketMapped,
        periodName: latestSnapshot?.period_name || '無資料'
    };
}

// ---------------------------------------------------------------------
// V2.1: Asset Management Server Actions
// ---------------------------------------------------------------------

export async function toggleAssetActive(assetId: string, isActive: boolean) {
    const { error } = await supabase
        .from('assets')
        .update({ is_active: isActive })
        .eq('id', assetId);

    if (error) throw error;
    return true;
}

export async function addNewAsset(payload: { title: string, owner: string, asset_type: string, currency: string, ticker_symbol?: string }) {
    const { data, error } = await supabase
        .from('assets')
        .insert({
            title: payload.title,
            owner: payload.owner,
            asset_type: payload.asset_type,
            currency: payload.currency,
            ticker_symbol: payload.ticker_symbol || null,
            is_active: true
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function createGoal(payload: { name: string, target_amount: number, category: string, target_date?: string, asset_ids?: string[] }) {
    const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert({
            name: payload.name,
            target_amount: payload.target_amount,
            category: payload.category || 'long_term',
            target_date: payload.target_date || null,
            status: 'on_track'
        })
        .select()
        .single();

    if (goalError) throw goalError;

    // Handle Asset Mapping
    if (payload.asset_ids && payload.asset_ids.length > 0) {
        const mappings = payload.asset_ids.map(asset_id => ({
            goal_id: goalData.id,
            asset_id: asset_id
        }));

        const { error: mappingError } = await supabase
            .from('goal_asset_mapping')
            .insert(mappings);

        if (mappingError) throw mappingError;
    }

    return goalData;
}

export async function getActiveAssets() {
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('is_active', true)
        .order('title', { ascending: true });

    if (error) return [];
    return data;
}


export async function getWizardInitData() {
    // 1. Get market prices (cache)
    const { data: marketCache } = await supabase.from('market_cache').select('*');
    const priceMap = new Map<string, number>();
    marketCache?.forEach(mc => priceMap.set(mc.symbol, Number(mc.price)));

    // Helper: Get FX Rate (to TWD)
    const getFxRate = (currency: string) => {
        if (currency === 'TWD') return 1;
        return priceMap.get(`${currency}/TWD`) || 1;
    };

    // 2. Fetch the latest snapshot strictly for balance recovery
    const { data: latestSnapshot } = await supabase
        .from('snapshots')
        .select('id')
        .not('period_name', 'like', 'ARCHIVE%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    let prevRecordsMap = new Map<string, any>();
    if (latestSnapshot) {
        const { data: prevRecords } = await supabase
            .from('snapshot_records')
            .select('asset_id, quantity, total_twd_value')
            .eq('snapshot_id', latestSnapshot.id);

        prevRecords?.forEach(r => prevRecordsMap.set(r.asset_id, r));
    }

    // 3. Get all active assets
    const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('is_active', true)
        .order('owner', { ascending: true });

    if (assetsError || !assets) {
        throw new Error("Unable to fetch assets.");
    }

    // 4. Map assets with their previous state and current market prices
    const mappedAssets = assets.map(asset => {
        const prev = prevRecordsMap.get(asset.id);
        const prevQuantity = prev ? Number(prev.quantity) : 0;
        const prevTwdValue = prev ? Number(prev.total_twd_value) : 0;

        const isStockOrRsu = asset.asset_type === 'stock' || asset.asset_type === 'rsu';

        let currentPrice = 1;
        if (isStockOrRsu && asset.ticker_symbol) {
            currentPrice = priceMap.get(asset.ticker_symbol) || 0;
        }

        const fxRate = getFxRate(asset.currency);

        // Calculate current default TWD Value based on previous quantity but CURRENT prices/fx
        const currentTwdValue = prevQuantity * currentPrice * fxRate;

        // Calculate growth from purely market fluctuations (since qty hasn't changed yet)
        let growth = 0;
        if (prevTwdValue > 0) {
            growth = Number(((currentTwdValue - prevTwdValue) / prevTwdValue * 100).toFixed(1));
        }

        return {
            ...asset,
            // We'll initialize the UI state using these historical parameters
            shares: isStockOrRsu ? prevQuantity : undefined,
            price: isStockOrRsu ? currentPrice : undefined,
            totalValue: currentTwdValue, // The initial TWD value before user modifies anything manually
            growth: growth,
            prevBalance: isStockOrRsu ? "0" : prevQuantity.toString(), // For cash, show previous balance as a string
            defaultValue: isStockOrRsu ? "0" : prevQuantity.toString(), // Pre-fill cash accounts with last known balance
            fxRate: fxRate
        };
    });

    return { mappedAssets, priceMap: Object.fromEntries(priceMap) };
}

export async function generateLiveAISummary(dashboardData: any, userFeedback?: string) {
    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_key_here') {
            return "⚠️ Gemini API Key 未設定，無法產生即時 AI 洞察。請在 .env 中設定 GEMINI_API_KEY。";
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Fetch up to 3 latest feedback records to provide context to Gemini
        const { data: previousFeedback } = await supabase
            .from('ai_summary_feedback')
            .select('user_prompt, ai_response')
            .order('created_at', { ascending: false })
            .limit(3);

        let historyContext = "";
        if (previousFeedback && previousFeedback.length > 0) {
            historyContext = "\n\n過往的調整指示與回應紀錄（請參考這些風格與要求）：\n" +
                previousFeedback.reverse().map((f: any) => `使用者要求：${f.user_prompt}\n你的回應：${f.ai_response}`).join('\n\n');
        }

        let newFeedbackContext = "";
        if (userFeedback) {
            newFeedbackContext = `\n\n這一次，使用者提出了新的要求與回饋，請務必按照這個指示重新撰寫：\n「${userFeedback}」`;
        }

        const prompt = `
作為一名專業的家庭財務顧問，這是一個家庭的即時財務狀況分析：

總資產淨值：約 ${Math.round((dashboardData.totalNetWorth || 0) / 10000)}萬 台幣
各幣別比例：${(dashboardData.currencyData || []).map((d: any) => `${d.name} ${d.value}%`).join(', ')}
資產配置：${(dashboardData.allocationData || []).map((d: any) => `${d.name} ${d.value}%`).join(', ')}
成員佔比：${(dashboardData.ownershipData || []).map((d: any) => `${d.name} ${d.value}%`).join(', ')}
${historyContext}${newFeedbackContext}
請給出一到兩句簡短、專業且具洞察力的財務總結與建議。不要囉嗦，字數預設控制在 60 字以內 (除非使用者有別的要求)，語氣要像是專業私人顧問。`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const newSummary = response.text || "⚠️ AI 沒有回傳任何訊息。";

        // If the user provided feedback, log this interaction to the database
        if (userFeedback && newSummary && !newSummary.startsWith("⚠️")) {
            // Assume we can get the snapshot_id from latestSnapshot, else null
            const snapshotId = dashboardData.latestSnapshot?.id || null;
            await supabase.from('ai_summary_feedback').insert({
                user_prompt: userFeedback,
                ai_response: newSummary,
                snapshot_id: snapshotId
            });
        }

        return newSummary;
    } catch (e) {
        console.error("Failed to generate Live AI summary:", e);
        return "⚠️ 即時 AI 洞察產生失敗，請稍後再試。";
    }
}
