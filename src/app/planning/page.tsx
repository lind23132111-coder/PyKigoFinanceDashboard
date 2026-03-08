"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, AlertTriangle, ShieldCheck, ChevronRight, Activity, Search, Target, PenLine } from "lucide-react";
import { getPlanningData } from "@/app/actions/planning";
import { getLatestDashboardData } from "@/app/actions/dashboard";
import TradingViewChart from "@/components/dashboard/TradingViewChart";
import StockPlanningNotes from "@/components/dashboard/StockPlanningNotes";

export default function PlanningPage() {
    const [planningData, setPlanningData] = useState<any>(null);
    const [actualAllocation, setActualAllocation] = useState<any[]>([]);
    const [selectedStock, setSelectedStock] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const plan = await getPlanningData();
            const dash = await getLatestDashboardData();

            setPlanningData(plan);
            setActualAllocation(dash.allocationData);

            // Set default selected stock if available
            if (plan.availableStocks && plan.availableStocks.length > 0) {
                setSelectedStock(plan.availableStocks[0].symbol);
            }

            setLoading(false);
        };
        load();
    }, []);

    if (loading) return <div className="p-8 animate-pulse text-slate-400">正在規劃您的財富藍圖中...</div>;

    const rebalanceNeeded = Math.abs((planningData.strategyTargets[0].target_percentage - 41)) > planningData.rebalancingThreshold;

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-brand-600" />
                            投資策略指揮中心 (Command Center)
                        </h1>
                        <span className="bg-brand-100 text-brand-700 text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase shadow-sm">Milestone V1.2</span>
                    </div>
                    <p className="text-slate-500 mt-2 text-sm font-semibold opacity-80">
                        整合即時行情分析、個人化交易筆記與長期配置策略
                    </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 px-5 py-2.5 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="bg-emerald-500 p-1.5 rounded-full shadow-lg shadow-emerald-200">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">財富自由進度</div>
                        <div className="text-lg font-black text-slate-700 leading-tight">74% <span className="text-xs font-bold text-slate-400">已達成</span></div>
                    </div>
                </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-12 gap-6 h-[700px]">
                {/* 1. Portfolio Focus List (Col 2) */}
                <div className="col-span-12 lg:col-span-3 glass rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-4 h-4 text-brand-500" />
                                核心持股清單
                            </h2>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">
                                {planningData.availableStocks?.length || 0} Assets
                            </span>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="快速過濾..."
                                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                        {planningData.availableStocks?.map((stock: any) => (
                            <button
                                key={stock.symbol}
                                onClick={() => setSelectedStock(stock.symbol)}
                                className={`w-full p-4 rounded-2xl transition-all border flex items-center gap-4 group ${selectedStock === stock.symbol
                                        ? 'bg-white border-brand-200 shadow-lg shadow-brand-50'
                                        : 'bg-transparent border-transparent hover:bg-white/60 hover:border-slate-100'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${selectedStock === stock.symbol ? 'bg-brand-500 text-white shadow-lg shadow-brand-200' : 'bg-slate-100 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500'
                                    }`}>
                                    {stock.symbol.slice(0, 3)}
                                </div>
                                <div className="text-left flex-1 truncate">
                                    <div className="text-sm font-black text-slate-700 truncate">{stock.symbol}</div>
                                    <div className="text-[10px] font-bold text-slate-400 truncate opacity-80">{stock.name}</div>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-all ${selectedStock === stock.symbol ? 'text-brand-400 translate-x-0' : 'text-slate-200 -translate-x-2'}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. TradingView Analysis (Col 6) */}
                <div className="col-span-12 lg:col-span-6 glass rounded-3xl border border-slate-200/60 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Market Data: {selectedStock}</span>
                    </div>
                    {selectedStock ? (
                        <TradingViewChart symbol={selectedStock} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <Target className="w-12 h-12 opacity-20" />
                            <p className="font-bold">請從左側選擇標的開始分析</p>
                        </div>
                    )}
                </div>

                {/* 3. Strategy Notes (Col 3) */}
                <div className="col-span-12 lg:col-span-3 glass rounded-3xl border border-slate-200/60 shadow-xl p-8 flex flex-col bg-white/40 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-brand-500 p-2 rounded-xl shadow-lg shadow-brand-200">
                            <PenLine className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 leading-tight">戰術筆記</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Strategic Analysis</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                        {selectedStock ? (
                            <StockPlanningNotes symbol={selectedStock} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">
                                等待標的選取...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row: High Level Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 pb-12">
                {/* Module 1: Portfolio Rebalancing */}
                <div className="glass p-10 rounded-3xl border border-slate-200/60 shadow-lg space-y-8 bg-gradient-to-br from-white/80 to-slate-50/50">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <Activity className="w-6 h-6 text-brand-500" />
                                資產再平衡對照 (Rebalancing)
                            </h2>
                            <p className="text-xs font-bold text-slate-400 mt-1">目前實際配額 vs 理想目標偏離值</p>
                        </div>
                        {rebalanceNeeded && (
                            <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
                                Rebalance Recommended
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-8 h-64">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">目標配置 (Target)</span>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={planningData.strategyTargets} dataKey="target_percentage" innerRadius={55} outerRadius={80} paddingAngle={8} minAngle={15}>
                                        {planningData.strategyTargets.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">實際資產 (Actual)</span>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={actualAllocation} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={8} minAngle={15}>
                                        {actualAllocation.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={planningData.strategyTargets[index % 4].color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Module 2: Dividend Snowball */}
                <div className="glass p-10 rounded-3xl border border-slate-200/60 shadow-lg space-y-8 bg-gradient-to-br from-white/80 to-emerald-50/30">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <TrendingUp className="w-6 h-6 text-emerald-500" />
                                股息滾雪球預測 (Dividend Snowball)
                            </h2>
                            <p className="text-xs font-bold text-slate-400 mt-1">基於歷史股息率與再投入策略的 10 年成長模擬</p>
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planningData.dividendProjections}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`$${Number(value).toLocaleString()}`, '預計年股息']}
                                />
                                <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="bg-slate-50 p-2 rounded-lg">
                                <Activity className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">目前年收</div>
                                <div className="text-xl font-black text-slate-700">$45,000</div>
                            </div>
                        </div>
                        <div className="p-5 bg-brand-500 rounded-2xl border border-brand-600 shadow-lg shadow-brand-200 flex items-center gap-4">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <div className="text-[10px] text-white/70 font-black uppercase tracking-widest">2030 預計</div>
                                <div className="text-xl font-black text-white">$190,000</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
