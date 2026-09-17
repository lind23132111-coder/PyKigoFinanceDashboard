"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, XCircle } from "lucide-react";
import { getLatestDashboardData } from "@/app/actions/dashboard";
import { generateLiveAISummary } from "@/app/actions/ai";
import { DashboardData } from "@/types/dashboard";
import { useLanguage } from "@/context/LanguageContext";

// Sub-components
import { AIInsightSection } from "@/components/dashboard/AIInsightSection";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { AggregationPieCharts } from "@/components/dashboard/AggregationPieCharts";

export default function Dashboard() {
    const { t, lang } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [latestSummary, setLatestSummary] = useState<string>("");
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<{ currency?: string, type?: string, owner?: string }>({});

    useEffect(() => {
        setLatestSummary(t('dashboard.aiInsightDefaultLoading'));
    }, [lang]);

    useEffect(() => {
        setMounted(true);

        const loadDashboard = async () => {
            try {
                const data = await getLatestDashboardData(lang) as DashboardData;
                setDashboardData(data);
                if (data.latestSnapshot) {
                    setActiveSnapshotId(data.latestSnapshot.id);

                    // If summary exists in snapshot and language is ZH, use it immediately (UX optimization)
                    if (data.latestSnapshot.ai_summary && lang !== 'en' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
                        setLatestSummary(data.latestSnapshot.ai_summary);
                        return;
                    }
                }

                setLatestSummary(t('dashboard.aiInsightGenerating'));
                const liveSummary = await generateLiveAISummary(data, undefined, lang);
                setLatestSummary(liveSummary);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
                setLatestSummary(t('dashboard.aiInsightError'));
            }
        };

        loadDashboard();
    }, [lang]);

    const handleRegenerate = async () => {
        if (!dashboardData || !feedbackText.trim() || isRegenerating) return;

        setIsRegenerating(true);
        setLatestSummary(t('dashboard.aiInsightRegenerating'));

        try {
            const newSummary = await generateLiveAISummary(dashboardData, feedbackText.trim(), lang);
            setLatestSummary(newSummary);
            setFeedbackText("");
        } catch (error) {
            console.error("Failed to regenerate summary", error);
            setLatestSummary(t('dashboard.aiInsightRegenerateError'));
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
                    {t('dashboard.title')} <span className="text-brand-600 text-lg">{t('dashboard.titleEnSuffix')}</span>
                </h1>
                <p className="text-slate-500 mt-1 text-sm font-medium">{t('dashboard.subtitle')}</p>
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
                <div className="sticky top-16 z-30 flex items-center gap-3 bg-brand-50/95 backdrop-blur-sm text-brand-700 px-4 py-3 rounded-xl border border-brand-200 text-sm font-medium animate-in fade-in shadow-sm md:static md:z-auto md:bg-brand-50 md:backdrop-none">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                        <span className="hidden xs:inline">{t('dashboard.filterBannerActive')}</span>
                        <span className="xs:hidden">{t('dashboard.filterBannerActiveMobile')}</span>
                    </span>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {activeFilters.currency && <span className="bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">{t('dashboard.currencyLabel')}: {activeFilters.currency}</span>}
                        {activeFilters.type && <span className="bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">{t('dashboard.assetTypeLabel')}: {activeFilters.type === 'fixed_deposit' ? t('dashboard.fixedDepositLabel') : activeFilters.type}</span>}
                        {activeFilters.owner && <span className="bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">{t('dashboard.memberLabel')}: {activeFilters.owner}</span>}
                    </div>
                    <button onClick={() => setActiveFilters({})} className="ml-auto flex items-center gap-1 bg-white hover:bg-slate-100 px-3 py-1 rounded shadow-sm text-slate-600 transition-colors shrink-0">
                        <XCircle className="w-4 h-4" /> {t('dashboard.clearFilter')}
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
