"use client";

import React, { memo } from 'react';
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subtext?: string;
    progress?: number;
    color?: 'indigo' | 'amber';
    change?: string;
    project?: boolean;
    loading?: boolean;
}

const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600 border border-indigo-100/50",
    amber: "bg-amber-50 text-amber-600 border border-amber-100/50"
};

export const StatCard = memo(function StatCard({
    icon,
    label,
    value,
    subtext,
    progress,
    color = 'indigo',
    change,
    project,
    loading
}: StatCardProps) {
    return (
        <div className={cn(
            "group bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 relative overflow-hidden",
            project && "bg-gradient-to-br from-indigo-50/30 to-purple-50/30 border-indigo-100/50",
            loading && "animate-pulse"
        )}>
            <div className="flex justify-between items-start">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", colorClasses[color] || colorClasses.indigo)}>
                    {icon}
                </div>
                {change && !loading && (
                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1 border border-green-100 shadow-sm">
                        <TrendingUp className="w-3 h-3" /> {change}
                    </span>
                )}
                {project && (
                    <span className="text-[9px] font-black text-indigo-600 bg-white border border-indigo-100 px-2.5 py-1 rounded-full shadow-sm">
                        PROJECT
                    </span>
                )}
            </div>
            <div className="mt-4">
                <h4 className={cn("text-xs font-black text-gray-400 uppercase tracking-widest", project && "text-indigo-400")}>{label}</h4>
                <div className={cn("text-2xl md:text-3xl font-black text-gray-900 tracking-tighter mt-1", project && "text-indigo-900", loading && "text-gray-200")}>
                    {loading ? "---" : value}
                </div>
                {subtext && <div className="text-[11px] font-bold text-gray-400 mt-2 flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-gray-200"></div>{subtext}</div>}
                {progress !== undefined && (
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
                        <div
                            className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", color === 'amber' ? "bg-amber-400" : "bg-indigo-500")}
                            style={{ width: loading ? "0%" : `${progress}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    );
});
