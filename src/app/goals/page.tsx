"use client";

import { Target, Calendar, ArrowRight, Wallet, CheckCircle } from "lucide-react";

const goals = [
    {
        id: 1,
        title: "Japandi Home Furnishing",
        targetAmount: 500000,
        currentAmount: 320000,
        currency: "TWD",
        targetDate: "2026-06-01",
        status: "On Track",
        statusColor: "text-emerald-500 bg-emerald-50",
        linkedAssets: ["Cathay TWD", "0050.TW"]
    },
    {
        id: 2,
        title: "Phuket Family Trip",
        targetAmount: 150000,
        currentAmount: 45000,
        currency: "TWD",
        targetDate: "2026-10-15",
        status: "Warning",
        statusColor: "text-amber-500 bg-amber-50",
        linkedAssets: ["Richart USD"]
    },
    {
        id: 3,
        title: "Ah Fu Maternity & Baby Buffer",
        targetAmount: 800000,
        currentAmount: 800000,
        currency: "TWD",
        targetDate: "2026-12-01",
        status: "Completed",
        statusColor: "text-brand-500 bg-brand-50",
        linkedAssets: ["Fixed Deposit TWD"]
    }
];

export default function GoalTracker() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Goals & Major Expenses</h1>
                    <p className="text-slate-500 mt-1">Bind your assets to specific future goals.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                    <Target className="w-4 h-4" />
                    <span>New Goal</span>
                </button>
            </div>

            <div className="grid gap-6">
                {goals.map(goal => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    const isComplete = progress >= 100;

                    return (
                        <div key={goal.id} className="glass p-6 rounded-3xl border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">

                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${isComplete ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {isComplete ? <CheckCircle className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">{goal.title}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${goal.statusColor}`}>
                                                {goal.status}
                                            </span>
                                            <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(goal.targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Amount</p>
                                    <p className="text-2xl font-black text-slate-900">
                                        ${(goal.targetAmount / 10000).toFixed(1)}W <span className="text-base text-slate-400 font-medium">{goal.currency}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm font-medium text-slate-600">
                                    <span>${(goal.currentAmount / 10000).toFixed(1)}W saved</span>
                                    <span>{progress.toFixed(0)}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${isComplete ? 'bg-brand-500' : 'bg-slate-800'
                                            }`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Linked Assets */}
                            <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 whitespace-nowrap">
                                    <Wallet className="w-4 h-4 text-slate-400" />
                                    Linked Assets:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {goal.linkedAssets.map(asset => (
                                        <span key={asset} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm">
                                            {asset}
                                        </span>
                                    ))}
                                </div>
                                {!isComplete && (
                                    <button className="ml-auto flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-500 transition-colors">
                                        Manage Funding <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                        </div>
                    );
                })}
            </div>

        </div>
    );
}
