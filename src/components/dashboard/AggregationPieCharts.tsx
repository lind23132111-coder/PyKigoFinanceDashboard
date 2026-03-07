"use client";

import React from "react";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from "recharts";
import { PieChartItem } from "@/types/dashboard";

interface AggregationPieChartsProps {
    currencyData: PieChartItem[];
    allocationData: PieChartItem[];
    ownershipData: PieChartItem[];
    activeFilters: { currency?: string, type?: string, owner?: string };
    toggleFilter: (key: 'currency' | 'type' | 'owner', value: string) => void;
}

const renderPie = (
    data: PieChartItem[],
    filterKey: 'currency' | 'type' | 'owner',
    activeValue: string | undefined,
    toggleFilter: (key: 'currency' | 'type' | 'owner', value: string) => void,
    title: string,
    icon: string
) => {
    return (
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-xs md:text-sm font-bold text-slate-600 text-center mb-2 flex items-center justify-center gap-2">
                {icon} {title}
            </h3>
            <div className="h-[200px] md:h-[250px] w-full flex-grow relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => {
                                const isSelected = activeValue === entry.originalKey;
                                const isFaded = activeValue && !isSelected;
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        className="cursor-pointer transition-all duration-300 hover:opacity-80 stroke-white stroke-2"
                                        onClick={() => toggleFilter(filterKey, entry.originalKey)}
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
                            formatter={(value: any, entry: any) => {
                                return <span className="text-[10px] md:text-xs text-slate-500 font-medium">{entry.payload?.name} ({entry.payload?.value}%)</span>;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


export const AggregationPieCharts: React.FC<AggregationPieChartsProps> = ({
    currencyData,
    allocationData,
    ownershipData,
    activeFilters,
    toggleFilter
}) => {
    return (
        <>
            {renderPie(currencyData, 'currency', activeFilters.currency, toggleFilter, "幣別比例 (Currency Exposure)", "💱")}
            {renderPie(allocationData, 'type', activeFilters.type, toggleFilter, "資產配置 (Asset Class)", "🏛️")}
            {renderPie(ownershipData, 'owner', activeFilters.owner, toggleFilter, "成員佔比 (Ownership)", "🧑🏼‍🤝‍🧑🏻")}
        </>
    );
};
