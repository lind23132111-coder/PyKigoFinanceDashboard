"use server";

import { StrategyTarget, ProjectedDividend } from "@/types/dashboard";

/**
 * MOCK DATA for Planning Phase
 * In a real scenario, these would come from the database (e.g., stock_targets table)
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
    // Simulate DB fetch
    return {
        strategyTargets: MOCK_STRATEGY_TARGETS,
        dividendProjections: MOCK_DIVIDEND_PROJECTIONS,
        rebalancingThreshold: 5 // percentage
    };
}
