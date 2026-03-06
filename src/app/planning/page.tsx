"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, AlertTriangle, ShieldCheck, ChevronRight, Activity } from "lucide-react";
import { getPlanningData } from "@/app/actions/planning";
import { getLatestDashboardData } from "@/app/actions/dashboard";
import { StrategyTarget, ProjectedDividend } from "@/types/dashboard";

export default function PlanningPage() {
    const [planningData, setPlanningData] = useState<any>(null);
    const [actualAllocation, setActualAllocation] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const plan = await getPlanningData();
            const dash = await getLatestDashboardData();

            // Map actual allocation for comparison
            // Simplified: Mapping by category keywords matching mock categories
            const alloc = dash.allocationData.map((d: any) => ({
                name: d.name,
                value: d.value,
                raw_value: d.raw_value
            }));

            setPlanningData(plan);
            setActualAllocation(alloc);
            setLoading(false);
        };
        load();
    }, []);

    if (loading) return <div className="p-8 animate-pulse text-slate-400">正在規劃您的財富藍圖中...</div>;

    const rebalanceNeeded = Math.abs((planningData.strategyTargets[0].target_percentage - 41)) > planningData.rebalancingThreshold;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-brand-600" />
                            長期投資規劃 (Investment Planning)
                        </h1>
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase">Idea Phase / Beta</span>
                    </div>
                    <p className="text-slate-500 mt-1 text-sm font-medium">制定理想資產配置策略與被動收入預測 (目前為構想 Prototype 階段)</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <div>
                        <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider">財富自由進度</div>
                        <div className="text-sm font-bold text-slate-700">74% 已達成</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Module 1: Portfolio Rebalancing */}
                <div className="glass p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-brand-500" />
                            資產再平衡對照 (Rebalancing)
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 h-64">
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase mb-2">目標配置 (Target)</span>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={planningData.strategyTargets} dataKey="target_percentage" innerRadius={45} outerRadius={65} paddingAngle={5}>
                                        {planningData.strategyTargets.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase mb-2">實際資產 (Actual)</span>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={actualAllocation} dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={5}>
                                        {actualAllocation.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={planningData.strategyTargets[index % 4].color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {rebalanceNeeded && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-4 animate-bounce-slow">
                            <div className="bg-amber-100 p-2 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-amber-900">檢測到配置偏移 (Deviation Detected)</div>
                                <div className="text-xs text-amber-700">目前成長型資產過重，建議進行再平衡以符合理想策略。</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-amber-400" />
                        </div>
                    )}
                </div>

                {/* Module 2: Dividend Snowball */}
                <div className="glass p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold text-slate-800">股息滾雪球預測 (Dividend Snowball)</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planningData.dividendProjections}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`$${Number(value).toLocaleString()}`, '預計年股息']}
                                />
                                <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="text-center flex-1 border-r border-slate-200">
                            <div className="text-xs text-slate-400 font-bold uppercase">目前年收</div>
                            <div className="text-lg font-black text-slate-700">$45,000</div>
                        </div>
                        <div className="text-center flex-1">
                            <div className="text-xs text-slate-400 font-bold uppercase">2030 預計</div>
                            <div className="text-lg font-black text-brand-600">$190,000</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
