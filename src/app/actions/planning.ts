"use server";

import { supabase } from "@/utils/supabase/client";
import { StrategyTarget, ProjectedDividend } from "@/types/dashboard";

/**
 * MOCK DATA for Planning Phase (Fallbacks while DB is being populated)
 */
const MOCK_STRATEGY_TARGETS: StrategyTarget[] = [
    { category: "Core (Blue Chips)", target_percentage: 45, color: "#10b981" },
    { category: "Growth (Tech)", target_percentage: 30, color: "#6366f1" },
    { category: "Dividend (Passive)", target_percentage: 15, color: "#f59e0b" },
    { category: "Speculative/Cash", target_percentage: 10, color: "#94a3b8" }
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

export async function getPlanningData() {
    // 1. Fetch active stocks for selection
    const { data: stocks, error: stockError } = await supabase
        .from('assets')
        .select('ticker_symbol, title, owner, asset_type')
        .eq('asset_type', 'stock')
        .not('ticker_symbol', 'is', null);

    // 2. We still use mocks for the high-level strategy for now 
    // until the user populates stock_strategy_targets
    return {
        strategyTargets: MOCK_STRATEGY_TARGETS,
        dividendProjections: MOCK_DIVIDEND_PROJECTIONS,
        rebalancingThreshold: 5, // percentage
        availableStocks: (stocks || []).map((s: any) => ({
            symbol: s.ticker_symbol,
            name: s.title,
            owner: s.owner
        }))
    };
}

export async function getStrategyNotes(tickerSymbol: string) {
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
