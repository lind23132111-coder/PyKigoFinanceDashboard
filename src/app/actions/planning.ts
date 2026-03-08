"use server";

import { supabase } from "@/utils/supabase/client";
import { StrategyTarget, ProjectedDividend } from "@/types/dashboard";

/**
 * MOCK DATA for Planning Phase (Fallbacks while DB is being populated)
 */
const MOCK_STRATEGY_TARGETS: StrategyTarget[] = [
    { category: "核心持股 (大型股)", target_percentage: 45, color: "#10b981" },
    { category: "成長動能 (科技股)", target_percentage: 30, color: "#6366f1" },
    { category: "定存股 (領息資產)", target_percentage: 15, color: "#f59e0b" },
    { category: "投機/現金資產", target_percentage: 10, color: "#94a3b8" }
];

const MOCK_DIVIDEND_PROJECTIONS: ProjectedDividend[] = [
    { year: 2024, amount: 45000 },
    { year: 2025, amount: 52000 },
    { year: 2026, amount: 68000 },
    { year: 2027, amount: 85000 },
    { year: 2028, amount: 110000 },
    { year: 2029, amount: 145000 },
    { year: 2030, amount: 190000 },
];

// ─────────────────────────────────────────────────────────────────
// DEMO MODE MOCK DATA
// ─────────────────────────────────────────────────────────────────
const DEMO_PLANNING_DATA = {
    strategyTargets: MOCK_STRATEGY_TARGETS,
    dividendProjections: MOCK_DIVIDEND_PROJECTIONS,
    rebalancingThreshold: 5,
    userGoal: { goal_name: '財務自由之翼', target_monthly_income: 80000 },
    availableStocks: [
        { id: "demo-1", symbol: "NVDA", name: "Nvidia Corp", currentCategory: "成長動能 (科技股)", recommendedCategory: "成長動能 (科技股)" },
        { id: "demo-2", symbol: "GOOGL", name: "Alphabet Inc", currentCategory: "成長動能 (科技股)", recommendedCategory: "核心持股 (大型股)" },
        { id: "demo-3", symbol: "VOO", name: "Vanguard S&P 500 ETF", currentCategory: "核心持股 (大型股)", recommendedCategory: "核心持股 (大型股)" },
        { id: "demo-5", symbol: "2330.TW", name: "台積電", currentCategory: "核心持股 (大型股)", recommendedCategory: "核心持股 (大型股)" },
        { id: "demo-8", symbol: "AAPL", name: "Apple Inc", currentCategory: "核心持股 (大型股)", recommendedCategory: "核心持股 (大型股)" },
        { id: "demo-9", symbol: "MSFT", name: "Microsoft Corp", currentCategory: "核心持股 (大型股)", recommendedCategory: "成長動能 (科技股)" },
        { id: "demo-6", symbol: "O", name: "Realty Income", currentCategory: "定存股 (領息資產)", recommendedCategory: "定存股 (領息資產)" },
        { id: "demo-7", symbol: "SCHD", name: "Schwab US Dividend Equity", currentCategory: "定存股 (領息資產)", recommendedCategory: "定存股 (領息資產)" }
    ]
};

export async function getPlanningData() {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_PLANNING_DATA;

    // 1. Fetch active stocks for selection
    const { data: stocks, error: stockError } = await supabase
        .from('assets')
        .select('id, ticker_symbol, title, owner, asset_type, dividend_yield, strategy_category')
        .in('asset_type', ['stock', 'rsu']);

    // 2. Fetch real strategy targets from DB
    const { data: dbTargets, error: targetError } = await supabase
        .from('strategy_targets')
        .select('*')
        .order('category', { ascending: true });

    // 3. Fetch user goals (Passive income target)
    const { data: goals, error: goalError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('is_active', true)
        .single();

    // 4. Fetch latest snapshot records to get holding values for dividend calculation
    const { data: latestSnap } = await supabase.from('snapshots').select('id').order('created_at', { ascending: false }).limit(1).single();
    let currentAnnualDividend = 0;

    if (latestSnap && stocks) {
        const { data: records } = await supabase.from('snapshot_records').select('asset_id, total_twd_value').eq('snapshot_id', latestSnap.id);
        if (records) {
            currentAnnualDividend = stocks.reduce((sum, stock) => {
                const record = records.find(r => r.asset_id === (stock as any).id); // Need ID in select
                const value = record ? Number(record.total_twd_value) : 0;
                const yieldPct = (stock.dividend_yield || 0) || (stock.asset_type === 'stock' ? 2 : 0); // 2% fallback for stocks
                return sum + (value * yieldPct / 100);
            }, 0);
        }
    }

    // 5. Generate Projections based on real base (Assume 7% compounding + 5% annual dividend growth)
    const baseAmount = currentAnnualDividend || 45000;
    const dividendProjections = Array.from({ length: 7 }, (_, i) => ({
        year: new Date().getFullYear() + i,
        amount: Math.round(baseAmount * Math.pow(1.12, i)) // 12% total annual growth (reinvestment + equity growth)
    }));

    const finalTargets = (dbTargets && dbTargets.length > 0) ? dbTargets : MOCK_STRATEGY_TARGETS;

    return {
        strategyTargets: finalTargets,
        dividendProjections: dividendProjections,
        rebalancingThreshold: 5, // percentage
        userGoal: goals || { goal_name: 'Financial Freedom', target_monthly_income: 50000 },
        availableStocks: (stocks || []).map((s: any) => ({
            id: s.id, // Include ID
            symbol: s.ticker_symbol,
            name: s.title,
            owner: s.owner,
            currentCategory: s.strategy_category,
            recommendedCategory: getRecommendedCategory(s)
        }))
    };
}

export async function updateStrategyTarget(category: string, target_percentage: number) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return { success: true };
    const { data, error } = await supabase
        .from('strategy_targets')
        .upsert({ category, target_percentage }, { onConflict: 'category' });

    if (error) {
        console.error('Error updating strategy target:', error);
        throw error;
    }
    return data;
}

export async function getStrategyNotes(tickerSymbol: string) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
        const mockNotes: Record<string, any> = {
            "NVDA": {
                ticker_symbol: "NVDA",
                target_price: 150,
                exit_price: 180,
                research_confidence: "High",
                notes: "AI GPU 領導者，目前估值合理。建議長期持有並在拉回時加碼。",
                updated_at: new Date().toISOString()
            },
            "2330.TW": {
                ticker_symbol: "2330.TW",
                target_price: 1200,
                exit_price: 1500,
                research_confidence: "High",
                notes: "台積電先進製程領先全球，CoWoS 產能持續擴張。適合核心配置。",
                updated_at: new Date().toISOString()
            },
            "AAPL": {
                ticker_symbol: "AAPL",
                target_price: 250,
                exit_price: 300,
                research_confidence: "Medium",
                notes: "Apple Intelligence 帶來的換機潮值得期待。服務收入佔比持續提升，穩定性極佳。",
                updated_at: new Date().toISOString()
            },
            "MSFT": {
                ticker_symbol: "MSFT",
                target_price: 500,
                exit_price: 550,
                research_confidence: "High",
                notes: "Azure 與 OpenAI 深度整合，企業端市佔率穩固。雲端業務仍有巨大成長空間。",
                updated_at: new Date().toISOString()
            },
            "GOOGL": {
                ticker_symbol: "GOOGL",
                target_price: 180,
                exit_price: 210,
                research_confidence: "Medium",
                notes: "搜尋廣告護城河依然深厚。YouTube 與 Waymo 是長期看點，目前本益比具吸引力。",
                updated_at: new Date().toISOString()
            }
        };
        return mockNotes[tickerSymbol] || { ticker_symbol: tickerSymbol, notes: "Demo 模式：您可以嘗試修改筆記，但不會寫入資料庫。" };
    }

    const { data, error } = await supabase
        .from('strategy_notes')
        .select('*')
        .eq('ticker_symbol', tickerSymbol)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching strategy notes:', error);
    }
    return data;
}

export async function saveStrategyNote(tickerSymbol: string, updates: any) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
        console.log("Demo Mode: Skipping strategy note save for", tickerSymbol);
        return { success: true, message: "Demo 模式不支援寫入資料庫" };
    }

    const { data, error } = await supabase
        .from('strategy_notes')
        .upsert({
            ticker_symbol: tickerSymbol,
            ...updates,
            updated_at: new Date().toISOString()
        }, { onConflict: 'ticker_symbol' });

    if (error) {
        console.error('Error saving strategy note:', error);
        throw error;
    }
    return data;
}

export async function updateAssetStrategy(assetId: string, category: string) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return { success: true };
    const { data, error } = await supabase
        .from('assets')
        .update({ strategy_category: category })
        .eq('id', assetId);

    if (error) {
        console.error('Error updating asset strategy:', error);
        throw error;
    }
    return data;
}

function getRecommendedCategory(asset: any): string {
    const symbol = asset.ticker_symbol?.toUpperCase() || "";
    const name = asset.title || "";
    const yieldPct = asset.dividend_yield || 0;

    // 1. Dividend Logic: High yield focus
    if (yieldPct > 4) return "定存股 (領息資產)";

    // 2. Growth Logic: Tech-heavy or specific growth tickers
    if (
        symbol.includes("NVDA") ||
        symbol.includes("TSLA") ||
        symbol.includes("GOOG") ||
        symbol.includes("TTD") ||
        symbol.includes("NVDL") ||
        symbol.includes("TSLL") ||
        name.includes("成長") ||
        name.includes("科技")
    ) return "成長動能 (科技股)";

    // 3. Core Logic: Broad indices or large blue chips
    if (
        symbol.includes("0050") ||
        symbol.includes("006208") ||
        symbol.includes("VOO") ||
        symbol.includes("SPY") ||
        name.includes("50") ||
        name.includes("大型")
    ) return "核心持股 (大型股)";

    // 4. Speculative: Leveraged ETFs or specific volatile assets
    if (symbol.endsWith("L") || symbol.includes("L") || name.includes("正2")) {
        return "核心持股 (大型股)"; // User often considers 0050正2 as core, but technically speculative. 
        // Keeping it flexible.
    }

    return "核心持股 (大型股)"; // Default fallback
}
