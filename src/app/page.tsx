"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, XCircle } from "lucide-react";
import { getLatestDashboardData } from "@/app/actions/dashboard";
import { generateLiveAISummary } from "@/app/actions/ai";
import { DashboardData } from "@/types/dashboard";

// Sub-components
import { AIInsightSection } from "@/components/dashboard/AIInsightSection";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { AggregationPieCharts } from "@/components/dashboard/AggregationPieCharts";

export default function Dashboard() {
    const [mounted, setMounted] = useState(false);
    const [latestSummary, setLatestSummary] = useState<string>("正在載入最新的財務數據中...");
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<{ currency?: string, type?: string, owner?: string }>({});

    useEffect(() => {
        setMounted(true);

        const loadDashboard = async () => {
            try {
                const data = await getLatestDashboardData() as DashboardData;
                setDashboardData(data);
                if (data.latestSnapshot) {
                    setActiveSnapshotId(data.latestSnapshot.id);

                    // If summary exists in snapshot, use it immediately (UX optimization)
                    if (data.latestSnapshot.ai_summary) {
                        setLatestSummary(data.latestSnapshot.ai_summary);
                        return;
                    }
                }

                setLatestSummary("✨ 正在為您產生即時 AI 財務洞察中...");
                const liveSummary = await generateLiveAISummary(data);
                setLatestSummary(liveSummary);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
                setLatestSummary("⚠️ 無法載入財務數據。");
            }
        };

        loadDashboard();
    }, []);

    const handleRegenerate = async () => {
        if (!dashboardData || !feedbackText.trim() || isRegenerating) return;

        setIsRegenerating(true);
        setLatestSummary("✨ 正在依據您的回饋重新產生洞察中...");

        try {
            const newSummary = await generateLiveAISummary(dashboardData, feedbackText.trim());
            setLatestSummary(newSummary);
            setFeedbackText("");
        } catch (error) {
            console.error("Failed to regenerate summary", error);
            setLatestSummary("⚠️ 重新產生失敗，請稍後再試。");
        } finally {
            setIsRegenerating(false);
        }
    };

    const toggleFilter = (key: 'currency' | 'type' | 'owner', value: string) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            if (newFilters[key] === value) delete newFilters[key];
            else newFilters[key] = value;
            return newFilters;
        });
    };

    const displayData = useMemo(() => {
        if (!dashboardData || !activeSnapshotId) return dashboardData;

        const snapshotDetail = dashboardData.snapshotDetails[activeSnapshotId];
        if (!snapshotDetail || !snapshotDetail.rawRecords) return dashboardData;

        let records = snapshotDetail.rawRecords;

        if (activeFilters.currency) records = records.filter((r: any) => r.assets?.currency === activeFilters.currency);
        if (activeFilters.type) records = records.filter((r: any) => r.assets?.asset_type === activeFilters.type);
        if (activeFilters.owner) records = records.filter((r: any) => r.assets?.owner === activeFilters.owner);

        let totalValueFiltered = 0;
        const currencyMap: Record<string, number> = {};
        const allocationMap: Record<string, number> = {};
        const ownershipMap: Record<string, number> = {};

        records.forEach((record: any) => {
            const val = Number(record.total_twd_value) || 0;
            totalValueFiltered += val;

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
                value: totalValueFiltered > 0 ? Number((value / totalValueFiltered * 100).toFixed(1)) : 0,
                raw_value: value,
                color: colorMap[name] || "#CBD5E1",
                originalKey: name
            })).sort((a, b) => b.value - a.value);
        };

        const trendData = Object.entries(dashboardData.snapshotDetails).map(([id, detail]: [string, any]) => {
            const allSnapRecords = detail.rawRecords || [];
            let filteredRecords = allSnapRecords;

            if (activeFilters.currency) filteredRecords = filteredRecords.filter((r: any) => r.assets?.currency === activeFilters.currency);
            if (activeFilters.type) filteredRecords = filteredRecords.filter((r: any) => r.assets?.asset_type === activeFilters.type);
            if (activeFilters.owner) filteredRecords = filteredRecords.filter((r: any) => r.assets?.owner === activeFilters.owner);

            const filteredValue = filteredRecords.reduce((sum: number, r: any) => sum + (Number(r.total_twd_value) || 0), 0);
            const totalValue = allSnapRecords.reduce((sum: number, r: any) => sum + (Number(r.total_twd_value) || 0), 0);

            return {
                id,
                name: detail.period_name,
                fullAssets: Math.round(totalValue / 10000),
                filteredAssets: Math.round(filteredValue / 10000),
                color: id === activeSnapshotId ? "#22c55e" : "#94a3b8"
            };
        }).sort((a: any, b: any) => {
            const indexA = dashboardData.trendData.findIndex((t: any) => t.id === a.id);
            const indexB = dashboardData.trendData.findIndex((t: any) => t.id === b.id);
            return indexA - indexB;
        });

        return {
            ...snapshotDetail,
            totalNetWorth: totalValueFiltered,
            trendData,
            currencyData: formatPieData(currencyMap, { USD: "#f59e0b", TWD: "#3b82f6", JPY: "#ef4444" }),
            allocationData: formatPieData(allocationMap, { cash: "#3b82f6", stock: "#8b5cf6", fixed_deposit: "#f59e0b", rsu: "#10b981" }),
            ownershipData: formatPieData(ownershipMap, { PY: "#10b981", Kigo: "#fcd34d", Both: "#6366f1" })
        };
    }, [dashboardData, activeSnapshotId, activeFilters]);

    if (!mounted) return <div className="animate-pulse space-y-8 p-4"><div className="h-32 bg-slate-200 rounded-2xl w-full"></div></div>;

    const hasFilters = Object.keys(activeFilters).length > 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-brand-600" />
                    家庭財務戰情室 (Financial Dashboard)
                </h1>
                <p className="text-slate-500 mt-1 text-sm font-medium">包含自動化財務洞察與多維度資產解析</p>
            </div>

            {/* AI Insights Section */}
            <AIInsightSection
                latestSummary={latestSummary}
                feedbackText={feedbackText}
                setFeedbackText={setFeedbackText}
                handleRegenerate={handleRegenerate}
                isRegenerating={isRegenerating}
            />

            {/* Filter Banner */}
            {hasFilters && (
                <div className="flex items-center gap-3 bg-brand-50 text-brand-700 px-4 py-3 rounded-xl border border-brand-200 text-sm font-medium animate-in fade-in">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                        依點擊互動篩選中：
                    </span>
                    <div className="flex gap-2">
                        {activeFilters.currency && <span className="bg-white px-2 py-1 rounded shadow-sm">幣別: {activeFilters.currency}</span>}
                        {activeFilters.type && <span className="bg-white px-2 py-1 rounded shadow-sm">資產: {activeFilters.type === 'fixed_deposit' ? '定存' : activeFilters.type}</span>}
                        {activeFilters.owner && <span className="bg-white px-2 py-1 rounded shadow-sm">成員: {activeFilters.owner}</span>}
                    </div>
                    <button onClick={() => setActiveFilters({})} className="ml-auto flex items-center gap-1 bg-white hover:bg-slate-100 px-3 py-1 rounded shadow-sm text-slate-600 transition-colors">
                        <XCircle className="w-4 h-4" /> 清除篩選
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Trend Chart */}
                <TrendChart
                    trendData={displayData?.trendData || []}
                    activeSnapshotId={activeSnapshotId}
                    setActiveSnapshotId={setActiveSnapshotId}
                    hasFilters={hasFilters}
                />

                {/* Pie Charts */}
                <AggregationPieCharts
                    currencyData={displayData?.currencyData || []}
                    allocationData={displayData?.allocationData || []}
                    ownershipData={displayData?.ownershipData || []}
                    activeFilters={activeFilters}
                    toggleFilter={toggleFilter}
                />
            </div>
        </div>
    );
}
