"use server";

import { supabase } from "@/utils/supabase/client";
import { revalidatePath } from "next/cache";

// DTO for cash input from wizard
export type CashInputDTO = {
    asset_id: string;
    quantity: number;
};

// ─────────────────────────────────────────────────────────────────
// DEMO MODE MOCK DATA
// Toggle by setting NEXT_PUBLIC_DEMO_MODE=true in .env.local
// ─────────────────────────────────────────────────────────────────
const DEMO_WIZARD_DATA = {
    mappedAssets: [
        {
            id: "demo-cash-1", title: "International Bank (USD)", owner: "PY",
            asset_type: "cash", currency: "USD", ticker_symbol: null,
            prevBalance: "12,500", defaultValue: "12500", fxRate: 31.6, totalValue: 395000, growth: 0
        },
        {
            id: "demo-cash-2", title: "Local Savings (TWD)", owner: "Kigo",
            asset_type: "cash", currency: "TWD", ticker_symbol: null,
            prevBalance: "4,200,000", defaultValue: "4200000", fxRate: 1.0, totalValue: 4200000, growth: 0
        },
        {
            id: "demo-stock-1", title: "Cloud Provider (RSU)", owner: "PY",
            asset_type: "rsu", currency: "USD", ticker_symbol: "AMZN",
            shares: 1500, price: 185, totalValue: 8769000, growth: 5.2,
            prevBalance: "0", defaultValue: "0", fxRate: 31.6
        }
    ],
    priceMap: { "AMZN": 185, "USD/TWD": 31.6 }
};

// ─────────────────────────────────────────────────────────────────
// LIVE DATA FUNCTIONS
// ─────────────────────────────────────────────────────────────────
export async function getWizardInitData(): Promise<any> {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_WIZARD_DATA;

    const { data: marketCache } = await supabase.from('market_cache').select('*');
    const priceMap = new Map<string, number>();
    marketCache?.forEach(mc => priceMap.set(mc.symbol, Number(mc.price)));

    const getFxRate = (currency: string) => {
        if (currency === 'TWD') return 1;
        return priceMap.get(`${currency}/TWD`) || 1;
    };

    const { data: latestSnapshot } = await supabase
        .from('snapshots').select('id')
        .not('period_name', 'like', 'ARCHIVE%')
        .order('created_at', { ascending: false }).limit(1).single();

    let prevRecordsMap = new Map<string, any>();
    if (latestSnapshot) {
        const { data: prevRecords } = await supabase
            .from('snapshot_records').select('asset_id, quantity, total_twd_value')
            .eq('snapshot_id', latestSnapshot.id);
        prevRecords?.forEach(r => prevRecordsMap.set(r.asset_id, r));
    }

    const { data: assets, error: assetsError } = await supabase
        .from('assets').select('*').eq('is_active', true).order('owner', { ascending: true });

    if (assetsError || !assets) throw new Error("Unable to fetch assets.");

    const mappedAssets = assets.map(asset => {
        const prev = prevRecordsMap.get(asset.id);
        const prevQuantity = prev ? Number(prev.quantity) : 0;
        const prevTwdValue = prev ? Number(prev.total_twd_value) : 0;
        const isStockOrRsu = asset.asset_type === 'stock' || asset.asset_type === 'rsu';
        let currentPrice = 1;
        if (isStockOrRsu && asset.ticker_symbol) currentPrice = priceMap.get(asset.ticker_symbol) || 0;
        const fxRate = getFxRate(asset.currency);
        const currentTwdValue = prevQuantity * currentPrice * fxRate;
        let growth = 0;
        if (prevTwdValue > 0) growth = Number(((currentTwdValue - prevTwdValue) / prevTwdValue * 100).toFixed(1));

        return {
            ...asset,
            shares: isStockOrRsu ? prevQuantity : undefined,
            price: isStockOrRsu ? currentPrice : undefined,
            totalValue: currentTwdValue,
            growth,
            prevBalance: isStockOrRsu ? "0" : prevQuantity.toString(),
            defaultValue: isStockOrRsu ? "0" : prevQuantity.toString(),
            fxRate
        };
    });

    return { mappedAssets, priceMap: Object.fromEntries(priceMap) };
}

export async function submitQuarterlySnapshot(cashInputs: CashInputDTO[], periodName: string = "2026/02") {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
        return { success: true, snapshot_id: "demo-submit-id" };
    }

    const { data: marketCache, error: mcError } = await supabase.from('market_cache').select('*');
    if (mcError) throw mcError;
    const cacheMap = new Map();
    marketCache?.forEach(mc => cacheMap.set(mc.symbol, Number(mc.price)));

    const getFxRate = (currency: string) => currency === 'TWD' ? 1 : (cacheMap.get(`${currency}/TWD`) || 1);

    const { data: assets, error: assetsError } = await supabase.from('assets').select('*').eq('is_active', true);
    if (assetsError || !assets) throw assetsError;

    const { data: latestSnapshot } = await supabase
        .from('snapshots').select('id')
        .not('period_name', 'like', 'ARCHIVE%')
        .order('created_at', { ascending: false }).limit(1).single();

    let prevQuantities = new Map();
    if (latestSnapshot) {
        const { data: prevRecords } = await supabase
            .from('snapshot_records').select('asset_id, quantity').eq('snapshot_id', latestSnapshot.id);
        prevRecords?.forEach(r => prevQuantities.set(r.asset_id, Number(r.quantity)));
    }

    const { data: newSnapshot, error: snapError } = await supabase
        .from('snapshots').insert({ period_name: periodName, notes: 'Quarterly Update Wizard' }).select().single();
    if (snapError) throw snapError;

    const cashInputMap = new Map();
    cashInputs.forEach(c => cashInputMap.set(c.asset_id, c.quantity));

    const recordsToInsert = assets.map(asset => {
        const quantity = cashInputMap.has(asset.id) ? cashInputMap.get(asset.id) : (prevQuantities.get(asset.id) || 0);
        const unitPrice = (asset.asset_type === 'stock' || asset.asset_type === 'rsu')
            ? (cacheMap.get(asset.ticker_symbol) || 1) : 1;
        const fxRate = getFxRate(asset.currency);
        return { snapshot_id: newSnapshot.id, asset_id: asset.id, quantity, unit_price: unitPrice, fx_rate: fxRate, total_twd_value: quantity * unitPrice * fxRate };
    });

    const { error: insertError } = await supabase.from('snapshot_records').insert(recordsToInsert);
    if (insertError) throw insertError;

    revalidatePath('/');
    revalidatePath('/report');
    revalidatePath('/planning');

    return { success: true, snapshot_id: newSnapshot.id };
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
export async function deleteSnapshot(snapshotId: string) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return { success: true };

    // Delete records first (though DB might have cascade, better to be explicit or safe)
    const { error: recordsError } = await supabase
        .from('snapshot_records')
        .delete()
        .eq('snapshot_id', snapshotId);

    if (recordsError) throw recordsError;

    const { error: snapError } = await supabase
        .from('snapshots')
        .delete()
        .eq('id', snapshotId);

    if (snapError) throw snapError;

    revalidatePath('/');
    revalidatePath('/report');
    revalidatePath('/planning');

    return { success: true };
}

// ─────────────────────────────────────────────────────────────────
// TICKER AUTOCOMPLETE & VALIDATION
// ─────────────────────────────────────────────────────────────────

export type TickerSuggestion = {
    symbol: string;
    name: string;
    exchange: string;
};

/** Search Yahoo Finance for ticker suggestions (used for autocomplete) */
export async function searchTicker(query: string): Promise<TickerSuggestion[]> {
    if (!query || query.trim().length < 1) return [];

    // Demo mode: return mock suggestions
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
        const DEMO: TickerSuggestion[] = [
            { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
            { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ" },
            { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
            { symbol: "NVDA", name: "Nvidia Corporation", exchange: "NASDAQ" },
            { symbol: "MU", name: "Micron Technology Inc.", exchange: "NASDAQ" },
        ];
        return DEMO.filter(s =>
            s.symbol.toUpperCase().startsWith(query.toUpperCase()) ||
            s.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6);
    }

    // Clean query and convert full-width characters to half-width
    let cleanQuery = query.includes(' — ') ? query.split(' — ')[0].trim() : query.trim();
    cleanQuery = cleanQuery.replace(/[\uFF01-\uFF5E]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/\u3000/g, ' ');

    if (cleanQuery.length < 1) return [];

    // Check if query contains non-alphanumeric characters (like Chinese)
    // Yahoo Search API currently fails with 400 for Chinese characters in some contexts
    const isStandardQuery = /^[a-zA-Z0-9.]+$/.test(cleanQuery);
    if (!isStandardQuery) {
        return [
            { symbol: "TIPS", name: "中文字搜尋不穩定，請改輸入代號 (如 2330)", exchange: "HINT" },
            { symbol: "TIPS", name: "或英文代號 (如 TSMC / AAPL)", exchange: "HINT" }
        ];
    }

    try {
        console.log(`[TickerSearch] Query: "${cleanQuery}" (original: "${query}")`);

        // Yahoo Search API with region/lang for better local results
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanQuery)}&quotesCount=10&newsCount=0&lang=zh-Hant-TW&region=TW`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`[TickerSearch] Yahoo API error status: ${response.status}`);
            throw new Error(`Yahoo API error: ${response.status}`);
        }

        const data = await response.json();
        const quotes = data.quotes || [];
        console.log(`[TickerSearch] Found ${quotes.length} results`);

        // If no results specifically for a numeric code like "2330", suggest Taiwan/HK suffixes
        if (quotes.length === 0 && /^\d{4,6}$/.test(cleanQuery)) {
            return [
                { symbol: `${cleanQuery}.TW`, name: `${cleanQuery} (台灣預測)`, exchange: "TPE" },
                { symbol: `${cleanQuery}.HK`, name: `${cleanQuery} (香港預測)`, exchange: "HKG" },
                { symbol: `${cleanQuery}.TWO`, name: `${cleanQuery} (櫃買預測)`, exchange: "TWO" }
            ];
        }

        return quotes
            .slice(0, 8)
            .map((q: any) => ({
                symbol: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchange || q.exchDisp || '',
            }));

    } catch (err: any) {
        console.error("[TickerSearch] Error:", err.message);

        const isRateLimited = err.message?.includes('429') || err.message?.includes('crumb');
        const suffix = isRateLimited ? " (限流模式)" : " (備用模式)";

        return [
            { symbol: "AAPL", name: "Apple Inc." + suffix, exchange: "NASDAQ" },
            { symbol: "0050.TW", name: "元大台灣50" + suffix, exchange: "TPE" },
            { symbol: "NVDA", name: "NVIDIA Corp" + suffix, exchange: "NASDAQ" },
            { symbol: "2330.TW", name: "台積電" + suffix, exchange: "TPE" },
            { symbol: "0056.TW", name: "元大高股息" + suffix, exchange: "TPE" }
        ];
    }
}

/** Check if a ticker already exists for this owner in the assets table */
export async function checkDuplicateTicker(ticker: string, owner: string): Promise<boolean> {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return false;
    const { data } = await supabase
        .from('assets')
        .select('id')
        .eq('ticker_symbol', ticker.toUpperCase())
        .eq('owner', owner)
        .eq('is_active', true)
        .limit(1);
    return !!(data && data.length > 0);
}
