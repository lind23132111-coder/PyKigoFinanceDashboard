"use client";

import { useState, useEffect } from "react";
import { RefreshCcw, Building, CheckCircle2 } from "lucide-react";
import { getReportData } from "@/app/actions/dashboard";
export default function ReportPage() {
    const [activeTab, setActiveTab] = useState("All");
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getReportData();
            setReportData(data);
        } catch (error) {
            console.error("Failed to load report data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading || !reportData) {
        return <div className="animate-pulse space-y-8 p-4"><div className="h-32 bg-slate-200 rounded-2xl w-full"></div></div>;
    }

    const { summaryCards, assetItems, liveMarketData, periodName } = reportData;

    const filteredItems = assetItems.filter((item: any) => {
        if (activeTab === "All") return true;
        if (activeTab === "Cash" && item.category === "Cash") return true;
        if (activeTab === "Stocks" && item.category === "Stocks") return true;
        return false;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">家庭資產總覽 (等值 NTD)</h1>
                    <p className="text-slate-400 mt-2 text-sm font-medium">資料期數：{periodName} | 即時匯率與報價已同步</p>
                </div>
                <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm">
                    <RefreshCcw className="w-4 h-4" />
                    同步最新資料
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card: any, idx: number) => (
                    <div key={idx} className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm border-l-4 ${card.borderColor}`}>
                        <h3 className="text-sm font-bold text-slate-600 mb-2">{card.title}</h3>
                        <p className="text-2xl font-black text-slate-800 mb-2">
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
                            <Building className="w-5 h-5 text-brand-500" />
                            Live Market Sync
                        </h3>

                        <div className="space-y-4">
                            {liveMarketData.map((item: any) => (
                                <div key={item.symbol} className="flex justify-between items-center text-sm border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                                    <span className="font-medium text-slate-500">{item.symbol}</span>
                                    <span className="font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md">
                                        {item.type === 'stock' ? '$ ' : ''}{item.price.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 text-xs text-slate-500 flex items-center gap-1.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            Last synced 10 mins ago
                        </div>
                    </div>
                </div>

                {/* Right Column: Main Table Area */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">

                    {/* Table Header & Tabs */}
                    <div className="p-6 md:px-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <h2 className="text-xl font-bold text-slate-800">重點資產追蹤明細</h2>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setActiveTab("All")}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeTab === "All" ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
                            >
                                全部 (All)
                            </button>
                            <button
                                onClick={() => setActiveTab("Cash")}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeTab === "Cash" ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
                            >
                                現金存款 (Cash)
                            </button>
                            <button
                                onClick={() => setActiveTab("Stocks")}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeTab === "Stocks" ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
                            >
                                證券投資 (Stocks)
                            </button>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-4 px-6 md:px-8 text-sm font-bold text-slate-400 whitespace-nowrap">歸屬 (PIC)</th>
                                    <th className="py-4 px-6 md:px-8 text-sm font-bold text-slate-400 whitespace-nowrap">類型</th>
                                    <th className="py-4 px-6 md:px-8 text-sm font-bold text-slate-400 whitespace-nowrap">帳戶/標的名稱</th>
                                    <th className="py-4 px-6 md:px-8 text-sm font-bold text-slate-400 whitespace-nowrap">原幣金額/數量</th>
                                    <th className="py-4 px-6 md:px-8 text-sm font-bold text-slate-400 whitespace-nowrap text-right">約當台幣 (NTD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">沒有符合條件的資產記錄</td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item: any) => (
                                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6 md:px-8">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${item.ownerColor}`}>
                                                    {item.owner}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 md:px-8">
                                                <span className="text-sm font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 md:px-8 font-bold text-slate-800">
                                                {item.name}
                                            </td>
                                            <td className="py-4 px-6 md:px-8 text-sm font-medium text-slate-500">
                                                {item.originalAmount}
                                            </td>
                                            <td className="py-4 px-6 md:px-8 font-black text-slate-800 text-right">
                                                NT$ {item.ntdAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {filteredItems.length === 0 && (
                            <div className="p-8 text-center text-slate-500 font-medium">
                                No assets found for the selected category.
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
