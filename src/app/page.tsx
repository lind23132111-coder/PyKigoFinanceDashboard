"use client";

import { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, AlertCircle, Sparkles } from "lucide-react";

// Mock Data for UI Visualization
const assetGrowthData = [
    { name: "2025_Q1", assets: 15000000 },
    { name: "2025_Q2", assets: 17500000 },
    { name: "2025_Q3", assets: 18200000 },
    { name: "2025_Q4", assets: 21000000 },
    { name: "2026_Q1", assets: 24500000 },
];

const currencyData = [
    { name: "TWD", value: 12000000, color: "#3b82f6" },
    { name: "USD", value: 10000000, color: "#10b981" },
    { name: "JPY", value: 2500000, color: "#f59e0b" },
];

const allocationData = [
    { name: "Stock", value: 16000000, color: "#8b5cf6" },
    { name: "Cash", value: 6500000, color: "#ec4899" },
    { name: "Fixed Deposit", value: 2000000, color: "#06b6d4" },
];

const ownershipData = [
    { name: "PY", value: 11000000, color: "#6366f1" },
    { name: "Kigo", value: 9500000, color: "#14b8a6" },
    { name: "Both", value: 4000000, color: "#f43f5e" },
];

export default function Dashboard() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="animate-pulse space-y-8 p-4"><div className="h-32 bg-slate-200 rounded-2xl w-full"></div></div>;

    const currentNetWorth = assetGrowthData[assetGrowthData.length - 1].assets;
    const previousNetWorth = assetGrowthData[assetGrowthData.length - 2].assets;
    const growthRate = ((currentNetWorth - previousNetWorth) / previousNetWorth) * 100;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header Metrics */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Overview</h1>
                    <p className="text-slate-500 mt-1">Snapshot of your family's quarterly progress.</p>
                </div>

                <div className="glass px-8 py-5 rounded-3xl min-w-[280px]">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Net Worth</p>
                    <div className="flex items-end gap-3">
                        <h2 className="text-4xl font-black text-slate-900">
                            ${(currentNetWorth / 10000).toFixed(0)}<span className="text-2xl text-slate-400">W</span>
                        </h2>
                        <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg text-sm font-bold mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>+{growthRate.toFixed(1)}% YoY</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-5 flex items-start gap-4">
                <div className="bg-white p-2 rounded-xl shadow-sm text-brand-600 mt-1">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        AI Summary Insight
                    </h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                        Your US stock exposure has grown by 15% this quarter, largely driven by MU performance. You may want to rebalance if your USD allocation exceeds your risk tolerance. Your emergency cash reserves (TWD) represent 6 months of expenses, which is healthy.
                    </p>
                </div>
            </div>

            {/* 2x2 Grid Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Net Worth Trend */}
                <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Asset Growth Trend</h3>
                    <div className="h-[300px] w-full flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assetGrowthData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                <YAxis
                                    tickFormatter={(val) => `$${val / 10000}W`}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b' }}
                                    dx={-10}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="assets" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Currency Pie */}
                <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Currency Exposure</h3>
                    <div className="h-[300px] w-full flex-grow relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={currencyData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {currencyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(val: any) => `$${(val / 10000).toFixed(1)}W`} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Asset Allocation Pie */}
                <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Asset Allocation</h3>
                    <div className="h-[300px] w-full flex-grow relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={allocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {allocationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(val: any) => `$${(val / 10000).toFixed(1)}W`} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Owner Allocation Pie */}
                <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Ownership Split</h3>
                    <div className="h-[300px] w-full flex-grow relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ownershipData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {ownershipData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(val: any) => `$${(val / 10000).toFixed(1)}W`} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
