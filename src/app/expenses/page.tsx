"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { 
    Layers, 
    Home, 
    Sofa, 
    PlaneTakeoff, 
    ChevronLeft, 
    ChevronRight, 
    PenLine, 
    AlertCircle, 
    Check, 
    Sparkles, 
    Receipt,
    MousePointerClick,
    TrendingDown, 
    TrendingUp,
    Zap, 
    Wallet, 
    History, 
    CheckCircle, 
    ArrowRightLeft,
    Hammer,
    Plus,
    X,
    Users,
    Calendar,
    Settings2,
    Trash2,
    Combine,
    Palmtree,
    Car,
    GraduationCap,
    Heart,
    Smartphone,
    Laptop,
    Gift,
    Umbrella,
    Upload,
    AlertTriangle
} from "lucide-react";
import { 
    getExpenses, 
    getCategories, 
    getSplitSettlement,
    updateExpense,
    createExpense,
    createExpenses,
    createCategory,
    updateCategory,
    deleteCategory,
    mergeCategories,
    getSettlementHistory,
    createSettlement,
    updateSettlement,
    deleteSettlement,
    getExpensesSummary,
    processAIImport,
    deleteExpense,
    deleteExpenses,
    confirmExpenses
} from "@/app/actions/expenses";
import { getGoalsWithProgress } from "@/app/actions/goals";
import { Expense, ExpenseCategory, Settlement } from "@/types/expenses";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

export default function ExpensesPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
    const [unreviewed, setUnreviewed] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [settlement, setSettlement] = useState<any>(null);
    const [goals, setGoals] = useState<any[]>([]);
    const [settlementHistory, setSettlementHistory] = useState<Settlement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showPartialSettlementModal, setShowPartialSettlementModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null);
    const [expensesStats, setExpensesStats] = useState({ count: 0, automatedCount: 0 });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showInbox, setShowInbox] = useState(false);
    const [showCategoryMgmt, setShowCategoryMgmt] = useState(false);
    const [showAllExpensesModal, setShowAllExpensesModal] = useState(false);
    const [batchSettings, setBatchSettings] = useState({ paid_by: 'PY', paid_for: 'Both' });
    const [prevMonthTotal, setPrevMonthTotal] = useState(0);

    // Date Range State
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    });

    useEffect(() => {
        loadData();
    }, [activeTab, startDate, endDate]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const isGoalTab = activeTab !== 'all' && activeTab !== 'general';
            
            // For comparison, we calculate the previous period of the same length
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            const prevEnd = new Date(start.getTime() - 86400000);
            const prevStart = new Date(prevEnd.getTime() - (diffDays - 1) * 86400000);
            
            const [summaryData, unrevExp, catData, setlData, goalData, prevSummary, historyData, recentExp] = await Promise.all([
                getExpensesSummary({ 
                    project_label: activeTab === 'all' ? undefined : (isGoalTab ? undefined : activeTab),
                    goal_id: isGoalTab ? activeTab : undefined,
                    startDate,
                    endDate
                }),
                getExpenses({ is_reviewed: false }),
                getCategories(),
                getSplitSettlement(
                    activeTab === 'all' ? undefined : (isGoalTab ? undefined : activeTab),
                    isGoalTab ? activeTab : undefined,
                    startDate,
                    endDate
                ),
                getGoalsWithProgress(),
                getExpensesSummary({
                    project_label: activeTab === 'all' ? undefined : (isGoalTab ? undefined : activeTab),
                    goal_id: isGoalTab ? activeTab : undefined,
                    startDate: prevStart.toISOString().split('T')[0],
                    endDate: prevEnd.toISOString().split('T')[0]
                }),
                getSettlementHistory(
                    activeTab === 'all' ? undefined : (isGoalTab ? undefined : activeTab),
                    isGoalTab ? activeTab : undefined
                ),
                getExpenses({ 
                    project_label: activeTab === 'all' ? undefined : (isGoalTab ? undefined : activeTab),
                    goal_id: isGoalTab ? activeTab : undefined,
                    is_reviewed: true,
                    sortBy: 'updated_at',
                    sortOrder: 'descending',
                    limit: 12
                })
            ]);
            
            // Reconstruct a lightweight expenses list for compatibility with existing chart logic
            // Since chartData (lines 185+) filters categories from 'expenses', we provide a summary-based mock
            const syntheticExpenses = Object.entries(summaryData.categoryBreakdown).map(([catId, amt]) => ({
                amount: amt,
                category_id: catId,
                is_reviewed: true
            })) as any[];
            
            setExpenses(syntheticExpenses);
            setRecentExpenses(recentExp);
            setUnreviewed(unrevExp);
            setCategories(catData);
            setSettlement(setlData);
            setGoals(goalData);
            setPrevMonthTotal(prevSummary.total);
            setSettlementHistory(historyData);
            setExpensesStats({ 
                count: summaryData.count || 0, 
                automatedCount: summaryData.automatedCount || 0 
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async (id: string, updates: Partial<Expense>) => {
        try {
            await updateExpense(id, { ...updates, is_reviewed: true });
            await loadData();
        } catch (error) {
            console.error("Failed to confirm expense:", error);
        }
    };

    // Calculate chart data from expenses
    const chartData = categories.map(cat => {
        const catExpenses = expenses.filter(e => e.category_id === cat.id);
        const total = catExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        return {
            name: cat.name,
            value: total,
            color: cat.color
        };
    }).filter(d => d.value > 0);

    const totalExpense = chartData.reduce((sum, e) => sum + e.value, 0);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8 text-gray-800 selection:bg-blue-100 font-sans">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
                
                {/* Header & Tabs */}
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <Layers className="w-4 h-4 text-white" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">支出與結算中心</h1>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">智慧對帳、多帳本管理與自動分帳結算模組。</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <button 
                                onClick={() => setShowImportModal(true)}
                                className="flex-1 md:flex-none group flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm active:scale-95"
                            >
                                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                                <span>AI 匯入 / 載具</span>
                            </button>
                            <button 
                                onClick={() => setShowModal(true)}
                                className="flex-1 md:flex-none group flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 px-5 py-3 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Plus className="w-4 h-4 text-indigo-200 group-hover:text-white" />
                                <span>手動記帳</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-3xl p-2 flex flex-col lg:flex-row items-stretch lg:items-center gap-2 shadow-sm">
                        <div className="flex-1 flex overflow-x-auto no-scrollbar p-1 gap-1">
                            <button 
                                onClick={() => setActiveTab('all')}
                                className={cn(
                                    "whitespace-nowrap px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2",
                                    activeTab === 'all' 
                                        ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50" 
                                        : "text-gray-500 hover:bg-white/50"
                                )}
                            >
                                <Home className="w-4 h-4" /> 總覽全體
                            </button>
                            <button 
                                onClick={() => setActiveTab('general')}
                                className={cn(
                                    "whitespace-nowrap px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2",
                                    activeTab === 'general' 
                                        ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50" 
                                        : "text-gray-500 hover:bg-white/50"
                                )}
                            >
                                <Users className="w-4 h-4" /> 日常家庭
                            </button>
                            {goals.map(goal => (
                                <button 
                                    key={goal.id}
                                    onClick={() => setActiveTab(goal.id)}
                                    className={cn(
                                        "whitespace-nowrap px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2",
                                        activeTab === goal.id 
                                            ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50" 
                                            : "text-gray-500 hover:bg-white/50"
                                    )}
                                >
                                    {getGoalIcon(goal.name)} {goal.name}
                                </button>
                            ))}
                        </div>
                        
                        <div className="h-px lg:h-8 lg:w-px bg-gray-200/60 mx-2"></div>
                        
                        <div className="flex items-center gap-2 p-1">
                            <div className="flex items-center bg-gray-100/50 rounded-2xl px-3 py-1.5 border border-gray-200/30">
                                <Calendar className="w-3.5 h-3.5 text-gray-400 mr-2" />
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none w-[110px]"
                                />
                                <span className="mx-2 text-gray-300">→</span>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none w-[110px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <StatCard 
                        icon={<Home className="w-5 h-5" />} 
                        label={activeTab === 'all' ? "選定期間總支出" : "當前分頁區間支出"} 
                        value={`NT$ ${totalExpense.toLocaleString()}`} 
                        change={(() => {
                            if (prevMonthTotal === 0) return undefined;
                            const diff = totalExpense - prevMonthTotal;
                            const percent = Math.round((diff / prevMonthTotal) * 100);
                            return `${Math.abs(percent)}% ${percent >= 0 ? '較前期增加' : '較前期減少'}`;
                        })()}
                        color="blue"
                    />

                    {/* Automation Card (Always show in broad views) */}
                    {(activeTab === 'all' || activeTab === 'general') && (
                        <StatCard 
                            icon={<Zap className="w-5 h-5" />} 
                            label="記帳自動化比例" 
                            value={(() => {
                                const total = expensesStats.count + unreviewed.length;
                                if (total === 0) return "100%";
                                const automated = expensesStats.automatedCount + unreviewed.filter(e => e.is_automated).length;
                                return `${Math.round((automated / total) * 100)}%`;
                            })()} 
                            progress={(() => {
                                const total = expensesStats.count + unreviewed.length;
                                if (total === 0) return 100;
                                const automated = expensesStats.automatedCount + unreviewed.filter(e => e.is_automated).length;
                                return Math.round((automated / total) * 100);
                            })()}
                            color="amber"
                        />
                    )}
                    
                    {activeTab === 'all' ? (
                        goals.map(goal => (
                            <StatCard 
                                key={goal.id}
                                icon={getGoalIcon(goal.name)} 
                                label={`${goal.name}累計總額`} 
                                value={`NT$ ${(goal.meta?.spent_balance || 0).toLocaleString()}`} 
                                subtext={`預預算 ${Math.round(goal.target_amount / 10000)} 萬 (實質消耗 ${Math.round((goal.meta?.spent_balance / goal.target_amount) * 100) || 0}%)`}
                                color={getGoalColor(goal.name)}
                                project
                            />
                        ))
                    ) : (
                        (() => {
                            const activeGoal = goals.find(g => g.id === activeTab);
                            if (!activeGoal) return null;
                            return (
                                <StatCard 
                                    icon={getGoalIcon(activeGoal.name)} 
                                    label={`${activeGoal.name}累計總額`} 
                                    value={`NT$ ${(activeGoal.meta?.spent_balance || 0).toLocaleString()}`} 
                                    subtext={`預算 ${Math.round(activeGoal.target_amount / 10000)} 萬 (實質消耗 ${Math.round((activeGoal.meta?.spent_balance / activeGoal.target_amount) * 100) || 0}%)`}
                                    color={getGoalColor(activeGoal.name)}
                                    project
                                />
                            );
                        })()
                    )}
                </div>

                {/* Charts & Settlement */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col">
                        <h3 className="font-extrabold text-xl text-gray-900 tracking-tight mb-6">支出結構分析</h3>
                        <div className="flex flex-col md:flex-row items-center gap-8 flex-grow">
                            <div className="w-48 h-48 relative flex-shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 font-bold text-sm">
                                                            {payload[0]?.name}: NT$ {Number(payload[0]?.value).toLocaleString()}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                                    <span className="text-lg font-extrabold text-gray-900">{(totalExpense / 1000).toFixed(1)}K</span>
                                </div>
                            </div>
                            
                            <div className="w-full space-y-4">
                                {chartData.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <span className="font-bold text-gray-800">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-extrabold text-gray-900">${item.value.toLocaleString()}</span>
                                            <span className="text-xs font-bold text-gray-400 w-8 text-right">{Math.round((item.value / totalExpense) * 100)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <SettlementCard 
                        settlement={settlement} 
                        onOpenHistory={() => setShowHistoryModal(true)}
                        onOpenSettlement={() => setShowPartialSettlementModal(true)}
                    />
                </div>

                {/* AI Inbox */}
                {unreviewed.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200/60 rounded-[2.5rem] overflow-hidden shadow-sm backdrop-blur-xl transition-all duration-500">
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-amber-800">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox"
                                        checked={unreviewed.length > 0 && selectedIds.size === unreviewed.length}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds(new Set(unreviewed.map(u => u.id)));
                                            else setSelectedIds(new Set());
                                        }}
                                        className="w-5 h-5 rounded-lg border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer transition-all"
                                    />
                                    <div className="p-1.5 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                    </div>
                                </label>
                                <h3 className="text-lg tracking-tight font-black px-1 flex items-center gap-2">
                                    {selectedIds.size > 0 ? `已選取 ${selectedIds.size} 筆` : `待核對支出 (${unreviewed.length})`}
                                    <span className="text-[10px] bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Action Required</span>
                                </h3>
                                
                                <div className="ml-auto flex items-center gap-2">
                                    <button 
                                        onClick={() => setShowCategoryMgmt(true)}
                                        className="p-2.5 bg-white/60 hover:bg-white text-indigo-500 hover:text-indigo-700 rounded-xl border border-indigo-100 shadow-sm transition-all"
                                        title="管理支出類別"
                                    >
                                        <Settings2 className="w-4 h-4" />
                                    </button>
                                    
                                    {showInbox && !selectedIds.size && (
                                        <div className="flex items-center gap-2 bg-white/40 border border-amber-200/50 rounded-xl px-3 py-1.5 ml-2">
                                            <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest mr-2">Batch Defaults</span>
                                            <select 
                                                value={batchSettings.paid_by}
                                                onChange={(e) => setBatchSettings({...batchSettings, paid_by: e.target.value})}
                                                className="bg-transparent text-[10px] font-black text-emerald-600 outline-none cursor-pointer"
                                            >
                                                <option value="PY">PY</option>
                                                <option value="Kigo">Kigo</option>
                                                <option value="Both">BOTH</option>
                                            </select>
                                            <div className="w-px h-3 bg-amber-200 mx-1"></div>
                                            <select 
                                                value={batchSettings.paid_for}
                                                onChange={(e) => setBatchSettings({...batchSettings, paid_for: e.target.value})}
                                                className="bg-transparent text-[10px] font-black text-slate-500 outline-none cursor-pointer uppercase"
                                            >
                                                <option value="Both">BOTH</option>
                                                <option value="PY">PY</option>
                                                <option value="Kigo">Kigo</option>
                                            </select>
                                        </div>
                                    )}
                                    {selectedIds.size > 0 ? (
                                        <>
                                            <button 
                                                onClick={async () => {
                                                    if (confirm(`確定要批次確認選取的 ${selectedIds.size} 筆支出嗎？`)) {
                                                        await confirmExpenses(Array.from(selectedIds), {
                                                            paid_by: batchSettings.paid_by,
                                                            paid_for: batchSettings.paid_for
                                                        });
                                                        setSelectedIds(new Set());
                                                        await loadData();
                                                    }
                                                }}
                                                className="text-[10px] font-black bg-white text-amber-600 px-4 py-2 rounded-xl border border-amber-200 shadow-sm hover:bg-amber-50 transition-colors flex items-center gap-1.5"
                                            >
                                                確認選取
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if (confirm(`確定要刪除選取的 ${selectedIds.size} 筆支出嗎？`)) {
                                                        await deleteExpenses(Array.from(selectedIds));
                                                        setSelectedIds(new Set());
                                                        loadData();
                                                    }
                                                }}
                                                className="text-[10px] font-black bg-rose-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-rose-700 transition-colors flex items-center gap-1.5"
                                            >
                                                刪除選取
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setShowInbox(!showInbox)}
                                                className="text-[10px] font-black bg-amber-100 text-amber-700 px-4 py-2 rounded-xl border border-amber-200/50 hover:bg-amber-200 transition-all flex items-center gap-1.5"
                                            >
                                                {showInbox ? <ChevronRight className="w-3.5 h-3.5 rotate-90" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                {showInbox ? "收合清單" : "展開清單"}
                                            </button>
                                            {showInbox && (
                                                <>
                                                    <button 
                                                        onClick={() => {
                                                            const dupes = unreviewed.filter(u => u.is_duplicate).map(u => u.id);
                                                            if (dupes.length === 0) {
                                                                alert("目前沒有偵測到重複項目");
                                                                return;
                                                            }
                                                            setSelectedIds(new Set(dupes));
                                                        }}
                                                        className="text-[10px] font-black bg-white/50 text-amber-900 border border-amber-200/50 px-3 py-1.5 rounded-xl hover:bg-white transition-colors"
                                                    >
                                                        勾選重複項
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            if (confirm(`確定要批次確認 ${unreviewed.length} 筆支出嗎？`)) {
                                                                await confirmExpenses(unreviewed.map(u => u.id), {
                                                                    paid_by: batchSettings.paid_by,
                                                                    paid_for: batchSettings.paid_for
                                                                });
                                                                loadData();
                                                            }
                                                        }}
                                                        className="text-[10px] font-black bg-amber-600 text-white px-3 py-1.5 rounded-xl shadow-sm hover:bg-amber-700 transition-colors"
                                                    >
                                                        全部確認
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {showInbox && (
                                <div className="grid grid-cols-1 gap-4 mt-6 animate-in slide-in-from-top-4 duration-500">
                                    {unreviewed.map((item) => (
                                        <ReviewItem 
                                            key={item.id} 
                                            item={item} 
                                            onConfirm={handleConfirm} 
                                            onDelete={async (id: string) => {
                                                if (confirm("確定要刪除此筆待確認項目嗎？")) {
                                                    await deleteExpense(id);
                                                    loadData();
                                                }
                                            }}
                                            isSelected={selectedIds.has(item.id)}
                                            onToggleSelect={(id: string) => {
                                                const next = new Set(selectedIds);
                                                if (next.has(id)) next.delete(id);
                                                else next.add(id);
                                                setSelectedIds(next);
                                            }}
                                            categories={categories}
                                            goals={goals}
                                            batchSettings={batchSettings}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Expense List Section */}
                <div id="expense-list" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-extrabold text-xl text-gray-900 tracking-tight">近期已確認明細</h3>
                        <button 
                            onClick={() => setShowAllExpensesModal(true)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1 transition-colors group"
                        >
                            檢視全部明細 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentExpenses.map(item => (
                            <ExpenseItemCard 
                                key={item.id} 
                                item={item} 
                                categories={categories}
                                goals={goals}
                                onUpdate={loadData}
                                onDelete={async (id) => {
                                    if (confirm("確定要刪除此筆記錄嗎？")) {
                                        await deleteExpense(id);
                                        loadData();
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {showModal && (
                <ExpenseEntryModal 
                    onClose={() => setShowModal(false)} 
                    categories={categories}
                    goals={goals}
                    onSubmit={async (payload: any) => {
                        await createExpense({ ...payload, is_reviewed: true });
                        setShowModal(false);
                        loadData();
                    }}
                    onSubmitCategory={async (newCat: ExpenseCategory) => {
                        const freshCats = await getCategories();
                        setCategories(freshCats);
                    }}
                />
            )}

            {showHistoryModal && (
                <SettlementHistoryModal 
                    history={settlementHistory}
                    onClose={() => setShowHistoryModal(false)}
                    onDelete={async (id) => {
                        if (confirm("確定要刪除此筆結算紀錄嗎？")) {
                            await deleteSettlement(id);
                            loadData();
                        }
                    }}
                    onEdit={(item) => {
                        setEditingSettlement(item);
                        setShowPartialSettlementModal(true);
                    }}
                />
            )}

            {showPartialSettlementModal && (
                <PartialSettlementModal 
                    settlement={editingSettlement || settlement}
                    isEditing={!!editingSettlement}
                    activeTab={activeTab}
                    goals={goals}
                    onClose={() => {
                        setShowPartialSettlementModal(false);
                        setEditingSettlement(null);
                    }}
                    onSubmit={async (data: any) => {
                        if (editingSettlement) {
                            await updateSettlement(editingSettlement.id, data);
                        } else {
                            await createSettlement(data);
                        }
                        setShowPartialSettlementModal(false);
                        setEditingSettlement(null);
                        loadData();
                    }}
                />
            )}

            {showImportModal && (
                <ImportDataModal 
                    onClose={() => setShowImportModal(false)}
                    onSubmit={async (content: string, type: any) => {
                        try {
                            const parsed = await processAIImport(content, type);
                            if (parsed.length === 0) {
                                alert("AI 未能識別任何支出項目，請確認內容格式。");
                                return;
                            }
                            // Add parsed items to unreviewed as placeholder automated entries
                            const entries = parsed.map((item: any) => ({
                                ...item,
                                is_reviewed: false,
                                is_automated: true,
                                project_label: 'general',
                                paid_by: 'PY', // Default
                                paid_for: 'Both',
                                currency: 'TWD'
                            }));
                            
                            await createExpenses(entries);
                            
                            setShowImportModal(false);
                            loadData();
                        } catch (err: any) {
                            console.error("Import Error:", err);
                            const msg = err.message || JSON.stringify(err);
                            alert("匯入失敗: " + msg);
                        }
                    }}
                />
            )}
            
            {showCategoryMgmt && (
                <CategoryManagementModal 
                    categories={categories}
                    onClose={() => setShowCategoryMgmt(false)}
                    onUpdate={loadData}
                />
            )}

            {showAllExpensesModal && (
                <AllExpensesModal 
                    onClose={() => setShowAllExpensesModal(false)}
                    categories={categories}
                    goals={goals}
                    onUpdate={loadData}
                    activeTab={activeTab}
                />
            )}
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
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

// Simulated AI Category Suggestion
function getSuggestedCategoryId(storeName: string, categories: ExpenseCategory[]) {
    const name = storeName.toLowerCase();
    
    const findId = (names: string[]) => {
        const found = categories.find(c => names.includes(c.name));
        return found?.id || '';
    };

    if (name.includes('7-11') || name.includes('全家') || name.includes('鼎泰豐') || name.includes('星巴克')) {
        return findId(['餐飲外食', '餐飲美食']);
    }
    if (name.includes('捷運') || name.includes('uber') || name.includes('高鐵') || name.includes('星宇')) {
        return findId(['交通機票', '交通運輸']);
    }
    if (name.includes('台電') || name.includes('水費') || name.includes('netflix') || name.includes('瓦斯')) {
        return findId(['水電瓦斯', '水電費', '其他支出']);
    }
    if (name.includes('ikea') || name.includes('家樂福') || name.includes('採買')) {
        return findId(['日常採買', '居家生活']);
    }
    if (name.includes('裝修') || name.includes('工程') || name.includes('櫃')) {
        return findId(['裝潢工程', '新家裝修']);
    }
    if (name.includes('沙發') || name.includes('家具')) {
        return findId(['軟裝家具', '居家生活']);
    }
    return '';
}

// Simulated AI Goal Icon Recommendation
function getGoalIcon(goalName: string) {
    const name = goalName.toLowerCase();
    if (name.includes('家') || name.includes('房') || name.includes('home') || name.includes('裝潢')) return <Sofa className="w-5 h-5" />;
    if (name.includes('旅') || name.includes('日本') || name.includes('出國') || name.includes('travel')) return <PlaneTakeoff className="w-5 h-5" />;
    if (name.includes('車') || name.includes('car')) return <Car className="w-5 h-5" />;
    if (name.includes('學') || name.includes('教育') || name.includes('study')) return <GraduationCap className="w-5 h-5" />;
    if (name.includes('婚') || name.includes('愛') || name.includes('love')) return <Heart className="w-5 h-5" />;
    if (name.includes('電') || name.includes('手機') || name.includes('tech')) return <Smartphone className="w-5 h-5" />;
    if (name.includes('禮') || name.includes('送') || name.includes('gift')) return <Gift className="w-5 h-5" />;
    if (name.includes('兒') || name.includes('寶')) return <Heart className="w-5 h-5" />;
    if (name.includes('外') || name.includes('露營') || name.includes('雨')) return <Umbrella className="w-5 h-5" />;
    if (name.includes('假') || name.includes('海') || name.includes('島')) return <Palmtree className="w-5 h-5" />;
    
    return <TrendingDown className="w-5 h-5" />; // Default
}

function getGoalColor(goalName: string): "blue" | "indigo" | "amber" | "teal" | "rose" | "emerald" | "violet" {
    const name = goalName.toLowerCase();
    if (name.includes('家') || name.includes('裝潢')) return "indigo";
    if (name.includes('旅') || name.includes('日本')) return "emerald";
    if (name.includes('車')) return "blue";
    if (name.includes('學')) return "violet";
    if (name.includes('愛') || name.includes('禮')) return "rose";
    return "teal";
}

function ReviewItem({ item, onConfirm, onDelete, isSelected, onToggleSelect, categories, goals, batchSettings }: any) {
    const [updates, setUpdates] = useState({
        goal_id: item.goal_id || '',
        category_id: item.category_id || getSuggestedCategoryId(item.store_name, categories),
        paid_by: item.paid_by || (batchSettings?.paid_by || 'PY'),
        paid_for: item.paid_for || (batchSettings?.paid_for || 'Both')
    });

    useEffect(() => {
        if (batchSettings) {
            setUpdates(prev => ({ 
                ...prev, 
                paid_by: batchSettings.paid_by,
                paid_for: batchSettings.paid_for
            }));
        }
    }, [batchSettings]);

    return (
        <div className={cn(
            "bg-white/80 backdrop-blur-md border rounded-[2rem] p-4 flex flex-col xl:grid xl:grid-cols-12 xl:items-center gap-4 transition-all duration-500",
            isSelected ? "border-amber-400 bg-amber-50/50 ring-4 ring-amber-100/20 shadow-2xl shadow-amber-200/20" : "border-gray-100 hover:border-indigo-200 shadow-sm"
        )}>
            <div className="flex items-center gap-4 xl:col-span-4 min-w-0">
                <div className="flex-shrink-0">
                    <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className="w-6 h-6 rounded-xl border-gray-200 text-amber-500 focus:ring-amber-500 cursor-pointer transition-all hover:scale-110"
                    />
                </div>
                <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100 flex-shrink-0 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {item.is_automated ? <Sparkles className="w-5 h-5 text-amber-500 animate-pulse relative z-10" /> : <Receipt className="w-5 h-5 text-gray-300 relative z-10" />}
                </div>
                <div className="min-w-0">
                    <div className="font-black text-gray-900 text-lg tracking-tighter flex items-center gap-2">
                        <span className="truncate">{item.store_name}</span>
                        {item.is_duplicate && (
                            <span 
                                className="flex-shrink-0 flex items-center gap-1 bg-rose-50 text-rose-600 text-[8px] px-2 py-0.5 rounded-full border border-rose-100 font-black uppercase tracking-widest"
                                title={item.metadata?.duplicate_of_id ? `與現有記錄匹配 (#${item.metadata.duplicate_of_id.substring(0,6)})` : "偵測到疑似重複的現有支出"}
                            >
                                <AlertTriangle className="w-2 h-2" /> DUP
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] font-black text-gray-400 mt-0.5 flex items-center gap-2 uppercase tracking-widest truncate">
                        <span>{item.date}</span>
                        <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                        <span className={cn(item.is_automated ? "text-amber-500" : "text-gray-300")}>
                            {item.is_automated ? 'Smart Import' : 'Manual Entry'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="xl:col-span-2 text-left xl:text-center">
                <div className="font-black text-2xl text-gray-900 tracking-tighter">NT$ {item.amount.toLocaleString()}</div>
            </div>

            <div className="xl:col-span-5 grid grid-cols-2 gap-x-10 gap-y-3 bg-gray-50/50 px-6 py-4 rounded-[2rem] border border-gray-100">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Project</span>
                    <select 
                        value={updates.goal_id} 
                        onChange={(e) => setUpdates({...updates, goal_id: e.target.value})}
                        className="bg-transparent text-[13px] font-black text-indigo-600 outline-none cursor-pointer max-w-[150px] truncate"
                    >
                        <option value="">🏠 HOME</option>
                        {goals.map((g: any) => <option key={g.id} value={g.id}>🎯 {g.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col border-l border-gray-200/60 pl-8">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Paid By</span>
                    <select 
                        value={updates.paid_by}
                        onChange={(e) => setUpdates({...updates, paid_by: e.target.value})}
                        className="bg-transparent text-[13px] font-black text-emerald-600 outline-none cursor-pointer"
                    >
                        <option value="PY">PY</option>
                        <option value="Kigo">Kigo</option>
                        <option value="Both">Both</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Category</span>
                    <select 
                        value={updates.category_id}
                        onChange={(e) => setUpdates({...updates, category_id: e.target.value})}
                        className="bg-transparent text-[13px] font-black text-gray-600 outline-none cursor-pointer max-w-[150px] truncate"
                    >
                        <option value="">UNCATEGORIZED</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                    </select>
                </div>
                <div className="flex flex-col border-l border-gray-200/60 pl-8">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">For</span>
                    <select 
                        value={updates.paid_for}
                        onChange={(e) => setUpdates({...updates, paid_for: e.target.value})}
                        className="bg-transparent text-[13px] font-black text-slate-500 outline-none cursor-pointer uppercase"
                    >
                        <option value="Both">BOTH</option>
                        <option value="PY">PY</option>
                        <option value="Kigo">Kigo</option>
                    </select>
                </div>
            </div>

            <div className="xl:col-span-1 flex items-center justify-end gap-2">
                <button 
                    onClick={() => onConfirm(item.id, updates)}
                    className="bg-indigo-600 hover:bg-black text-white px-4 py-2.5 rounded-xl font-black text-[9px] transition-all active:scale-[0.95] shadow-lg shadow-indigo-500/5 whitespace-nowrap"
                >
                    確認
                </button>
                <button 
                    onClick={() => onDelete(item.id)}
                    className="p-2.5 text-gray-400 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 rounded-xl transition-all border border-transparent"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, change, subtext, color, progress, project }: any) {
    const colorClasses: any = {
        blue: "bg-blue-100/50 text-blue-600 ring-4 ring-blue-50/50",
        indigo: "bg-indigo-100/50 text-indigo-600 ring-4 ring-indigo-50/50",
        amber: "bg-amber-100/50 text-amber-600 ring-4 ring-amber-50/50",
        emerald: "bg-emerald-100/50 text-emerald-600 ring-4 emerald-50/50",
        rose: "bg-rose-100/50 text-rose-600 ring-4 rose-50/50",
        purple: "bg-purple-100/50 text-purple-600 ring-4 purple-50/50"
    };

    return (
        <div className={cn(
            "bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[160px] group",
            project && "bg-gradient-to-br from-indigo-50/30 to-purple-50/30 border-indigo-100/50"
        )}>
            <div className="flex justify-between items-start">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", colorClasses[color] || colorClasses.indigo)}>
                    {icon}
                </div>
                {change && (
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
                <div className={cn("text-2xl md:text-3xl font-black text-gray-900 tracking-tighter mt-1", project && "text-indigo-900")}>{value}</div>
                {subtext && <div className="text-[11px] font-bold text-gray-400 mt-2 flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-gray-200"></div>{subtext}</div>}
                {progress !== undefined && (
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
                        <div 
                            className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", color === 'amber' ? "bg-amber-400" : "bg-indigo-500")} 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SettlementCard({ settlement, onOpenHistory, onOpenSettlement }: any) {
    if (!settlement) return null;

    return (
        <div className="lg:col-span-5 flex flex-col h-full group">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden h-full border border-slate-700/50 flex flex-col justify-between transition-all duration-500 hover:shadow-indigo-500/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                    <Wallet className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight">分帳淨額結算</h3>
                            </div>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest pl-13">Settlement Overview</p>
                        </div>
                        <button 
                            onClick={onOpenHistory}
                            className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-2xl border border-slate-700 transition-all text-slate-300 group-hover:border-slate-500"
                        >
                            <History className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="mb-10 text-center">
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Current Net Balance</div>
                        <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-indigo-400 tracking-tighter">
                            ${settlement.abs_balance.toLocaleString()}
                        </div>
                        <div className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-black text-indigo-300 mt-5 uppercase tracking-widest">
                            {settlement.summary}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="p-4 bg-slate-800/40 rounded-3xl border border-slate-700/30 backdrop-blur-sm">
                            <div className="text-[10px] font-black text-slate-500 uppercase mb-1">PY 墊付</div>
                            <div className="text-lg font-black text-slate-200">${settlement.py_credit.toLocaleString()}</div>
                        </div>
                        <div className="p-4 bg-slate-800/40 rounded-3xl border border-slate-700/30 backdrop-blur-sm">
                            <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Kigo 墊付</div>
                            <div className="text-lg font-black text-slate-200">${settlement.py_debit.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onOpenSettlement}
                    disabled={settlement.abs_balance === 0}
                    className="w-full mt-8 bg-white hover:bg-indigo-50 text-slate-900 py-4.5 rounded-[1.5rem] font-black text-sm transition-all flex items-center justify-center gap-3 relative z-10 shadow-xl shadow-indigo-900/20 active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed group/btn"
                >
                    <CheckCircle className="w-5 h-5 text-indigo-600 transition-transform group-hover/btn:scale-110" />
                    執行結算作業
                </button>
            </div>
        </div>
    );
}

function ExpenseItemCard({ item, onDelete, categories, goals, onUpdate }: { item: Expense, onDelete?: (id: string) => void, categories: any[], goals: any[], onUpdate: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [updates, setUpdates] = useState({
        category_id: item.category_id || '',
        paid_by: item.paid_by || 'PY',
        paid_for: item.paid_for || 'Both',
        goal_id: item.goal_id || ''
    });

    const hasChanges = updates.category_id !== (item.category_id || '') || 
                       updates.paid_by !== (item.paid_by || 'PY') || 
                       updates.paid_for !== (item.paid_for || 'Both') ||
                       updates.goal_id !== (item.goal_id || '');

    const handleUpdate = async () => {
        await updateExpense(item.id, updates);
        setIsEditing(false);
        onUpdate();
    };

    return (
        <div className={cn(
            "group bg-white border rounded-[2rem] p-5 hover:shadow-xl transition-all duration-300 relative overflow-hidden",
            isEditing ? "border-indigo-400 ring-2 ring-indigo-50" : "border-gray-100"
        )}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Receipt className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" />
                    </div>
                    <div>
                        <div className="font-black text-gray-900 text-sm tracking-tight truncate max-w-[120px]">
                            {item.store_name}
                        </div>
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.date}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="font-black text-gray-900 text-base tracking-tight">-NT$ {item.amount.toLocaleString()}</div>
                    {onDelete && (
                        <button 
                            onClick={() => onDelete(item.id)}
                            className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="relative z-10 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                        <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Project</span>
                        <select 
                            value={updates.goal_id}
                            onChange={(e) => { setUpdates({...updates, goal_id: e.target.value}); setIsEditing(true); }}
                            className="bg-transparent text-[9px] font-black text-indigo-600 outline-none cursor-pointer"
                        >
                            <option value="">🏠 HOME</option>
                            {goals.map((g: any) => <option key={g.id} value={g.id}>🎯 {g.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                        <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</span>
                        <select 
                            value={updates.category_id}
                            onChange={(e) => { setUpdates({...updates, category_id: e.target.value}); setIsEditing(true); }}
                            className="bg-transparent text-[9px] font-black text-gray-600 outline-none cursor-pointer"
                        >
                            <option value="">UNCATEGORIZED</option>
                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                        <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Paid By</span>
                        <select 
                            value={updates.paid_by}
                            onChange={(e) => { setUpdates({...updates, paid_by: e.target.value}); setIsEditing(true); }}
                            className="bg-transparent text-[9px] font-black text-emerald-600 outline-none cursor-pointer"
                        >
                            <option value="PY">PY</option>
                            <option value="Kigo">Kigo</option>
                            <option value="Both">Both</option>
                        </select>
                    </div>
                    <div className="flex flex-col bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                        <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">For</span>
                        <select 
                            value={updates.paid_for}
                            onChange={(e) => { setUpdates({...updates, paid_for: e.target.value}); setIsEditing(true); }}
                            className="bg-transparent text-[9px] font-black text-slate-500 outline-none cursor-pointer uppercase"
                        >
                            <option value="Both">BOTH</option>
                            <option value="PY">PY</option>
                            <option value="Kigo">Kigo</option>
                        </select>
                    </div>
                </div>

                {hasChanges && (
                    <button 
                        onClick={handleUpdate}
                        className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-indigo-200 animate-in fade-in slide-in-from-bottom-2"
                    >
                        SAVE CHANGES
                    </button>
                )}
            </div>
        </div>
    );
}

function ExpenseEntryModal({ onClose, categories, goals, onSubmit, onSubmitCategory }: any) {
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
                                onChange={(e) => setPayload({...payload, date: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">金額 (NT$)</label>
                            <input 
                                type="number" 
                                placeholder="0" 
                                value={payload.amount}
                                onChange={(e) => setPayload({...payload, amount: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                            />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">店家 / 支出項目</label>
                            <input 
                                type="text" 
                                placeholder="例如：保母費、系統櫃尾款..." 
                                value={payload.store_name}
                                onChange={(e) => setPayload({...payload, store_name: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">歸屬目標</label>
                            <select 
                                value={payload.goal_id}
                                onChange={(e) => setPayload({...payload, goal_id: e.target.value})}
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
                            <div className="flex flex-col gap-2">
                                <select 
                                    value={payload.category_id}
                                    onChange={(e) => setPayload({...payload, category_id: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                                >
                                    <option value="">請選擇...</option>
                                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
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
                                onChange={(e) => setPayload({...payload, paid_by: e.target.value})}
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
                                onChange={(e) => setPayload({...payload, paid_for: e.target.value})}
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

function CategoryManagementModal({ categories, onClose, onUpdate }: any) {
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
        // Filter out colors that are already used by existing categories
        const usedColors = categories.map((c: any) => c.color.toLowerCase());
        const availableColors = colors.filter(c => !usedColors.includes(c.toLowerCase()));
        
        // If all colors are used, just use the full palette
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
                    {/* Add Section */}
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

                    {/* List Section */}
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
                            ) )}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Merge Section */}
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

function SettlementHistoryModal({ history, onClose, onDelete, onEdit }: { history: Settlement[], onClose: () => void, onDelete?: (id: string) => void, onEdit?: (item: Settlement) => void }) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
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

function PartialSettlementModal({ settlement, activeTab, goals, onClose, onSubmit, isEditing }: any) {
    const [amount, setAmount] = useState(isEditing ? settlement.amount : settlement.abs_balance);
    const [notes, setNotes] = useState(settlement.notes || '');
    const [date, setDate] = useState(settlement.settlement_date || new Date().toISOString().split('T')[0]);

    const isPYPaying = isEditing 
        ? settlement.payer === 'PY'
        : settlement.net_balance < 0; 
    const isKigoPaying = isEditing 
        ? settlement.payer === 'Kigo'
        : settlement.net_balance > 0;

    const currentAbsBalance = isEditing ? settlement.amount : settlement.abs_balance;

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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
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
                        {/* Summary Box */}
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
                                    <div className="text-sm font-bold">目前總欠款 ${settlement.abs_balance.toLocaleString()}</div>
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

                        {/* Amount Input */}
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
                            <div className="flex gap-2 mt-3">
                                <button 
                                    onClick={() => setAmount(settlement.abs_balance)}
                                    className="text-[10px] font-black bg-white border border-gray-200 px-3 py-1 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                                >
                                    全額結算
                                </button>
                                <button 
                                    onClick={() => setAmount(Math.round(settlement.abs_balance / 2))}
                                    className="text-[10px] font-black bg-white border border-gray-200 px-3 py-1 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                                >
                                    結算一半
                                </button>
                            </div>
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
                                    <Layers className="w-3 h-3" /> {activeTab === 'all' ? '全帳本' : (activeTab === 'general' ? '日常家庭' : goals.find((g: any) => g.id === activeTab)?.name)}
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
                                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-2 px-4 font-bold text-gray-900 text-sm focus:border-indigo-500 transition-all outline-none"
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

function ImportDataModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (content: string, type: 'text' | 'csv' | 'carrier') => void }) {
    const [content, setContent] = useState("");
    const [type, setType] = useState<'text' | 'csv' | 'carrier'>('text');
    const [isLoading, setIsLoading] = useState(false);
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
            await onSubmit(content, type);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
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

                    <div className="space-y-3">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">貼上內容或上傳檔案</label>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 flex items-center gap-1"
                            >
                                <Upload className="w-3 h-3" />
                                上傳 .CSV / .TXT 檔案
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                accept=".csv,.txt" 
                                className="hidden" 
                            />
                        </div>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={type === 'carrier' ? "請從財政部電子發票平台或相關 App 複製載具明細內容後貼上..." : "貼上您的消費明細文字或 CSV 內容..."}
                            className="w-full h-48 bg-gray-50 border-2 border-gray-100 rounded-[24px] p-6 font-bold text-gray-900 text-sm focus:border-amber-400 transition-all outline-none resize-none placeholder:text-gray-300"
                        />
                    </div>

                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 flex items-start gap-3">
                        <Zap className="w-4 h-4 text-amber-500 mt-0.5" />
                        <p className="text-[10px] leading-relaxed text-amber-800 font-bold">
                            AI 將自動識別店家、日期、金額與類別，並自動與過去 30 天內的支出進行比對，標示可能的重複項目。上傳檔案後會自動填入上方對話框。
                        </p>
                    </div>
                </div>

                <div className="p-8 pt-0 flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all border border-gray-100"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleImport}
                        disabled={!content || isLoading}
                        className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-black text-sm hover:bg-amber-600 transition-all shadow-xl shadow-amber-100 border border-amber-400 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Zap className="w-4 h-4 animate-pulse" />
                                正在透過 AI 解析中...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                開始 AI 智慧解析
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AllExpensesModal({ onClose, categories, goals, onUpdate, activeTab }: any) {
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        loadAll();
    }, [activeTab, startDate, endDate]);

    const loadAll = async () => {
        setIsLoading(true);
        try {
            const isGoalTab = activeTab !== 'all' && activeTab !== 'general';
            const data = await getExpenses({ 
                project_label: activeTab === 'all' ? undefined : (isGoalTab ? undefined : activeTab),
                goal_id: isGoalTab ? activeTab : undefined,
                is_reviewed: true,
                sortBy: 'date',
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

    const filtered = allExpenses.filter(e => 
        e.store_name.toLowerCase().includes(search.toLowerCase()) ||
        e.category_id && categories.find((c:any) => c.id === e.category_id)?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4 py-10 md:p-8 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-2xl w-full max-w-6xl h-full rounded-[3rem] shadow-2xl border border-white/20 flex flex-col overflow-hidden relative">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/50 relative z-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                            <Receipt className="w-8 h-8 text-indigo-600" />
                            全部支出明細
                        </h2>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">View All Transaction History</p>
                    </div>
                    <div className="flex items-center gap-4">
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
                                    title="重置日期"
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
                                placeholder="搜索店家或類別..."
                                className="pl-11 pr-6 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl text-sm font-bold text-gray-900 w-64 transition-all outline-none shadow-sm"
                            />
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all border border-gray-100"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-gray-50/30">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="font-black text-sm uppercase tracking-widest">Loading transactions...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 opacity-50">
                            <Receipt className="w-16 h-16" />
                            <p className="font-black text-lg uppercase tracking-widest">No matching records found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(item => (
                                <ExpenseItemCard 
                                    key={item.id} 
                                    item={item} 
                                    categories={categories}
                                    goals={goals}
                                    onUpdate={() => {
                                        loadAll();
                                        onUpdate();
                                    }}
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
                        Total {filtered.length} Records
                    </div>
                </div>
            </div>
        </div>
    );
}

