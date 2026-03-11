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
    const [isLoading, setIsLoading] = useState(true);
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
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [stats, setStats] = useState<any>(null);
    const [showUnconfirmedOnly, setShowUnconfirmedOnly] = useState(false);

    // Batch Edit States
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [stagedUpdates, setStagedUpdates] = useState<Record<string, Partial<Expense>>>({});
    const [isBatchMode, setIsBatchMode] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const isGoalTab = activeTab !== 'all' && activeTab !== 'general';

            const [
                expensesData,
                unreviewedData,
                mergedRecentData,
                categoriesData,
                goalsData,
                settlementData,
                statsData
            ] = await Promise.all([
                getExpenses({
                    project_label: activeTab === 'all' ? undefined : (isGoalTab ? undefined : activeTab),
                    goal_id: isGoalTab ? activeTab : undefined,
                    is_reviewed: true,
                    startDate: isGoalTab ? undefined : (startDate || undefined),
                    endDate: isGoalTab ? undefined : (endDate || undefined)
                }),
                getExpenses({ is_reviewed: false, limit: 100 }),
                getExpenses({
                    project_label: activeTab === 'all' ? undefined : (isGoalTab ? undefined : activeTab),
                    goal_id: isGoalTab ? activeTab : undefined,
                    is_reviewed: showUnconfirmedOnly ? false : undefined, // Fetch both if not filtering
                    startDate: isGoalTab ? undefined : (startDate || undefined),
                    endDate: isGoalTab ? undefined : (endDate || undefined),
                    limit: 24,
                    sortBy: 'date',
                    sortOrder: 'descending'
                }),
                getCategories(),
                getGoals(),
                import("@/app/actions/expenses").then(m => m.getSettlementStatus()),
                import("@/app/actions/expenses").then(m => m.getExpenseStats(selectedMonth, activeTab === 'all' ? undefined : (isGoalTab ? undefined : activeTab)))
            ]);

            setExpenses(expensesData);
            setUnreviewed(unreviewedData);
            setRecentExpenses(mergedRecentData);
            setCategories(categoriesData);
            setGoals(goalsData);
            setSettlement(settlementData.current);
            setSettlementHistory(settlementData.history);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to load expenses:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, startDate, endDate, selectedMonth, showUnconfirmedOnly]);

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
        activeTab,
        setActiveTab,

        // Stats
        selectedMonth,
        setSelectedMonth,
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
