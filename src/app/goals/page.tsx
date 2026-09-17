"use client";

import { useState, useEffect } from "react";
import { Plus, X, PiggyBank, Target, Trash2, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { getGoalsWithProgress, createGoal, getActiveAssets, deleteGoal, updateGoal, updateGoalsOrder } from "@/app/actions/goals";
import { useLanguage } from "@/context/LanguageContext";

export default function GoalTracker() {
    const { t } = useLanguage();
    const [goals, setGoals] = useState<any[]>([]);
    const [activeAssets, setActiveAssets] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);

    // Form Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

    // Support Category and Asset IDs
    const [formData, setFormData] = useState({
        name: "",
        target_amount: "",
        target_date: "",
        category: "upcoming_expense", // Default
        asset_ids: [] as string[]
    });

    const fetchGoalsAndAssets = async () => {
        const [goalsData, assetsData] = await Promise.all([
            getGoalsWithProgress(),
            getActiveAssets()
        ]);
        setGoals(goalsData);
        setActiveAssets(assetsData);
    };

    useEffect(() => {
        setMounted(true);
        fetchGoalsAndAssets();
    }, []);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const amount = Number(formData.target_amount);
            if (isNaN(amount) || amount <= 0) {
                alert(t('goals.validAmountMsg'));
                return;
            }

            if (editingGoalId) {
                await updateGoal(editingGoalId, {
                    name: formData.name,
                    target_amount: amount,
                    category: formData.category,
                    target_date: formData.target_date || null,
                    asset_ids: formData.asset_ids
                });
            } else {
                await createGoal({
                    name: formData.name,
                    target_amount: amount,
                    category: formData.category,
                    target_date: formData.target_date || null,
                    asset_ids: formData.asset_ids
                });
            }

            // Reset form and close modal
            setFormData({ name: "", target_amount: "", target_date: "", category: "upcoming_expense", asset_ids: [] });
            setEditingGoalId(null);
            setIsModalOpen(false);

            // Refresh list
            await fetchGoalsAndAssets();

        } catch (error) {
            console.error(error);
            alert(t('goals.addErrorMsg'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGoal = async (goalId: string, goalName: string) => {
        if (!confirm(t('goals.deleteConfirmMsg', { name: goalName }))) return;
        try {
            await deleteGoal(goalId);
            await fetchGoalsAndAssets();
        } catch (error) {
            console.error(error);
            alert(t('goals.deleteErrorMsg'));
        }
    };

    const handleEditClick = (goal: any) => {
        setEditingGoalId(goal.id);
        setFormData({
            name: goal.name,
            target_amount: goal.target_amount.toString(),
            target_date: goal.target_date || "",
            category: goal.category || "upcoming_expense",
            asset_ids: goal.goal_asset_mapping?.map((m: any) => m.asset_id) || []
        });
        setIsModalOpen(true);
    };

    const toggleAssetSelection = (assetId: string) => {
        setFormData(prev => {
            const currentSelection = new Set(prev.asset_ids);
            if (currentSelection.has(assetId)) {
                currentSelection.delete(assetId);
            } else {
                currentSelection.add(assetId);
            }
            return { ...prev, asset_ids: Array.from(currentSelection) };
        });
    };

    const handleMoveGoal = async (goalId: string, direction: 'up' | 'down') => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;

        const categoryGoals = goals.filter(g =>
            (goal.category === 'upcoming_expense' && g.category === 'upcoming_expense') ||
            ((goal.category === 'long_term' || !goal.category) && (g.category === 'long_term' || !g.category))
        );

        const intraIndex = categoryGoals.findIndex(g => g.id === goalId);
        if (intraIndex === -1) return;

        let swapWithId: string | null = null;
        if (direction === 'up' && intraIndex > 0) {
            swapWithId = categoryGoals[intraIndex - 1].id;
        } else if (direction === 'down' && intraIndex < categoryGoals.length - 1) {
            swapWithId = categoryGoals[intraIndex + 1].id;
        }

        if (!swapWithId) return;

        const newGoals = [...goals];
        const indexA = newGoals.findIndex(g => g.id === goalId);
        const indexB = newGoals.findIndex(g => g.id === swapWithId);

        [newGoals[indexA], newGoals[indexB]] = [newGoals[indexB], newGoals[indexA]];

        // Optimistic update
        setGoals(newGoals);

        try {
            await updateGoalsOrder(newGoals.map(g => g.id));
        } catch (error) {
            console.error(error);
            alert("順序更新失敗");
            fetchGoalsAndAssets(); // Rollback
        }
    };

    if (!mounted) return <div className="animate-pulse space-y-8 p-4"><div className="h-32 bg-slate-200 rounded-2xl w-full"></div></div>;

    // Split goals into categories
    const upcomingExpenses = goals.filter(g => g.category === 'upcoming_expense');
    const longTermGoals = goals.filter(g => g.category === 'long_term' || !g.category);

    const formatTWD = (val: number) => {
        return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(val);
    };

    const getStatusStyle = (status: string) => {
        if (status === 'achieved') return { text: t('goals.statusAchieved'), color: "text-emerald-500", dot: "bg-emerald-500", progress: "bg-teal-500" };
        if (status === 'warning') return { text: t('goals.statusWarning'), color: "text-amber-500", dot: "bg-amber-400", progress: "bg-amber-400" };
        return { text: t('goals.statusOnTrack'), color: "text-blue-600", dot: "bg-blue-600", progress: "bg-blue-500" };
    };

    const renderGoalCard = (goal: any) => {
        const style = getStatusStyle(goal.status);
        return (
            <div key={goal.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-xl">🎯</span> {goal.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5 mr-2 border-r border-slate-100 pr-2">
                            <button
                                onClick={() => handleMoveGoal(goal.id, 'up')}
                                className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all disabled:opacity-30"
                                title="向上移動"
                            >
                                <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleMoveGoal(goal.id, 'down')}
                                className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all disabled:opacity-30"
                                title="向下移動"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-md">
                            {t('goals.targetDateLabel')}: {goal.target_date || t('goals.notSetLabel')}
                        </span>
                        <button
                            onClick={() => handleEditClick(goal)}
                            className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="編輯目標"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDeleteGoal(goal.id, goal.name)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="刪除目標"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${style.progress}`}
                            style={{ width: `${goal.progress}%` }}
                        />
                    </div>
                </div>

                {/* Metrics */}
                <div className="flex justify-between items-end mb-4">
                    <p className="text-sm font-medium text-slate-600">
                        {t('goals.allocatedLabel')}: {formatTWD(goal.current_funding)} / {t('goals.targetLabel')}: {formatTWD(goal.target_amount)} TWD
                    </p>
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${style.color}`}>
                        {style.text} ({goal.progress.toFixed(1)}%)
                        <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    </div>
                </div>

                {/* Source info */}
                <p className="text-xs font-medium text-slate-400">
                    {goal.goal_asset_mapping?.length > 0
                        ? t('goals.boundAssetsCount', { count: goal.goal_asset_mapping.length })
                        : t('goals.noBoundAssets')}
                </p>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Target className="w-8 h-8 text-teal-500" />
                    {t('goals.title')}
                </h1>
                <button
                    onClick={() => {
                        setEditingGoalId(null);
                        setFormData({ name: "", target_amount: "", target_date: "", category: "upcoming_expense", asset_ids: [] });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" />
                    {t('goals.addGoalBtn')}
                </button>
            </div>

            {/* Upcoming Expenses Section */}
            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden border-t-4 border-t-amber-400 relative">
                <div className="p-6 md:px-8 border-b border-slate-100 flex items-center gap-3 bg-white z-10">
                    <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                        <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{t('goals.upcomingExpensesTitle')}</h2>
                        <p className="text-sm text-slate-500">{t('goals.upcomingExpensesSubtitle')}</p>
                    </div>
                </div>

                <div className="p-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                    {upcomingExpenses.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-slate-400 text-sm">{t('goals.noUpcomingGoals')}</div>
                    ) : upcomingExpenses.map(renderGoalCard)}
                </div>
            </section>

            {/* Long Term Goals Section */}
            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden border-t-4 border-t-indigo-500 relative">
                <div className="p-6 md:px-8 border-b border-slate-100 flex items-center gap-3 bg-white z-10">
                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{t('goals.longTermTitle')}</h2>
                        <p className="text-sm text-slate-500">{t('goals.longTermSubtitle')}</p>
                    </div>
                </div>

                <div className="p-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                    {longTermGoals.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-slate-400 text-sm">{t('goals.noLongTermGoals')}</div>
                    ) : longTermGoals.map(renderGoalCard)}
                </div>
            </section>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b border-slate-100 z-10">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingGoalId ? t('goals.editGoalTitle') : t('goals.newGoalTitle')}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingGoalId(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddGoal} className="p-6 space-y-6">

                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">{t('goals.categoryLabel')} <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`
                                        cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                                        ${formData.category === 'upcoming_expense' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}
                                    `}>
                                        <input type="radio" name="category" value="upcoming_expense" className="sr-only"
                                            checked={formData.category === 'upcoming_expense'}
                                            onChange={() => setFormData({ ...formData, category: 'upcoming_expense' })}
                                        />
                                        <PiggyBank className="w-6 h-6 mb-2" />
                                        <span className="font-bold text-sm">{t('goals.shortTermExpenseCat')}</span>
                                    </label>

                                    <label className={`
                                        cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                                        ${formData.category === 'long_term' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}
                                    `}>
                                        <input type="radio" name="category" value="long_term" className="sr-only"
                                            checked={formData.category === 'long_term'}
                                            onChange={() => setFormData({ ...formData, category: 'long_term' })}
                                        />
                                        <Target className="w-6 h-6 mb-2" />
                                        <span className="font-bold text-sm">{t('goals.longTermPlanCat')}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('goals.goalNameLabel')} <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all placeholder:text-slate-400"
                                        placeholder={t('goals.goalNamePlaceholder')}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('goals.goalAmountLabel')} <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all placeholder:text-slate-400"
                                            placeholder={t('goals.goalAmountPlaceholder')}
                                            value={formData.target_amount}
                                            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('goals.targetDateInputLabel')}</label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-slate-700"
                                            value={formData.target_date}
                                            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Asset Selection */}
                            <div className="pt-2 border-t border-slate-100">
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('goals.bindAssetsLabel')}</label>
                                <p className="text-xs text-slate-500 mb-3">{t('goals.bindAssetsDesc')}</p>

                                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-1">
                                    {activeAssets.length === 0 ? (
                                        <div className="text-xs text-slate-400 text-center py-4">{t('goals.noAssetsAvailable')}</div>
                                    ) : (
                                        activeAssets.map(asset => {
                                            const isSelected = formData.asset_ids.includes(asset.id);
                                            return (
                                                <label
                                                    key={asset.id}
                                                    className={`
                                                        flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors text-sm
                                                        ${isSelected ? 'bg-teal-50 border border-teal-200 shadow-sm' : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                                                    `}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-teal-500 rounded border-slate-300 focus:ring-teal-500"
                                                        checked={isSelected}
                                                        onChange={() => toggleAssetSelection(asset.id)}
                                                    />
                                                    <div className="flex-1 font-medium text-slate-700 truncate">{asset.title}</div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${asset.owner === 'PY' ? 'bg-emerald-100 text-emerald-700' :
                                                            asset.owner === 'Kigo' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-indigo-100 text-indigo-700'
                                                            }`}>
                                                            {asset.owner === 'Both' ? t('goals.bothLabel') : asset.owner}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-bold">
                                                            {asset.currency}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 text-slate-400 bg-slate-50 border border-slate-100 rounded-md">
                                                            {asset.asset_type === 'stock' || asset.asset_type === 'rsu' ? t('goals.stockAssetType') : t('goals.cashAssetType')}
                                                        </span>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-6 mt-4 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingGoalId(null);
                                    }}
                                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                                    disabled={isSubmitting}
                                >
                                    {t('goals.cancelBtn')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        editingGoalId ? t('goals.saveBtn') : t('goals.createBtn')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
