"use client";

import { useState, useEffect, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend
} from "recharts";
import { BarChart3, Sparkles, Send, XCircle } from "lucide-react";
import { getLatestDashboardData, generateLiveAISummary } from "@/app/actions";

// Custom Label for Pie Charts
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    return null; // The legends handle the percentages in this specific design
};

export default function Dashboard() {
    const [mounted, setMounted] = useState(false);
    const [latestSummary, setLatestSummary] = useState<string>("正在載入最新的財務數據中...");
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<{ currency?: string, type?: string, owner?: string }>({});

    useEffect(() => {
        setMounted(true);

        const loadDashboard = async () => {
            try {
                const data = await getLatestDashboardData();
                setDashboardData(data);
                if (data.latestSnapshot) {
                    setActiveSnapshotId(data.latestSnapshot.id);
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
            setFeedbackText(""); // Clear feedback after success
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

        // Start with raw records for this snapshot
        let records = snapshotDetail.rawRecords;

        // Apply active filters
        if (activeFilters.currency) records = records.filter((r: any) => r.assets?.currency === activeFilters.currency);
        if (activeFilters.type) records = records.filter((r: any) => r.assets?.asset_type === activeFilters.type);
        if (activeFilters.owner) records = records.filter((r: any) => r.assets?.owner === activeFilters.owner);

        // Calculate new maps
        let totalNetWorth = 0;
        const currencyMap: Record<string, number> = {};
        const allocationMap: Record<string, number> = {};
        const ownershipMap: Record<string, number> = {};

        records.forEach((record: any) => {
            const val = Number(record.total_twd_value) || 0;
            totalNetWorth += val;

            const asset = Array.isArray(record.assets) ? record.assets[0] : record.assets;
            if (asset) {
                currencyMap[asset.currency] = (currencyMap[asset.currency] || 0) + val;
                allocationMap[asset.asset_type] = (allocationMap[asset.asset_type] || 0) + val;
                ownershipMap[asset.owner] = (ownershipMap[asset.owner] || 0) + val;
            }
        });

        // Helper to format pie data
        const formatPieData = (map: Record<string, number>, colorMap: Record<string, string>) => {
            return Object.entries(map).map(([name, value]) => ({
                name,
                value: totalNetWorth > 0 ? Number((value / totalNetWorth * 100).toFixed(1)) : 0,
                raw_value: value,
                color: colorMap[name] || "#CBD5E1",
                originalKey: name
            })).sort((a, b) => b.value - a.value);
        };

        // NEW: Calculate Trend Data based on filters
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
            // We need to keep the original order from dashboardData.trendData if possible
            const indexA = dashboardData.trendData.findIndex((t: any) => t.id === a.id);
            const indexB = dashboardData.trendData.findIndex((t: any) => t.id === b.id);
            return indexA - indexB;
        });

        return {
            ...snapshotDetail,
            totalNetWorth,
            trendData, // Overriding trendData with filter-aware version
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

            {/* AI Insights */}
            <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-5 flex items-start gap-4">
                <div className="bg-white p-2 rounded-xl shadow-sm text-brand-600 mt-1">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 w-full">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        AI Summary Insight
                    </h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed whitespace-pre-line min-h-[40px]">
                        {latestSummary}
                    </p>
                    <div className="mt-3 flex gap-2 relative">
                        <input
                            type="text"
                            placeholder="給 AI 一些建議，例如：請短一點、多關注股票..."
                            className="text-xs px-3 py-1.5 rounded-lg border border-brand-200 bg-white shadow-sm flex-1 outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-700"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
                            disabled={isRegenerating || latestSummary.includes('正在為您產生') || latestSummary.includes('載入最新的財務數據')}
                        />
                        <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating || !feedbackText.trim() || latestSummary.includes('正在為您產生') || latestSummary.includes('載入最新的財務數據')}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRegenerating ? <span className="animate-pulse text-xs">生成中...</span> : <><Send className="w-3 h-3" /> 重新生成</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2x2 Grid Charts */}
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

                {/* Net Worth Trend - Custom Bar Chart */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-600 mb-6 text-center flex items-center justify-center gap-2">
                        📈 總資產成長趨勢 (等值 NTD)
                    </h3>
                    <div className="h-[250px] w-full flex flex-col items-center justify-end relative">
                        {(() => {
                            const trendData = displayData?.trendData || [];
                            const maxAsset = trendData.reduce((max: number, current: any) => Math.max(max, current.fullAssets || current.assets || 0), 0);
                            const chartMax = Math.max(maxAsset * 1.2, 100);

                            return (
                                <>
                                    <div className="flex w-full justify-around items-end h-[150px] px-8 border-b border-slate-200 pb-0 gap-2">
                                        {trendData.map((item: any, index: number) => {
                                            const isSelected = activeSnapshotId === item.id;
                                            const fullHeight = Math.max(((item.fullAssets || item.assets) / chartMax) * 100, 2);
                                            const filteredHeight = Math.max(((item.filteredAssets ?? item.assets) / chartMax) * 100, 2);
                                            const showStack = hasFilters && (item.filteredAssets !== undefined);

                                            return (
                                                <div
                                                    key={index}
                                                    className="flex flex-col items-center flex-1 group h-full justify-end cursor-pointer relative"
                                                    onClick={() => setActiveSnapshotId(item.id)}
                                                >
                                                    <div className="absolute -top-8 flex flex-col items-center">
                                                        {showStack && item.filteredAssets < item.fullAssets && (
                                                            <span className="text-[10px] text-slate-400 font-bold leading-none mb-0.5">{item.fullAssets}萬</span>
                                                        )}
                                                        <span className={`text-xs font-black z-10 ${isSelected ? 'text-brand-600' : 'text-slate-600 opacity-60 group-hover:opacity-100 transition-all'}`}>
                                                            {item.filteredAssets ?? item.assets}萬
                                                        </span>
                                                    </div>

                                                    <div className="w-full relative h-full flex items-end justify-center">
                                                        {/* Background Total Bar (Visible when filtering) */}
                                                        {showStack && (
                                                            <div
                                                                className="absolute w-full bg-slate-100 rounded-t-lg transition-all"
                                                                style={{ height: `${fullHeight}%` }}
                                                            ></div>
                                                        )}

                                                        {/* Main/Filtered Bar */}
                                                        <div
                                                            className={`w-full rounded-t-lg transition-all border-b-0 border-white/20 border-x z-10 ${isSelected ? 'opacity-100 ring-2 ring-brand-400 ring-offset-2' : 'opacity-70 group-hover:opacity-100'}`}
                                                            style={{
                                                                height: `${filteredHeight}%`,
                                                                backgroundColor: item.color
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex w-full justify-around mt-3 px-8 gap-2">
                                        {trendData.map((item: any, index: number) => (
                                            <div
                                                key={index}
                                                className={`text-[10px] md:text-sm font-bold text-center flex-1 cursor-pointer transition-colors ${activeSnapshotId === item.id ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                onClick={() => setActiveSnapshotId(item.id)}
                                            >
                                                {item.name}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}

                        {/* Growth Indicator */}
                        <div className="text-emerald-500 font-black text-lg mt-4 flex items-center gap-1">
                            <span className="text-xs">▲</span> +80.9%
                        </div>
                    </div>
                </div>

                {/* Currency Pie */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-600 text-center mb-2 flex items-center justify-center gap-2">
                        💱 幣別比例 (Currency Exposure)
                    </h3>
                    <div className="h-[250px] w-full flex-grow relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={displayData?.currencyData || []}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {(displayData?.currencyData || []).map((entry: any, index: number) => {
                                        const isSelected = activeFilters.currency === entry.originalKey;
                                        const isFaded = activeFilters.currency && !isSelected;
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                className="cursor-pointer transition-all duration-300 hover:opacity-80 stroke-white stroke-2"
                                                onClick={() => toggleFilter('currency', entry.originalKey)}
                                                style={{ opacity: isFaded ? 0.3 : 1 }}
                                            />
                                        );
                                    })}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value: any, name: any, props: any) => [
                                        `${value}% (NT$ ${props.payload.raw_value.toLocaleString(undefined, { maximumFractionDigits: 0 })})`,
                                        name
                                    ]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value, entry: any) => {
                                        return <span className="text-xs text-slate-500 font-medium">{entry.payload?.name} ({entry.payload?.value}%)</span>;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Asset Allocation Pie */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-600 text-center mb-2 flex items-center justify-center gap-2">
                        🏛️ 資產配置 (Asset Class)
                    </h3>
                    <div className="h-[250px] w-full flex-grow relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={displayData?.allocationData || []}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {(displayData?.allocationData || []).map((entry: any, index: number) => {
                                        const isSelected = activeFilters.type === entry.originalKey;
                                        const isFaded = activeFilters.type && !isSelected;
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                className="cursor-pointer transition-all duration-300 hover:opacity-80 stroke-white stroke-2"
                                                onClick={() => toggleFilter('type', entry.originalKey)}
                                                style={{ opacity: isFaded ? 0.3 : 1 }}
                                            />
                                        );
                                    })}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value: any, name: any, props: any) => [
                                        `${value}% (NT$ ${props.payload.raw_value.toLocaleString(undefined, { maximumFractionDigits: 0 })})`,
                                        name
                                    ]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value, entry: any) => {
                                        return <span className="text-xs text-slate-500 font-medium">{entry.payload?.name} ({entry.payload?.value}%)</span>;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Owner Allocation Pie */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-600 text-center mb-2 flex items-center justify-center gap-2">
                        🧑🏼‍🤝‍🧑🏻 成員佔比 (Ownership)
                    </h3>
                    <div className="h-[250px] w-full flex-grow relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={displayData?.ownershipData || []}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {(displayData?.ownershipData || []).map((entry: any, index: number) => {
                                        const isSelected = activeFilters.owner === entry.originalKey;
                                        const isFaded = activeFilters.owner && !isSelected;
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                className="cursor-pointer transition-all duration-300 hover:opacity-80 stroke-white stroke-2"
                                                onClick={() => toggleFilter('owner', entry.originalKey)}
                                                style={{ opacity: isFaded ? 0.3 : 1 }}
                                            />
                                        );
                                    })}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value: any, name: any, props: any) => [
                                        `${value}% (NT$ ${props.payload.raw_value.toLocaleString(undefined, { maximumFractionDigits: 0 })})`,
                                        name
                                    ]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value, entry: any) => {
                                        return <span className="text-xs text-slate-500 font-medium">{entry.payload?.name} ({entry.payload?.value}%)</span>;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
