"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCcw, Building, CheckCircle2, Clock, Calendar } from "lucide-react";
import { getReportData } from "@/app/actions/dashboard";
import { cn } from "@/lib/utils";

export default function ReportPage() {
    const [activeTab, setActiveTab] = useState("All");
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("");

    const loadData = useCallback(async (isInitial = false) => {
        setLoading(true);
        try {
            const data = await getReportData(isInitial ? undefined : selectedSnapshotId);
            setReportData(data);
            if (isInitial && data.availableSnapshots?.length > 0) {
                setSelectedSnapshotId(data.availableSnapshots[0].id);
            }
        } catch (error) {
            console.error("Failed to load report data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedSnapshotId]);

    useEffect(() => {
        loadData(true);
    }, []);

    // Selection handler
    const handleSnapshotChange = (id: string) => {
        setSelectedSnapshotId(id);
    };

    // Load data when selection changes (but not on first load which is handled above)
    useEffect(() => {
        if (selectedSnapshotId && reportData && selectedSnapshotId !== reportData.availableSnapshots.find((s: any) => s.period_name === reportData.periodName)?.id) {
            loadData();
        }
    }, [selectedSnapshotId]);

    if (!reportData && loading) {
        return <div className="animate-pulse space-y-8 p-4"><div className="h-32 bg-slate-200 rounded-2xl w-full"></div></div>;
    }

    if (!reportData) {
        return <div className="p-8 text-center text-slate-500 font-bold">尚未建立任何資產快照紀錄</div>;
    }

    const { summaryCards, assetItems, liveMarketData, periodName, createdAt, availableSnapshots } = reportData;

    const filteredItems = assetItems.filter((item: any) => {
        if (activeTab === "All") return true;
        if (activeTab === "Cash" && item.category === "Cash") return true;
        if (activeTab === "Stocks" && item.category === "Stocks") return true;
        return false;
    });

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">家庭資產總覽 <span className="text-blue-600">(NTD)</span></h1>
                    <div className="flex flex-col gap-1 mt-2">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            資料期數：{periodName}
                        </p>
                        <p className="text-slate-400 text-xs font-medium flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            快照時間：{formatDate(createdAt)}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Snapshot Selector UI */}
                    <div className="flex items-center gap-2 bg-slate-100/50 p-2 rounded-[1.25rem] border border-slate-200 shadow-sm backdrop-blur-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">切換期數:</span>
                        <select
                            value={selectedSnapshotId}
                            onChange={(e) => handleSnapshotChange(e.target.value)}
                            className="bg-white border-none text-sm font-black text-slate-700 focus:ring-2 focus:ring-blue-100 px-4 py-2 rounded-xl outline-none cursor-pointer shadow-sm transition-all hover:bg-slate-50 min-w-[140px]"
                        >
                            {availableSnapshots.map((snap: any) => (
                                <option key={snap.id} value={snap.id}>
                                    {snap.period_name}
                                </option>
                            ))}
                        </select>
                        <button
                            className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 ml-1"
                            onClick={() => loadData()}
                            disabled={loading}
                        >
                            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-10 rounded-3xl animate-pulse" />
                )}
                {summaryCards.map((card: any, idx: number) => (
                    <div key={idx} className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-sm border-l-4 ${card.borderColor}`}>
                        <h3 className="text-sm font-bold text-slate-600 mb-2">{card.title}</h3>
                        <p className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
                            NT$ {card.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs font-medium text-slate-400">{card.subtitle}</p>
                    </div>
                ))}
            </div>

            {/* Middle Section: Live Market Sync & Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Column: Automated Market Data */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="font-bold flex items-center gap-2 text-slate-800 mb-6 border-b border-slate-100 pb-4">
                            <Building className="w-5 h-5 text-blue-600" />
                            Live Market Sync
                        </h3>

                        <div className="space-y-4">
                            {liveMarketData.map((item: any) => (
                                <div key={item.symbol} className="flex justify-between items-center text-sm border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                                    <span className="font-medium text-slate-500">{item.symbol}</span>
                                    <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg">
                                        {item.type === 'stock' ? '$ ' : ''}{item.price.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 text-xs text-slate-500 flex items-center gap-1.5 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            系統匯率與收盤價已同步
                        </div>
                    </div>
                </div>

                {/* Right Column: Main Table Area */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-10 animate-pulse" />
                    )}
                    {/* Table Header & Tabs */}
                    <div className="p-6 md:px-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30">
                        <h2 className="text-xl font-bold text-slate-800">重點資產追蹤明細</h2>

                        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl">
                            <button
                                onClick={() => setActiveTab("All")}
                                className={cn(
                                    "px-5 py-2 rounded-xl text-xs font-black transition-all",
                                    activeTab === "All" ? "bg-white text-slate-900 shadow-sm scale-105" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                全部 (All)
                            </button>
                            <button
                                onClick={() => setActiveTab("Cash")}
                                className={cn(
                                    "px-5 py-2 rounded-xl text-xs font-black transition-all",
                                    activeTab === "Cash" ? "bg-white text-slate-900 shadow-sm scale-105" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                現金存款
                            </button>
                            <button
                                onClick={() => setActiveTab("Stocks")}
                                className={cn(
                                    "px-5 py-2 rounded-xl text-xs font-black transition-all",
                                    activeTab === "Stocks" ? "bg-white text-slate-900 shadow-sm scale-105" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                證券投資
                            </button>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/20">
                                    <th className="py-5 px-6 md:px-8 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">歸屬 (PIC)</th>
                                    <th className="py-5 px-6 md:px-8 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">類型</th>
                                    <th className="py-5 px-6 md:px-8 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">帳戶/標的名稱</th>
                                    <th className="py-5 px-6 md:px-8 text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">原幣金額/數量</th>
                                    <th className="py-5 px-6 md:px-8 text-[10px] font-black text-slate-400 whitespace-nowrap text-right uppercase tracking-widest">約當台幣 (NTD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-slate-400 font-bold text-sm italic">
                                            沒有符合條件的資產記錄
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item: any) => (
                                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-5 px-6 md:px-8">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-lg text-xs font-black whitespace-nowrap shadow-sm",
                                                    item.ownerColor
                                                )}>
                                                    {item.owner}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 md:px-8">
                                                <span className="text-[10px] font-black text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg uppercase">
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 md:px-8 font-black text-slate-900">
                                                {item.name}
                                            </td>
                                            <td className="py-5 px-6 md:px-8 text-sm font-bold text-slate-400">
                                                {item.originalAmount}
                                            </td>
                                            <td className="py-5 px-6 md:px-8 font-black text-slate-900 text-right text-lg">
                                                NT$ {item.ntdAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

        </div>
    );
}
