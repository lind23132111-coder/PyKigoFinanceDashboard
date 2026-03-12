"use client";

import React, { useState, memo } from 'react';
import {
    CheckCircle,
    TrendingUp,
    TrendingDown,
    Info,
    X,
    History,
    PenLine,
    Trash2,
    ArrowRightLeft,
    Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Settlement Summary Card
 */
export const SettlementSummary = memo(function SettlementSummary({
    settlement,
    onOpenSettlement,
    onOpenHistory
}: {
    settlement: any,
    onOpenSettlement: () => void,
    onOpenHistory: () => void
}) {
    if (!settlement) return null;

    return (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-900/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full -ml-24 -mb-24 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>

            <div className="relative z-10 flex flex-col h-full space-y-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300">Live Settlement Status</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-1">
                                {settlement.net_balance === 0 ? '目前已結清' : (settlement.net_balance < 0 ? 'PY 待支付' : 'Kigo 待支付')}
                            </h3>
                            <div className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                ${settlement.abs_balance.toLocaleString()}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={onOpenHistory}
                                className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-2xl transition-all border border-slate-700/50 text-slate-400 hover:text-white group/hist"
                                title="查看歷史紀錄"
                            >
                                <History className="w-5 h-5 group-hover/hist:rotate-[-45deg] transition-transform" />
                            </button>
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-inner",
                                settlement.net_balance <= 0 ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            )}>
                                <Layers className="w-3.5 h-3.5" />
                                {settlement.balance_status}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                        <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest text-center sm:text-left">PY 墊付</div>
                        <div className="text-xl md:text-2xl font-black text-slate-100 text-center sm:text-left">${settlement.py_credit.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                        <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest text-center sm:text-left">Kigo 墊付</div>
                        <div className="text-xl md:text-2xl font-black text-slate-100 text-center sm:text-left">${settlement.py_debit.toLocaleString()}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        {settlement.summary}
                    </span>
                </div>

                <div className="mt-auto">
                    <button
                        onClick={onOpenSettlement}
                        disabled={settlement.abs_balance === 0}
                        className="w-full bg-white hover:bg-black hover:text-white text-slate-900 py-4.5 rounded-[1.5rem] font-black text-sm transition-all flex items-center justify-center gap-3 relative z-10 shadow-xl shadow-indigo-900/20 active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed group/btn"
                        style={{ height: '56px' }}
                    >
                        <CheckCircle className="w-5 h-5 text-indigo-600 transition-transform group-hover/btn:scale-110" />
                        執行結算作業
                    </button>
                </div>
            </div>
        </div>
    );
});

/**
 * Settlement History Modal
 */
export function SettlementHistoryModal({
    history,
    onClose,
    onDelete,
    onEdit
}: {
    history: any[],
    onClose: () => void,
    onDelete?: (id: string) => void,
    onEdit?: (item: any) => void
}) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <History className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-xl text-gray-900 tracking-tight">結算歷史紀錄</h3>
                            <p className="text-xs text-gray-500 font-medium">記錄過往的所有全額與部分結算</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-100 shadow-sm">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 no-scrollbar">
                    {history.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                <History className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-400 font-bold">尚無結算紀錄</p>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm",
                                        item.payer === 'PY' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                                    )}>
                                        {item.payer}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="font-bold text-gray-900 flex items-center gap-2">
                                            $ {item.amount.toLocaleString()}
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                                                Paid to {item.payee}
                                            </span>
                                        </div>
                                        <div className="text-xs font-semibold text-gray-400 mt-0.5">
                                            {item.settlement_date} • {item.notes || '無備註'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-2">
                                        <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">
                                            {item.project_label === 'all' ? '全專案' : item.project_label}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit?.(item)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
                                        >
                                            <PenLine className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete?.(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        關閉視窗
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Partial Settlement Modal
 */
export function PartialSettlementModal({
    settlement,
    activeTab,
    goals,
    onClose,
    onSubmit,
    isEditing
}: any) {
    const [amount, setAmount] = useState(isEditing ? (settlement.amount || 0) : (settlement.abs_balance || 0));
    const [notes, setNotes] = useState(settlement.notes || '');
    const [date, setDate] = useState(settlement.settlement_date || new Date().toISOString().split('T')[0]);

    const isPYPaying = isEditing
        ? settlement.payer === 'PY'
        : (settlement.net_balance || 0) < 0;
    const isKigoPaying = isEditing
        ? settlement.payer === 'Kigo'
        : (settlement.net_balance || 0) > 0;

    const currentAbsBalance = isEditing ? (settlement.amount || 0) : (settlement.abs_balance || 0);

    const handleSubmit = () => {
        if (amount <= 0 || (!isEditing && currentAbsBalance > 0 && amount > currentAbsBalance + 1)) {
            alert('金額必須大於 0');
            return;
        }

        const isGoalTab = activeTab !== 'all' && activeTab !== 'general';
        onSubmit({
            amount,
            settlement_date: date,
            payer: isPYPaying ? 'PY' : 'Kigo',
            payee: isPYPaying ? 'Kigo' : 'PY',
            project_label: isGoalTab ? 'all' : activeTab,
            goal_id: isGoalTab ? activeTab : null,
            notes: notes || (isEditing ? '' : (amount < currentAbsBalance ? '部份結算' : '全額結算'))
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <ArrowRightLeft className="w-7 h-7 text-white" />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                        {isEditing ? '編輯結算紀錄' : '執行分帳結算'}
                    </h3>
                    <p className="text-gray-500 font-medium">
                        {isEditing ? '修改過往的結算金額或備註' : '記錄雙方之間的代墊款項償還情況'}
                    </p>

                    <div className="mt-8 space-y-6">
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-sm border",
                                    isPYPaying ? "bg-blue-600 text-white border-blue-400" : "bg-emerald-600 text-white border-emerald-400"
                                )}>
                                    {isPYPaying ? 'PY' : 'Kigo'}
                                </div>
                                <div className="text-amber-800">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Payer</div>
                                    <div className="text-sm font-bold">
                                        {isEditing ? `結算金額 $${settlement.amount.toLocaleString()}` : `目前總欠款 $${(settlement.abs_balance || 0).toLocaleString()}`}
                                    </div>
                                </div>
                            </div>
                            <div className="h-6 w-px bg-amber-200"></div>
                            <div className="flex items-center gap-3">
                                <div className="text-right text-amber-800">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Payee</div>
                                    <div className="text-sm font-bold">{isPYPaying ? 'Kigo' : 'PY'}</div>
                                </div>
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-sm border",
                                    !isPYPaying ? "bg-blue-600 text-white border-blue-400" : "bg-emerald-600 text-white border-emerald-400"
                                )}>
                                    {!isPYPaying ? 'PY' : 'Kigo'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">結算金額</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400 text-xl">$</div>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-10 pr-6 font-black text-3xl text-gray-900 focus:border-indigo-500 transition-all outline-none"
                                />
                            </div>
                            {!isEditing && (
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => setAmount(settlement.abs_balance || 0)}
                                        className="text-[10px] font-black bg-white border border-gray-200 px-3 py-1 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                                    >
                                        全額結算
                                    </button>
                                    <button
                                        onClick={() => setAmount(Math.round((settlement.abs_balance || 0) / 2))}
                                        className="text-[10px] font-black bg-white border border-gray-200 px-3 py-1 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                                    >
                                        結算一半
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">結算日期</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-2 px-3 font-bold text-gray-900 text-sm focus:border-indigo-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">結算範圍</label>
                                <div className="bg-slate-100 rounded-xl py-2 px-3 text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <Layers className="w-3 h-3" /> {activeTab === 'all' ? '全帳本' : (activeTab === 'general' ? '日常家庭' : goals?.find((g: any) => g.id === activeTab)?.name)}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">備註</label>
                            <input
                                type="text"
                                placeholder="例如：由轉帳支付..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-2 px-4 font-bold text-gray-900 text-sm focus:border-indigo-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all border border-gray-100"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 border border-indigo-500"
                    >
                        確認結算
                    </button>
                </div>
            </div>
        </div>
    );
}
