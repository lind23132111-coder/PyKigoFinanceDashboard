"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
    X,
    Check,
    Zap,
    Plus,
    Trash2,
    PenLine,
    Combine,
    Settings2,
    Sparkles,
    Calendar,
    Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Expense, ExpenseCategory } from "@/types/expenses";
import {
    getExpenses,
    createCategory,
    updateCategory,
    deleteCategory,
    mergeCategories,
    updateExpense,
    deleteExpense
} from "@/app/actions/expenses";

import { StatCard } from "./StatCard";
import { ExpenseItemCard } from "./ExpenseGroups";
import { SettlementHistoryModal, PartialSettlementModal } from "./SettlementSummary";

/**
 * Category Management Modal
 */
export function CategoryManagementModal({
    categories,
    onClose,
    onUpdate
}: {
    categories: ExpenseCategory[],
    onClose: () => void,
    onUpdate: (newId?: string) => Promise<void>
}) {
    const [selectedSource, setSelectedSource] = useState('');
    const [selectedTarget, setSelectedTarget] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newName, setNewName] = useState('');

    const generateStyle = () => {
        const colors = [
            '#f59e0b', '#3b82f6', '#f43f5e', '#6366f1', '#8b5cf6',
            '#10b981', '#f97316', '#06b6d4', '#ec4899', '#84cc16'
        ];
        const usedColors = categories.map((c: any) => c.color.toLowerCase());
        const availableColors = colors.filter(c => !usedColors.includes(c.toLowerCase()));
        const palette = availableColors.length > 0 ? availableColors : colors;
        const icons = ['tag', 'shopping-cart', 'utensils', 'coffee', 'gift', 'star'];

        return {
            color: palette[Math.floor(Math.random() * palette.length)],
            icon: icons[Math.floor(Math.random() * icons.length)]
        };
    };

    const handleAdd = async () => {
        if (!newName) return;
        setIsProcessing(true);
        try {
            const style = generateStyle();
            const newCat = await createCategory(newName, style.icon, style.color);
            await onUpdate(newCat.id);
            setIsAddingMode(false);
            setNewName('');
        } catch (error) {
            alert("新增失敗，名稱可能重複");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRename = async () => {
        if (!editingId || !editName) return;
        setIsProcessing(true);
        try {
            await updateCategory(editingId, { name: editName });
            await onUpdate();
            setEditingId(null);
            setEditName('');
        } catch (error) {
            alert("更名失敗");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("確定要刪除此類別嗎？相關支出將變更為『未分類』。")) return;
        setIsProcessing(true);
        try {
            await deleteCategory(id);
            await onUpdate();
        } catch (error) {
            alert("刪除失敗");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMerge = async () => {
        if (!selectedSource || !selectedTarget) return;
        if (selectedSource === selectedTarget) {
            alert("不能合併同一個類別");
            return;
        }
        if (!confirm("確定要合併嗎？來源類別的所有支出將永久轉移。")) return;
        setIsProcessing(true);
        try {
            await mergeCategories(selectedSource, selectedTarget);
            await onUpdate();
            setSelectedSource('');
            setSelectedTarget('');
        } catch (error) {
            alert("合併失敗");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/20 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 flex flex-col scale-in duration-200 overflow-hidden max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-indigo-500" />
                        類別管理工具
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
                        {isAddingMode ? (
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1">新增自訂類別</label>
                                <div className="flex gap-2">
                                    <input
                                        autoFocus
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="輸入名稱 (如: 寵物開銷)"
                                        className="flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-2 text-sm font-bold text-indigo-900 outline-none"
                                    />
                                    <button
                                        onClick={handleAdd}
                                        disabled={isProcessing || !newName}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                                    >確認</button>
                                    <button onClick={() => setIsAddingMode(false)} className="text-gray-400 font-bold px-2">X</button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingMode(true)}
                                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-500 font-bold hover:bg-indigo-100/50 transition-all text-sm"
                            >
                                <Plus className="w-4 h-4" /> 新增一個類別
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">目前所有類別</label>
                        <div className="space-y-2">
                            {categories.map((c: any) => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:border-indigo-200 hover:bg-white transition-all">
                                    {editingId === c.id ? (
                                        <div className="flex items-center gap-2 flex-grow">
                                            <input
                                                autoFocus
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold outline-none ring-2 ring-indigo-500/20"
                                            />
                                            <button onClick={handleRename} className="text-indigo-600 font-bold text-xs px-2">儲存</button>
                                            <button onClick={() => setEditingId(null)} className="text-gray-400 font-bold text-xs">取消</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: c.color }}></div>
                                                <span className="text-sm font-extrabold text-gray-700">{c.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setEditingId(c.id); setEditName(c.name); }}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                >
                                                    <PenLine className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 ml-1">
                            <Combine className="w-3 h-3 text-indigo-500" /> 類別合併與內容移轉
                        </label>
                        <div className="grid grid-cols-1 gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                            <div className="space-y-1">
                                <span className="text-[10px] text-gray-500 font-bold ml-1 uppercase">移轉來源</span>
                                <select
                                    value={selectedSource}
                                    onChange={(e) => setSelectedSource(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">選擇要被合併的類別...</option>
                                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-gray-500 font-bold ml-1 uppercase">整合至目標</span>
                                <select
                                    value={selectedTarget}
                                    onChange={(e) => setSelectedTarget(e.target.value)}
                                    className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-xs font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">選擇支出的新歸屬...</option>
                                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={handleMerge}
                                disabled={!selectedSource || !selectedTarget || isProcessing}
                                className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 mt-2"
                            >
                                {isProcessing ? "執行中..." : "確認執行類別大洗牌"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Expense Entry Modal
 */
export function ExpenseEntryModal({ onClose, categories, goals, onSubmit, onSubmitCategory }: any) {
    const [showCategoryMgmt, setShowCategoryMgmt] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [payload, setPayload] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        store_name: '',
        project_label: 'general',
        goal_id: '',
        category_id: '',
        paid_by: 'PY',
        paid_for: 'Both'
    });

    const handleFormSubmit = async () => {
        if (!payload.amount || !payload.store_name) {
            alert("請填寫金額與項目名稱");
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit({
                ...payload,
                amount: Number(payload.amount),
                project_label: payload.goal_id ? 'goal' : 'general'
            });
        } catch (error: any) {
            alert(`儲存失敗: ${error?.message || "未知錯誤"}`);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-in duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                            <PenLine className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">手動記帳 / 新增歷史紀錄</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">日期</label>
                            <input
                                type="date"
                                value={payload.date}
                                onChange={(e) => setPayload({ ...payload, date: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">金額 (NT$)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={payload.amount}
                                onChange={(e) => setPayload({ ...payload, amount: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">店家 / 支出項目</label>
                            <input
                                type="text"
                                placeholder="例如：保母費、系統櫃尾款..."
                                value={payload.store_name}
                                onChange={(e) => setPayload({ ...payload, store_name: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">歸屬目標</label>
                            <select
                                value={payload.goal_id}
                                onChange={(e) => setPayload({ ...payload, goal_id: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                            >
                                <option value="">無 (日常家庭)</option>
                                {goals.map((g: any) => <option key={g.id} value={g.id}>🎯 {g.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">類別</label>
                                <button
                                    onClick={() => setShowCategoryMgmt(true)}
                                    className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                                >
                                    <Settings2 className="w-3 h-3" /> 各類別管理
                                </button>
                            </div>
                            <select
                                value={payload.category_id}
                                onChange={(e) => setPayload({ ...payload, category_id: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                            >
                                <option value="">請選擇...</option>
                                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        {showCategoryMgmt && (
                            <CategoryManagementModal
                                categories={categories}
                                onClose={() => setShowCategoryMgmt(false)}
                                onUpdate={async (newId?: string) => {
                                    if (onSubmitCategory) await onSubmitCategory({} as any);
                                    if (newId) setPayload(p => ({ ...p, category_id: newId }));
                                }}
                            />
                        )}
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">支付人 (Paid By)</label>
                            <select
                                value={payload.paid_by}
                                onChange={(e) => setPayload({ ...payload, paid_by: e.target.value })}
                                className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-700 outline-none cursor-pointer"
                            >
                                <option>PY</option>
                                <option>Kigo</option>
                                <option>Both</option>
                            </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">為波及？ (Paid For)</label>
                            <select
                                value={payload.paid_for}
                                onChange={(e) => setPayload({ ...payload, paid_for: e.target.value })}
                                className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-700 outline-none cursor-pointer"
                            >
                                <option>Both</option>
                                <option>PY</option>
                                <option>Kigo</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-50">取消</button>
                    <button
                        onClick={handleFormSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Zap className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {isSubmitting ? "儲存中..." : "儲存紀錄"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Import Data Modal
 */
export function ImportDataModal({
    onClose,
    onSubmit
}: {
    onClose: () => void,
    onSubmit: (content: string, type: 'text' | 'csv' | 'carrier', onPhase: (phase: any) => void) => Promise<void>
}) {
    const [content, setContent] = useState("");
    const [type, setType] = useState<'text' | 'csv' | 'carrier'>('text');
    const [isLoading, setIsLoading] = useState(false);
    const [phase, setPhase] = useState<'analyzing' | 'saving' | 'loading' | 'idle'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setContent(text);
            if (file.name.endsWith('.csv')) setType('csv');
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        setIsLoading(true);
        try {
            await onSubmit(content, type, (p) => setPhase(p));
        } catch (err: any) {
            console.error(err);
            alert(`匯入失敗: ${err?.message || "可能是 AI 服務暫時繁忙或連線中斷，請稍後再試。"}`);
        } finally {
            setIsLoading(false);
            setPhase('idle');
        }
    };

    const getPhaseText = () => {
        switch (phase) {
            case 'analyzing': return "AI 正在分析並解析資料...";
            case 'saving': return "解析完成！正在寫入資料庫...";
            case 'loading': return "寫入成功，正在同步儀表板...";
            default: return "開始 AI 智慧解析";
        }
    };

    const getPhaseIcon = () => {
        if (!isLoading) return <Sparkles className="w-4 h-4" />;
        if (phase === 'analyzing') return <Zap className="w-4 h-4 animate-spin text-amber-300" />;
        if (phase === 'saving') return <Check className="w-4 h-4 text-emerald-300" />;
        return <Zap className="w-4 h-4 animate-pulse opacity-50" />;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col animate-in zoom-in duration-300">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-black text-2xl text-gray-900 tracking-tight">AI 智慧匯入</h3>
                            <p className="text-xs text-amber-700 font-bold uppercase tracking-widest mt-0.5">Import & AI Parsing</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-white rounded-full transition-all border border-transparent hover:border-amber-100 text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex gap-2">
                        {(['text', 'csv', 'carrier'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={cn(
                                    "flex-1 py-2.5 rounded-xl text-xs font-black transition-all border-2",
                                    type === t ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200" : "bg-gray-50 border-gray-100 text-gray-400 hover:border-amber-200"
                                )}
                            >
                                {t === 'text' ? '純文字 / 內容' : t === 'csv' ? 'CSV 內容' : '電子載具內容'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={isLoading}
                            placeholder={type === 'text' ? "貼上銀行簡訊、記帳內容、或是手機載具複製出來的文字..." : "貼上 CSV 或 原始資料內容..."}
                            className="w-full h-48 bg-gray-50 border-2 border-gray-100 rounded-[24px] p-6 text-sm font-medium focus:border-amber-400 transition-all outline-none resize-none disabled:opacity-50"
                        />

                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept=".csv,.txt"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    className="text-[10px] font-black text-gray-400 hover:text-amber-600 uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-20"
                                >
                                    <Plus className="w-4 h-4" /> 或是上傳檔案
                                </button>
                            </div>
                            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                {content.length} characters
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all disabled:opacity-50"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!content || isLoading}
                        className={cn(
                            "flex-[2] py-4 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70",
                            isLoading ? "bg-slate-900 text-white shadow-slate-200" : "bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600 border border-amber-400"
                        )}
                    >
                        {getPhaseIcon()}
                        <span className={cn(isLoading && "animate-pulse")}>
                            {getPhaseText()}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * All Expenses Modal with filtering
 */

/**
 * Combined Expense Modals Container
 */
export function ExpenseModals({
    showModal, setShowModal,
    showImportModal, setShowImportModal,
    showCategoryMgmt, setShowCategoryMgmt,
    showHistoryModal, setShowHistoryModal,
    showPartialSettlementModal, setShowPartialSettlementModal,
    showAllExpensesModal, setShowAllExpensesModal,
    categories, goals, settlement, settlementHistory, editingSettlement, setEditingSettlement,
    activeTab, startDate, endDate, onUpdate,
    handleCreateExpense, handleCreateExpenses, handleProcessAIImport,
    handleDeleteSettlement, handleSaveSettlement
}: any) {
    return (
        <>
            {showModal && (
                <ExpenseEntryModal
                    onClose={() => setShowModal(false)}
                    categories={categories}
                    goals={goals}
                    onSubmit={async (payload: any) => {
                        await handleCreateExpense(payload);
                        setShowModal(false);
                    }}
                    onSubmitCategory={onUpdate}
                />
            )}

            {showImportModal && (
                <ImportDataModal
                    onClose={() => setShowImportModal(false)}
                    onSubmit={async (content: string, type: any, onPhase: any) => {
                        await handleProcessAIImport(content, type, onPhase);
                        setShowImportModal(false);
                    }}
                />
            )}

            {showCategoryMgmt && (
                <CategoryManagementModal
                    categories={categories}
                    onClose={() => setShowCategoryMgmt(false)}
                    onUpdate={onUpdate}
                />
            )}

            {showHistoryModal && (
                <SettlementHistoryModal
                    history={settlementHistory}
                    onClose={() => setShowHistoryModal(false)}
                    onDelete={handleDeleteSettlement}
                    onEdit={(item) => {
                        setEditingSettlement(item);
                        setShowPartialSettlementModal(true);
                    }}
                />
            )}

            {showPartialSettlementModal && (
                <PartialSettlementModal
                    settlement={editingSettlement || settlement}
                    activeTab={activeTab}
                    goals={goals}
                    onClose={() => {
                        setShowPartialSettlementModal(false);
                        setEditingSettlement(null);
                    }}
                    onSubmit={handleSaveSettlement}
                    isEditing={!!editingSettlement}
                />
            )}
        </>
    );
}

