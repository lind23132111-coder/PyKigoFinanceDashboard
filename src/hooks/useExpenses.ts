"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    getExpenses,
    getCategories,
    batchConfirmExpenses,
    updateExpense,
    deleteExpense,
    createExpense,
    createExpenses,
    confirmExpensesBulk,
    processAIImport,
    deleteSettlement,
    createSettlement,
    updateSettlement
} from "@/app/actions/expenses";
import { getGoals } from "@/app/actions/goals";
import { Expense, ExpenseCategory, Settlement } from "@/types/expenses";

export function useExpenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [unreviewed, setUnreviewed] = useState<Expense[]>([]);
    const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [settlement, setSettlement] = useState<any>(null);
    const [settlementHistory, setSettlementHistory] = useState<Settlement[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showCategoryMgmt, setShowCategoryMgmt] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showPartialSettlementModal, setShowPartialSettlementModal] = useState(false);
    const [showAllExpensesModal, setShowAllExpensesModal] = useState(false);
    const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null);

    // Filter states
    const [filterMode, setFilterMode] = useState<'month' | 'quarter' | 'year'>('month');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1); // 1-4

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [stats, setStats] = useState<any>(null);
    const [showUnconfirmedOnly, setShowUnconfirmedOnly] = useState(false);

    // Batch Edit States
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [stagedUpdates, setStagedUpdates] = useState<Record<string, Partial<Expense>>>({});
    const [isBatchMode, setIsBatchMode] = useState(false);

    // Derived Date Ranges
    useEffect(() => {
        if (filterMode === 'month') {
            const [y, m] = selectedMonth.split('-').map(Number);
            const start = `${selectedMonth}-01`;
            const last = new Date(y, m, 0).getDate();
            const end = `${selectedMonth}-${String(last).padStart(2, '0')}`;
            setStartDate(start);
            setEndDate(end);
        } else if (filterMode === 'quarter') {
            const year = parseInt(selectedYear);
            const startMonth = (selectedQuarter - 1) * 3 + 1;
            const endMonth = selectedQuarter * 3;
            const start = `${year}-${String(startMonth).padStart(2, '0')}-01`;
            const lastDay = new Date(year, endMonth, 0).getDate();
            const end = `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            setStartDate(start);
            setEndDate(end);
        } else if (filterMode === 'year') {
            setStartDate(`${selectedYear}-01-01`);
            setEndDate(`${selectedYear}-12-31`);
        }
    }, [filterMode, selectedMonth, selectedYear, selectedQuarter]);

    // Hook logic to detect when to ignore standard filters (Project Tabs)
    const isProjectTab = activeTab !== 'all' && activeTab !== 'general';

    // Load static data once
    useEffect(() => {
        const loadInitialData = async () => {
            setIsInitialLoading(true);
            try {
                const [categoriesData, goalsData] = await Promise.all([
                    getCategories(),
                    getGoals()
                ]);
                setCategories(categoriesData);
                setGoals(goalsData);
            } catch (error) {
                console.error("Failed to load initial data:", error);
            } finally {
                setIsInitialLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const loadData = useCallback(async () => {
        if (!startDate || !endDate) return;
        setIsLoading(true);
        try {
            const [
                expensesData,
                unreviewedData,
                mergedRecentData,
                settlementData,
                statsData
            ] = await Promise.all([
                getExpenses({
                    project_label: activeTab === 'all' ? undefined : (isProjectTab ? undefined : activeTab),
                    goal_id: isProjectTab ? activeTab : undefined,
                    is_reviewed: true,
                    startDate: isProjectTab ? undefined : (startDate || undefined),
                    endDate: isProjectTab ? undefined : (endDate || undefined)
                }),
                getExpenses({ is_reviewed: false, limit: 100 }),
                getExpenses({
                    project_label: activeTab === 'all' ? undefined : (isProjectTab ? undefined : activeTab),
                    goal_id: isProjectTab ? activeTab : undefined,
                    is_reviewed: showUnconfirmedOnly ? false : undefined,
                    startDate: isProjectTab ? undefined : (startDate || undefined),
                    endDate: isProjectTab ? undefined : (endDate || undefined),
                    limit: 24,
                    sortBy: 'date',
                    sortOrder: 'descending'
                }),
                import("@/app/actions/expenses").then(m => m.getSettlementStatus(
                    activeTab === 'all' ? undefined : (isProjectTab ? undefined : activeTab),
                    isProjectTab ? activeTab : undefined
                )),
                import("@/app/actions/expenses").then(m => m.getExpenseStats(
                    startDate,
                    endDate,
                    activeTab === 'all' ? undefined : (isProjectTab ? undefined : activeTab),
                    filterMode
                ))
            ]);

            setExpenses(expensesData);
            setUnreviewed(unreviewedData);
            setRecentExpenses(mergedRecentData);
            setSettlement(settlementData.current);
            setSettlementHistory(settlementData.history);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to load expenses:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, startDate, endDate, showUnconfirmedOnly, filterMode, isProjectTab]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleConfirm = useCallback(async (id: string, updates: Partial<Expense>) => {
        try {
            await updateExpense(id, { ...updates, is_reviewed: true });
            await loadData();
        } catch (error) {
            console.error("Failed to confirm expense:", error);
            await loadData();
        }
    }, [loadData]);

    const handleBatchConfirmChanges = useCallback(async () => {
        if (selectedIds.size === 0) return;

        const itemsToConfirm = Array.from(selectedIds).map(id => ({
            id,
            updates: {
                ...(stagedUpdates[id] || {}),
                is_reviewed: true
            }
        }));

        try {
            setIsLoading(true);
            await confirmExpensesBulk(itemsToConfirm);
            setSelectedIds(new Set());
            setStagedUpdates({});
            setIsBatchMode(false);
            await loadData();
        } catch (error) {
            console.error("Batch confirm failed:", error);
            await loadData();
        } finally {
            setIsLoading(false);
        }
    }, [selectedIds, stagedUpdates, loadData]);

    const handleStageUpdate = useCallback((id: string, updates: Partial<Expense>) => {
        setStagedUpdates(prev => ({
            ...prev,
            [id]: { ...(prev[id] || {}), ...updates }
        }));
    }, []);

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (selectedIds.size === recentExpenses.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(recentExpenses.map(e => e.id)));
        }
    }, [recentExpenses, selectedIds]);

    const handleBatchConfirm = useCallback(async (items: { id: string, updates: any }[]) => {
        if (items.length === 0) return;
        try {
            await confirmExpensesBulk(items);
            await loadData();
        } catch (error) {
            console.error("Failed to batch confirm:", error);
            await loadData();
        }
    }, [loadData]);

    const handleDeleteExpense = useCallback(async (id: string) => {
        if (!confirm("確定要刪除此筆記錄嗎？")) return;
        try {
            await deleteExpense(id);
            await loadData();
        } catch (error) {
            console.error(error);
        }
    }, [loadData]);

    const handleDeleteBulk = useCallback(async (ids?: string[]) => {
        const targetIds = ids || Array.from(selectedIds);
        if (targetIds.length === 0) return;
        if (!confirm(`確定要刪除選取的 ${targetIds.length} 筆記錄嗎？`)) return;
        try {
            setIsLoading(true);
            await Promise.all(targetIds.map(id => deleteExpense(id)));
            setSelectedIds(new Set());
            await loadData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [loadData, selectedIds]);

    const handleCreateExpense = useCallback(async (payload: any) => {
        try {
            await createExpense({ ...payload, is_reviewed: true });
            await loadData();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [loadData]);

    const handleCreateExpenses = useCallback(async (payloads: any[]) => {
        try {
            await createExpenses(payloads);
            await loadData();
        } catch (error) {
            console.error(error);
        }
    }, [loadData]);

    const handleProcessAIImport = useCallback(async (content: string, type: any, onPhase?: (phase: 'analyzing' | 'saving' | 'loading') => void) => {
        try {
            onPhase?.('analyzing');
            const parsed = await processAIImport(content, type);
            if (parsed.length === 0) {
                alert("AI 未能識別任何支出項目，請確認內容格式。");
                return;
            }

            const entries = parsed.map((item: any) => ({
                ...item,
                is_reviewed: false,
                is_automated: true,
                project_label: 'general',
                paid_by: 'PY',
                paid_for: 'Both',
                currency: 'TWD'
            }));

            onPhase?.('saving');
            await createExpenses(entries);
            onPhase?.('loading');
            await loadData();
        } catch (error: any) {
            console.error("AI Import Error:", error);
            const msg = error?.message || "";
            if (msg.includes("429") || msg.includes("quota")) {
                throw new Error("AI 服務額度已達上限或過於繁忙，目前無法解析。請稍候一分鐘再試，或是手動貼入較短的內容。");
            }
            throw new Error(msg || "AI 解析過程發生未知錯誤，請確認內容格式是否正確。");
        }
    }, [loadData]);

    const handleDeleteSettlement = useCallback(async (id: string) => {
        if (!confirm("確定要刪除此筆結算紀錄嗎？")) return;
        try {
            await deleteSettlement(id);
            await loadData();
        } catch (error) {
            console.error(error);
        }
    }, [loadData]);

    const handleSaveSettlement = useCallback(async (data: any) => {
        try {
            if (editingSettlement) {
                await updateSettlement(editingSettlement.id, data);
            } else {
                await createSettlement(data);
            }
            setEditingSettlement(null);
            await loadData();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [editingSettlement, loadData]);

    return {
        expenses,
        unreviewed,
        recentExpenses,
        categories,
        goals,
        settlement,
        settlementHistory,
        isLoading,
        isInitialLoading,
        activeTab,
        setActiveTab,

        // Stats
        filterMode, setFilterMode,
        selectedMonth, setSelectedMonth,
        selectedYear, setSelectedYear,
        selectedQuarter, setSelectedQuarter,
        stats,

        // Unified List & Batch Actions
        showUnconfirmedOnly, setShowUnconfirmedOnly,
        selectedIds, setSelectedIds, toggleSelection, toggleSelectAll,
        stagedUpdates, setStagedUpdates, handleStageUpdate,
        isBatchMode, setIsBatchMode,
        handleBatchConfirmChanges,

        // Modal states
        showModal, setShowModal,
        showImportModal, setShowImportModal,
        showCategoryMgmt, setShowCategoryMgmt,
        showHistoryModal, setShowHistoryModal,
        showPartialSettlementModal, setShowPartialSettlementModal,
        showAllExpensesModal, setShowAllExpensesModal,
        editingSettlement, setEditingSettlement,

        // Filters
        startDate, setStartDate,
        endDate, setEndDate,

        // Handlers
        loadData,
        handleConfirm,
        handleBatchConfirm,
        handleDeleteExpense,
        handleCreateExpense,
        handleCreateExpenses,
        handleProcessAIImport,
        handleDeleteSettlement,
        handleDeleteBulk,
        handleSaveSettlement
    };
}
