"use client";

import React, { useState, useEffect, memo } from 'react';
import {
    Receipt,
    Trash2,
    ChevronRight,
    Calendar,
    X,
    PenLine,
    Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Expense } from "@/types/expenses";
import {
    getExpenses,
    updateExpense,
    deleteExpense,
    confirmExpensesBulk
} from "@/app/actions/expenses";

/**
 * Tab Button Component
 */
export function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            )}
        >
            {icon} {label}
        </button>
    );
}

/**
 * Individual Expense Item Card
 */
export const ExpenseItemCard = memo(function ExpenseItemCard({
    item,
    onDelete,
    categories,
    goals,
    onUpdate,
    // Batch props
    isSelected,
    onToggleSelection,
    isBatchMode,
    onStageUpdate,
    stagedFields
}: {
    item: Expense,
    onDelete?: (id: string) => void,
    categories: any[],
    goals: any[],
    onUpdate: () => void,
    isSelected?: boolean,
    onToggleSelection?: () => void,
    isBatchMode?: boolean,
    onStageUpdate?: (fields: any) => void,
    stagedFields?: any
}) {
    const isUnconfirmed = !item.is_reviewed;
    const currentFields = {
        category_id: item.category_id || '',
        paid_by: item.paid_by || 'PY',
        paid_for: item.paid_for || 'Both',
        goal_id: item.goal_id || '',
        ...(stagedFields || {})
    };

    const hasStagedChanges = stagedFields && Object.keys(stagedFields).length > 0;

    const handleFieldChange = (field: string, value: any) => {
        if (onStageUpdate) {
            onStageUpdate({ [field]: value });
        }
        // Auto-select if in batch mode and not already selected
        if (isBatchMode && !isSelected && onToggleSelection) {
            onToggleSelection();
        }
    };

    const handleConfirmSingle = async () => {
        const { updateExpense } = await import("@/app/actions/expenses");
        await updateExpense(item.id, { ...currentFields, is_reviewed: true });
        onUpdate();
    };

    return (
        <div
            onClick={() => isBatchMode && onToggleSelection?.()}
            className={cn(
                "group bg-white border rounded-[2rem] p-5 hover:shadow-xl transition-all duration-300 relative overflow-hidden cursor-pointer",
                isUnconfirmed ? "border-amber-200 bg-amber-50/10" : "border-gray-100",
                isSelected ? "ring-2 ring-indigo-500 border-indigo-500 shadow-indigo-100 shadow-lg scale-[1.02]" : "",
                hasStagedChanges && !isSelected ? "border-indigo-300 ring-1 ring-indigo-100" : ""
            )}
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            {/* Selection Checkbox */}
            {isBatchMode && (
                <div className="absolute top-4 left-4 z-20">
                    <div className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-200"
                    )}>
                        {isSelected && <ChevronRight className="w-4 h-4 text-white rotate-90" />}
                    </div>
                </div>
            )}

            <div className={cn("flex justify-between items-start mb-4 relative z-10", isBatchMode ? "pl-8" : "")}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Receipt className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="font-black text-gray-900 text-base md:text-lg tracking-tight truncate max-w-[160px]">
                                {item.store_name}
                            </div>
                            {isUnconfirmed && (
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded-full tracking-wider uppercase">待確認</span>
                            )}
                        </div>
                        <div className="text-[11px] md:text-xs font-black text-gray-400 uppercase tracking-widest">{item.date}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="font-black text-gray-900 text-lg md:text-xl tracking-tight">-NT$ {item.amount.toLocaleString()}</div>
                    {!isBatchMode && onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                            className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="relative z-10 space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Project</span>
                        <select
                            value={currentFields.goal_id}
                            onChange={(e) => handleFieldChange('goal_id', e.target.value)}
                            className="bg-transparent text-xs font-black text-indigo-600 outline-none cursor-pointer"
                        >
                            <option value="">🏠 HOME</option>
                            {goals.map((g: any) => <option key={g.id} value={g.id}>🎯 {g.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</span>
                        <select
                            value={currentFields.category_id}
                            onChange={(e) => handleFieldChange('category_id', e.target.value)}
                            className="bg-transparent text-xs font-black text-gray-600 outline-none cursor-pointer"
                        >
                            <option value="">UNCATEGORIZED</option>
                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Paid By</span>
                        <select
                            value={currentFields.paid_by}
                            onChange={(e) => handleFieldChange('paid_by', e.target.value)}
                            className="bg-transparent text-xs font-black text-emerald-600 outline-none cursor-pointer"
                        >
                            <option value="PY">PY</option>
                            <option value="Kigo">Kigo</option>
                            <option value="Both">Both</option>
                        </select>
                    </div>
                    <div className="flex flex-col bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">For</span>
                        <select
                            value={currentFields.paid_for}
                            onChange={(e) => handleFieldChange('paid_for', e.target.value)}
                            className="bg-transparent text-xs font-black text-slate-500 outline-none cursor-pointer uppercase"
                        >
                            <option value="Both">BOTH</option>
                            <option value="PY">PY</option>
                            <option value="Kigo">Kigo</option>
                        </select>
                    </div>
                </div>

                {isUnconfirmed && !isBatchMode && (
                    <button
                        onClick={handleConfirmSingle}
                        className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-indigo-200 animate-in fade-in slide-in-from-bottom-2 flex items-center justify-center gap-2"
                    >
                        CONFIRM TRANSACTION
                    </button>
                )}
            </div>
        </div>
    );
});

/**
 * Batch Actions Bar
 */
export function BatchActionsBar({ selectedCount, onConfirm, onDelete, onCancel }: any) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-[90] animate-in slide-in-from-bottom-10 duration-500 w-[95%] md:w-auto">
            <div className="bg-slate-900/90 backdrop-blur-2xl px-6 md:px-10 py-3 md:py-4 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col md:flex-row items-center gap-4 md:gap-10">
                <div className="flex items-center gap-6 md:gap-0 md:flex-col shrink-0">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest md:mb-1">已選取</span>
                    <span className="text-[15px] md:text-xl font-black text-white leading-none">{selectedCount} <span className="text-[10px] text-slate-500 uppercase">Items</span></span>
                </div>

                <div className="hidden md:block h-8 w-px bg-white/10" />

                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                    <button
                        onClick={onCancel}
                        className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black text-slate-400 hover:text-white transition-colors border border-white/5 md:border-none"
                    >
                        取消
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black transition-all border border-rose-500/20"
                    >
                        刪除
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-[2] md:flex-none px-6 md:px-8 py-2 md:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                        確認變更 <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * All Expenses Modal with filtering
 */
export function AllExpensesModal({
    onClose,
    categories,
    goals,
    onUpdate,
    activeTab,
    initialStartDate,
    initialEndDate
}: any) {
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const isProject = activeTab !== 'all' && activeTab !== 'general';
    const [startDate, setStartDate] = useState(isProject ? "" : (initialStartDate || ""));
    const [endDate, setEndDate] = useState(isProject ? "" : (initialEndDate || ""));
    const [sortBy, setSortBy] = useState<'date' | 'updated_at'>('date');
    const [filterGoalId, setFilterGoalId] = useState(activeTab === 'all' || activeTab === 'general' ? "" : activeTab);
    const [showUnconfirmedOnly, setShowUnconfirmedOnly] = useState(false);

    // Batch States
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [stagedUpdates, setStagedUpdates] = useState<Record<string, Partial<Expense>>>({});
    const [isBatchMode, setIsBatchMode] = useState(true);

    useEffect(() => {
        loadAll();
    }, [activeTab, startDate, endDate, showUnconfirmedOnly, filterGoalId]);

    const loadAll = async () => {
        setIsLoading(true);
        try {
            const currentGoalId = filterGoalId || undefined;
            const data = await getExpenses({
                project_label: currentGoalId ? undefined : (activeTab === 'general' ? 'general' : undefined),
                goal_id: currentGoalId,
                is_reviewed: showUnconfirmedOnly ? false : undefined, // Fetch both if not filtering
                sortBy: sortBy,
                sortOrder: 'descending',
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            setAllExpenses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStageUpdate = (id: string, updates: Partial<Expense>) => {
        setStagedUpdates(prev => ({
            ...prev,
            [id]: { ...(prev[id] || {}), ...updates }
        }));
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBatchConfirm = async () => {
        if (selectedIds.size === 0) return;
        const itemsToConfirm = Array.from(selectedIds).map(id => ({
            id,
            updates: { ...(stagedUpdates[id] || {}), is_reviewed: true }
        }));
        try {
            setIsLoading(true);
            await confirmExpensesBulk(itemsToConfirm);
            setSelectedIds(new Set());
            setStagedUpdates({});
            setIsBatchMode(false);
            await loadAll();
            onUpdate();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBatchDelete = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        if (!confirm(`確定要刪除選取的 ${ids.length} 筆記錄嗎？`)) return;
        try {
            setIsLoading(true);
            await Promise.all(ids.map(id => deleteExpense(id)));
            setSelectedIds(new Set());
            await loadAll();
            onUpdate();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = allExpenses.filter(e =>
        e.store_name.toLowerCase().includes(search.toLowerCase()) ||
        (e.category_id && categories?.find((c: any) => c.id === e.category_id)?.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-2xl w-full max-w-7xl h-full md:h-[90vh] rounded-none md:rounded-[3rem] shadow-2xl border border-white/20 flex flex-col overflow-hidden relative">
                {/* Fixed Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 md:top-8 md:right-8 z-[110] p-2 md:p-3 bg-gray-50/80 backdrop-blur-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl md:rounded-2xl transition-all border border-gray-100 shadow-sm"
                >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                <div className="p-4 md:p-8 pr-16 md:pr-24 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 bg-white/50 relative z-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                            <Receipt className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
                            支出明細管理
                        </h2>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Transaction Management</p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowUnconfirmedOnly(!showUnconfirmedOnly)}
                                    className={cn(
                                        "px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black transition-all border",
                                        showUnconfirmedOnly ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-gray-200 text-gray-400 hover:text-gray-900"
                                    )}
                                >
                                    僅顯示待確認
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        <div className="flex items-center gap-2 bg-gray-50 p-2 px-4 rounded-2xl border-2 border-transparent focus-within:border-indigo-100 transition-all">
                            <Target className="w-4 h-4 text-gray-400" />
                            <select
                                value={filterGoalId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFilterGoalId(val);
                                    if (val && val !== 'general') {
                                        setStartDate("");
                                        setEndDate("");
                                    }
                                }}
                                className="bg-transparent text-[11px] font-black text-gray-900 outline-none w-32 uppercase cursor-pointer"
                            >
                                <option value="">所有專案</option>
                                <option value="general">🏠 日常支出</option>
                                {goals.map((g: any) => <option key={g.id} value={g.id}>🎯 {g.name}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 p-2 px-4 rounded-2xl border-2 border-transparent focus-within:border-indigo-100 transition-all">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-[11px] font-black text-gray-900 outline-none w-28 uppercase"
                                title="開始日期"
                            />
                            <span className="text-gray-300 font-black">→</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-[11px] font-black text-gray-900 outline-none w-28 uppercase"
                                title="結束日期"
                            />
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => { setStartDate(""); setEndDate(""); }}
                                    className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-900 transition-colors ml-1"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <PenLine className="w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="搜索商家或類別..."
                                className="pl-11 pr-6 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl text-[11px] font-black text-gray-900 w-48 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 pb-32">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="font-black text-sm uppercase tracking-widest">Loading...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 opacity-50">
                            <Receipt className="w-16 h-16" />
                            <p className="font-black text-lg uppercase tracking-widest">No matching records</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(item => (
                                <ExpenseItemCard
                                    key={item.id}
                                    item={item}
                                    categories={categories || []}
                                    goals={goals || []}
                                    onUpdate={() => { loadAll(); onUpdate(); }}
                                    isSelected={selectedIds.has(item.id)}
                                    onToggleSelection={() => toggleSelection(item.id)}
                                    isBatchMode={isBatchMode}
                                    onStageUpdate={(fields) => handleStageUpdate(item.id, fields)}
                                    stagedFields={stagedUpdates[item.id]}
                                    onDelete={async (id) => {
                                        if (confirm("確定要刪除此筆記錄嗎？")) {
                                            await deleteExpense(id);
                                            loadAll();
                                            onUpdate();
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-gray-100 bg-white flex items-center justify-between relative z-10">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total {filtered.length} Records {selectedIds.size > 0 && `| ${selectedIds.size} Selected`}
                    </div>
                </div>

                {isBatchMode && (
                    <BatchActionsBar
                        selectedCount={selectedIds.size}
                        onConfirm={handleBatchConfirm}
                        onDelete={handleBatchDelete}
                        onCancel={() => {
                            setIsBatchMode(false);
                            setSelectedIds(new Set());
                            setStagedUpdates({});
                        }}
                    />
                )}
            </div>
        </div>
    );
}
