"use client";

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryData {
    name: string;
    amount: number;
    color: string;
}

interface ExpenseCategoryChartProps {
    data: CategoryData[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">{payload[0].name}</p>
                <p className="text-xl font-black text-white">
                    NT$ {payload[0].value.toLocaleString()}
                </p>
                <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${payload[0].payload.percent * 100}%` }}
                    />
                </div>
            </div>
        );
    }
    return null;
};

const CustomLegend = ({ payload }: any) => {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.payload.amount, 0);

    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
            {payload.map((entry: any, index: number) => {
                const percent = total > 0 ? (entry.payload.amount / total) * 100 : 0;
                return (
                    <div key={`item-${index}`} className="flex items-center gap-2 group cursor-pointer">
                        <div
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: entry.color }}
                        />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none group-hover:text-slate-900 transition-colors">
                                {entry.value}
                            </span>
                            <span className="text-xs font-bold text-slate-400 mt-0.5">
                                {Math.round(percent)}%
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export function ExpenseCategoryChart({ data }: ExpenseCategoryChartProps) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data;
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <div className="w-6 h-6 border-2 border-gray-300 border-dashed rounded-full" />
                </div>
                <p className="text-sm font-bold text-gray-400">目前無分類數據</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[350px] flex flex-col">
            <div className="flex-1 min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="amount"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<CustomLegend />} verticalAlign="bottom" />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Balance Label */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-[-40px] text-center pointer-events-none">
                    <div className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1">Total</div>
                    <div className="text-xl font-black text-slate-900 tracking-tighter">
                        {chartData.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
