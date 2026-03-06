"use client";

import React from "react";
import { TrendChartItem } from "@/types/dashboard";

interface TrendChartProps {
    trendData: TrendChartItem[];
    activeSnapshotId: string | null;
    setActiveSnapshotId: (id: string) => void;
    hasFilters: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
    trendData,
    activeSnapshotId,
    setActiveSnapshotId,
    hasFilters
}) => {
    const maxAsset = trendData.reduce((max, current) => Math.max(max, current.fullAssets || 0), 0);
    const chartMax = Math.max(maxAsset * 1.2, 100);

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
            <h3 className="text-sm font-bold text-slate-600 mb-6 text-center flex items-center justify-center gap-2">
                📈 總資產成長趨勢 (等值 NTD)
            </h3>
            <div className="h-[250px] w-full flex flex-col items-center justify-end relative">
                <div className="flex w-full justify-around items-end h-[150px] px-8 border-b border-slate-200 pb-0 gap-2">
                    {trendData.map((item, index) => {
                        const isSelected = activeSnapshotId === item.id;
                        const fullHeight = Math.max((item.fullAssets / chartMax) * 100, 2);
                        const filteredHeight = Math.max((item.filteredAssets / chartMax) * 100, 2);
                        const showStack = hasFilters && (item.filteredAssets !== undefined);

                        return (
                            <div
                                key={item.id}
                                className="flex flex-col items-center flex-1 group h-full justify-end cursor-pointer relative"
                                onClick={() => setActiveSnapshotId(item.id)}
                            >
                                <div className="absolute -top-8 flex flex-col items-center">
                                    {showStack && item.filteredAssets < item.fullAssets && (
                                        <span className="text-[10px] text-slate-400 font-bold leading-none mb-0.5">{item.fullAssets}萬</span>
                                    )}
                                    <span className={`text-xs font-black z-10 ${isSelected ? 'text-brand-600' : 'text-slate-600 opacity-60 group-hover:opacity-100 transition-all'}`}>
                                        {item.filteredAssets}萬
                                    </span>
                                </div>

                                <div className="w-full relative h-full flex items-end justify-center">
                                    {showStack && (
                                        <div
                                            className="absolute w-full bg-slate-100 rounded-t-lg transition-all"
                                            style={{ height: `${fullHeight}%` }}
                                        ></div>
                                    )}

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
                    {trendData.map((item) => (
                        <div
                            key={item.id}
                            className={`text-[10px] md:text-sm font-bold text-center flex-1 cursor-pointer transition-colors ${activeSnapshotId === item.id ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                            onClick={() => setActiveSnapshotId(item.id)}
                        >
                            {item.name}
                        </div>
                    ))}
                </div>

                <div className="text-emerald-500 font-black text-lg mt-4 flex items-center gap-1">
                    <span className="text-xs">▲</span> +80.9%
                </div>
            </div>
        </div>
    );
};
