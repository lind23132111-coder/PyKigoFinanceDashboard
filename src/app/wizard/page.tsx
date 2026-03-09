"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, TrendingUp, Wallet, Sparkles, Trash2, Plus, X, ArchiveRestore, RefreshCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getWizardInitData, searchTicker, checkDuplicateTicker } from "@/app/actions/wizard";
import type { TickerSuggestion } from "@/app/actions/wizard";
import { toggleAssetActive, addNewAsset } from "@/app/actions/goals";

type Asset = {
    id: string;
    title: string;
    owner: string;
    asset_type: 'cash' | 'stock' | 'fixed_deposit' | 'rsu';
    currency: string;
    ticker_symbol: string | null;
};

// Define UI mapping type
type MappedAsset = Asset & {
    ownerColor: string;
    shares?: number;
    price?: number;
    totalValue?: number;
    growth?: number;
    prevBalance?: string;
    defaultValue?: string;
    fxRate?: number;
};

const getOwnerColor = (owner: string) => {
    switch (owner) {
        case 'PY': return "bg-emerald-100 text-emerald-700";
        case 'Kigo': return "bg-amber-100 text-amber-700";
        case 'Both': return "bg-indigo-100 text-indigo-700";
        default: return "bg-slate-100 text-slate-700";
    }
};

export default function QuarterlyWizard() {
    const [activeTab, setActiveTab] = useState("All");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Remote Data States
    const [stockAssets, setStockAssets] = useState<MappedAsset[]>([]);
    const [cashAccounts, setCashAccounts] = useState<MappedAsset[]>([]);
    const [loading, setLoading] = useState(true);

    // Period States
    const [currentPeriod, setCurrentPeriod] = useState<string>("");
    const [lastPeriod, setLastPeriod] = useState<string>("載入中...");
    const [monthsSinceLast, setMonthsSinceLast] = useState<number | null>(null);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newAsset, setNewAsset] = useState({ title: '', owner: 'PY', asset_type: 'cash', currency: 'TWD', ticker_symbol: '' });

    // Ticker autocomplete states
    const [tickerQuery, setTickerQuery] = useState('');
    const [tickerSuggestions, setTickerSuggestions] = useState<TickerSuggestion[]>([]);
    const [tickerSearching, setTickerSearching] = useState(false);
    const [tickerDropdownOpen, setTickerDropdownOpen] = useState(false);
    const [tickerSelected, setTickerSelected] = useState(false);
    const [tickerError, setTickerError] = useState('');

    const handleDeleteAsset = async (id: string) => {
        if (!confirm("確定要移除此資產嗎？(歷史紀錄仍會保留)")) return;
        try {
            await toggleAssetActive(id, false);
            setStockAssets(prev => prev.filter(a => a.id !== id));
            setCashAccounts(prev => prev.filter(a => a.id !== id));
        } catch (e) {
            alert("移除失敗");
        }
    };

    // Restore Modal States
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [hiddenAssets, setHiddenAssets] = useState<MappedAsset[]>([]);

    const handleOpenRestoreModal = async () => {
        setIsRestoreModalOpen(true);
        const { data, error } = await supabase.from('assets').select('*').eq('is_active', false).order('owner', { ascending: true });
        if (data) {
            setHiddenAssets(data.map((asset: Asset) => ({ ...asset, ownerColor: getOwnerColor(asset.owner) })));
        }
    };

    const handleRestoreAsset = async (asset: MappedAsset) => {
        try {
            await toggleAssetActive(asset.id, true);
            setHiddenAssets(prev => prev.filter(a => a.id !== asset.id));

            const mapped: MappedAsset = {
                ...asset,
                shares: asset.asset_type === 'stock' ? 0 : undefined,
                price: asset.asset_type === 'stock' ? 100 : undefined,
                totalValue: 0,
                growth: 0,
                prevBalance: "0",
                defaultValue: "0"
            };

            if (mapped.asset_type === 'stock' || mapped.asset_type === 'rsu') {
                setStockAssets(prev => [...prev, mapped]);
            } else {
                setCashAccounts(prev => [...prev, mapped]);
            }
        } catch (e) {
            alert("還原失敗");
        }
    };

    // Ticker autocomplete — debounced search
    useEffect(() => {
        if (tickerSelected || tickerQuery.trim().length < 1) {
            setTickerSuggestions([]);
            setTickerDropdownOpen(false);
            return;
        }
        const timer = setTimeout(async () => {
            setTickerSearching(true);
            const results = await searchTicker(tickerQuery);
            setTickerSuggestions(results);
            setTickerDropdownOpen(results.length > 0);
            setTickerSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [tickerQuery, tickerSelected]);

    const handleTickerSelect = (suggestion: TickerSuggestion) => {
        setNewAsset(prev => ({ ...prev, ticker_symbol: suggestion.symbol }));
        setTickerQuery(`${suggestion.symbol} — ${suggestion.name}`);
        setTickerSelected(true);
        setTickerDropdownOpen(false);
        setTickerError('');
    };

    const resetTickerState = () => {
        setTickerQuery('');
        setTickerSuggestions([]);
        setTickerDropdownOpen(false);
        setTickerSelected(false);
        setTickerError('');
        setNewAsset(prev => ({ ...prev, ticker_symbol: '' }));
    };

    const handleAddAssetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Duplicate ticker check for stock/RSU assets
        if ((newAsset.asset_type === 'stock' || newAsset.asset_type === 'rsu') && newAsset.ticker_symbol) {
            const isDuplicate = await checkDuplicateTicker(newAsset.ticker_symbol, newAsset.owner);
            if (isDuplicate) {
                setTickerError(`「${newAsset.ticker_symbol}」已存在於 ${newAsset.owner} 的資產清單中，請勿重複新增。`);
                return;
            }
        }

        // Strict Demo Mode Guard
        const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

        // Keyword Check
        const isTestName = /test|測試/i.test(newAsset.title);
        if (isTestName && !isDemo) {
            const confirmSave = window.confirm("偵測到名稱包含「Test/測試」，您確定要將測試資料存入正式資料庫嗎？");
            if (!confirmSave) return;
        }

        try {
            let added: any;

            if (isDemo) {
                // In Demo mode, mock the DB response and DON'T call the server
                console.log("[DemoMode] Blocking server write for:", newAsset.title);
                added = {
                    id: crypto.randomUUID(),
                    owner: newAsset.owner,
                    asset_type: newAsset.asset_type,
                    currency: newAsset.currency
                };
                alert("【演示模式】資料僅存於本地，未寫入資料庫。");
            } else {
                added = await addNewAsset(newAsset) as any;
            }
            const mapped: any = {
                ...added,
                title: newAsset.title,
                owner: newAsset.owner,
                asset_type: newAsset.asset_type,
                currency: newAsset.currency,
                ticker_symbol: newAsset.ticker_symbol,
                ownerColor: getOwnerColor(added.owner || newAsset.owner),
                shares: newAsset.asset_type === 'stock' ? 0 : undefined,
                price: newAsset.asset_type === 'stock' ? 0 : undefined,
                totalValue: 0,
                growth: 0,
                prevBalance: "0",
                defaultValue: "0"
            };
            if (mapped.asset_type === 'stock' || mapped.asset_type === 'rsu') {
                setStockAssets(prev => [...prev, mapped]);
            } else {
                setCashAccounts(prev => [...prev, mapped]);
            }
            setIsAddModalOpen(false);
            setNewAsset({ title: '', owner: 'PY', asset_type: 'cash', currency: 'TWD', ticker_symbol: '' });
            resetTickerState();
        } catch (error) {
            alert("新增失敗");
        }
    };

    const updateStockShares = (id: string, newShares: string) => {
        setStockAssets(prev => prev.map(stock => {
            if (stock.id === id) {
                const parsedShares = parseFloat(newShares) || 0;
                // calculate new total value assuming price and fx is available
                const newTotal = parsedShares * (stock.price || 0) * (stock.fxRate || 1);

                // Keep growth as the initial market difference and do NOT recalculate it based on new shares 
                // Alternatively, if you want "live growth", compare to `parsedShares * lastPrice`, but usually Growth in UI refers to portfolio increase. Let's just adjust totalValue for MVP.

                return { ...stock, shares: parsedShares, totalValue: newTotal };
            }
            return stock;
        }));
    };

    const updateCashBalance = (id: string, newBalance: string) => {
        setCashAccounts(prev => prev.map(account => {
            if (account.id === id) {
                const numBal = parseFloat(newBalance) || 0;
                const newTotal = numBal * (account.fxRate || 1);
                return { ...account, defaultValue: newBalance, totalValue: newTotal };
            }
            return account;
        }));
    };

    useEffect(() => {
        // Set Current Period
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        setCurrentPeriod(`${year}/${month}`);

        const fetchAssetsAndSnapshot = async () => {
            setLoading(true);

            // Fetch Latest Snapshot for Period Info
            const { data: latestSnap } = await supabase
                .from('snapshots')
                .select('*')
                .not('period_name', 'like', 'ARCHIVE%')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (latestSnap) {
                setLastPeriod(latestSnap.period_name || "無名稱");

                let diffMonths = 0;
                // Try parsing period_name "YYYY/MM" first
                if (latestSnap.period_name && latestSnap.period_name.includes('/')) {
                    const parts = latestSnap.period_name.split('/');
                    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
                        const lastYear = parseInt(parts[0], 10);
                        const lastMonth = parseInt(parts[1], 10) - 1; // 0-indexed month
                        diffMonths = (now.getFullYear() - lastYear) * 12 + now.getMonth() - lastMonth;
                    }
                } else if (latestSnap.created_at) {
                    // Fallback to absolute created_at time
                    const lastDate = new Date(latestSnap.created_at);
                    diffMonths = (now.getFullYear() - lastDate.getFullYear()) * 12 + now.getMonth() - lastDate.getMonth();
                }

                setMonthsSinceLast(Math.max(0, diffMonths));
            } else {
                setLastPeriod("尚無結算紀錄");
                setMonthsSinceLast(null);
            }

            try {
                const initData = await getWizardInitData();
                const mappedData: MappedAsset[] = initData.mappedAssets.map((asset: any) => ({
                    ...asset,
                    ownerColor: getOwnerColor(asset.owner)
                }));

                setStockAssets(mappedData.filter(a => a.asset_type === 'stock' || a.asset_type === 'rsu'));
                setCashAccounts(mappedData.filter(a => a.asset_type === 'cash' || a.asset_type === 'fixed_deposit'));
            } catch (error) {
                console.error("Error fetching wizard init data:", error);
            }

            setLoading(false);
        };

        fetchAssetsAndSnapshot();
    }, []);

    const filteredStocks = stockAssets.filter(stock => activeTab === "All" || stock.owner === activeTab);
    const filteredCash = cashAccounts.filter(account => activeTab === "All" || account.owner === activeTab);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                period_name: currentPeriod,
                created_at: new Date().toISOString(),
                assets: [...stockAssets, ...cashAccounts]
            };

            const response = await fetch('/api/save-snapshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Error saving snapshot:", error);
            alert("儲存失敗，請重試！");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

            {/* Header */}
            <div className="bg-gradient-to-br from-slate-800 to-brand-600 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 flex items-center gap-2 md:gap-3">
                        <span className="text-3xl md:text-4xl">📝</span> {currentPeriod} 資產結算
                    </h1>
                    <p className="text-brand-100 font-medium opacity-90 text-sm md:text-base">
                        上一次結算：{lastPeriod} {monthsSinceLast !== null ? `(相隔 ${monthsSinceLast} 個月)` : ''}
                    </p>
                </div>

                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400 opacity-20 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>
            </div>


            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 opacity-60">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-slate-500">正在同步雲端資料庫資產清單...</p>
                </div>
            ) : (
                <>
                    {/* Owner Filter Tabs */}
                    <div className="flex flex-wrap items-center justify-center gap-2 bg-white p-1.5 md:p-2 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-fit mx-auto">
                        {['All', 'PY', 'Kigo', 'Both'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === tab
                                    ? "bg-slate-800 text-white shadow-md"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                    }`}
                            >
                                {tab === 'All' ? '全部資產' : tab}
                            </button>
                        ))}
                    </div>

                    {/* Section 1: Auto Calculated Stocks */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-slate-800">1. 投資部位 / 現金帳戶總覽</h2>
                                <span className="bg-emerald-50 text-emerald-600 text-xs px-3 py-1 rounded-full font-bold hidden md:flex items-center gap-1 border border-emerald-100">
                                    <CheckCircle2 className="w-3 h-3" />
                                    可隨時新增或移除資產
                                </span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                                <button
                                    onClick={handleOpenRestoreModal}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 md:px-4 py-2.5 md:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs md:text-sm transition-colors whitespace-nowrap"
                                >
                                    <ArchiveRestore className="w-4 h-4" />
                                    <span>還原隱藏</span>
                                </button>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 md:px-4 py-2.5 md:py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs md:text-sm transition-colors shadow-sm whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4" />
                                    新增帳戶
                                </button>
                            </div>
                        </div>

                        {filteredStocks.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                {activeTab} 沒有需要確認的投資部位。
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredStocks.map((stock) => (
                                    <div key={stock.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-800">{stock.title}</h3>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${stock.ownerColor}`}>
                                                    {stock.owner}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAsset(stock.id)}
                                                className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center border border-slate-100">
                                            <div>
                                                <div className="flex-grow">
                                                    <h3 className="font-bold text-slate-800 text-lg mb-1">
                                                        {stock.title} {stock.ticker_symbol && <span className="text-sm text-slate-400 ml-1">({stock.ticker_symbol})</span>}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={stock.shares === 0 ? '' : stock.shares}
                                                                onChange={(e) => updateStockShares(stock.id, e.target.value)}
                                                                placeholder="0"
                                                                className="bg-white border border-slate-200 rounded-md px-2 py-1 w-24 text-brand-600 font-black text-lg outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                                            />
                                                            <span className="text-xl font-black text-brand-600">股</span>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-400">@ ${stock.price?.toFixed(2) || '0.00'} {stock.currency}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-xl font-bold text-slate-700 mt-2">
                                                        = NT$ {stock.totalValue?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
                                                    </div>
                                                </div>        </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 2: Manual Cash Input */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-bold text-slate-800">2. 更新銀行餘額</h2>
                            <span className="bg-amber-50 text-amber-600 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 border border-amber-100">
                                <Wallet className="w-3 h-3" />
                                請填入今日網銀餘額
                            </span>
                        </div>

                        {filteredCash.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                {activeTab} 沒有需要填寫的現金帳戶。
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {filteredCash.map((account) => (
                                    <div key={account.id} className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">

                                        <div className="flex-grow">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-800 text-lg">{account.title}</h3>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${account.ownerColor}`}>
                                                        {account.owner}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteAsset(account.id)}
                                                    className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-md transition-colors md:hidden"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="text-sm font-medium text-slate-400 mt-1">
                                                輸入結算當下的帳戶總額
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 w-full md:w-64">
                                            <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                                                <span className="text-slate-400 font-bold mr-3">{account.currency}</span>
                                                <input
                                                    type="number"
                                                    value={account.defaultValue || ''}
                                                    onChange={(e) => updateCashBalance(account.id, e.target.value)}
                                                    placeholder="0"
                                                    className="w-full bg-transparent border-none text-xl font-black text-slate-800 text-right outline-none p-2 focus:ring-0"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteAsset(account.id)}
                                            className="hidden md:flex flex-shrink-0 text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors items-center justify-center border border-transparent hover:border-rose-100"
                                            title="移除帳戶"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Auto-calc Total Preview Box (Bonus addition for web) */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-end gap-4 mt-8">
                        <button
                            onClick={handleSave}
                            disabled={saving || saved}
                            className={`px-8 py-3 rounded-xl font-bold text-lg shadow-md transition-all flex items-center gap-2 ${saved
                                ? 'bg-brand-600 text-white shadow-brand-200'
                                : 'bg-brand-600 hover:bg-brand-700 text-white hover:-translate-y-0.5 hover:shadow-lg'
                                }`}
                        >
                            {saving ? (
                                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 儲存中...</>
                            ) : saved ? (
                                <><CheckCircle2 className="w-5 h-5" /> 已成功綁定!</>
                            ) : (
                                <>✨ 儲存 {currentPeriod} 結算並查看增長報告</>
                            )}
                        </button>
                    </div>

                    {/* Add Asset Modal */}
                    {isAddModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <Plus className="w-5 h-5 text-brand-500" /> 新增資產帳戶
                                    </h3>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddAssetSubmit} className="p-6 space-y-5 bg-slate-50/50">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">資產名稱</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="ex: 台新 Richart / 富邦證券"
                                            value={newAsset.title}
                                            onChange={e => setNewAsset(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 bg-white px-4 py-2.5 outline-none border transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">所有者</label>
                                            <select
                                                value={newAsset.owner}
                                                onChange={e => setNewAsset(prev => ({ ...prev, owner: e.target.value }))}
                                                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 bg-white px-4 py-2.5 outline-none border transition-all font-medium"
                                            >
                                                <option value="PY">PY</option>
                                                <option value="Kigo">Kigo</option>
                                                <option value="Both">Both</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">資產類型</label>
                                            <select
                                                value={newAsset.asset_type}
                                                onChange={e => setNewAsset(prev => ({ ...prev, asset_type: e.target.value }))}
                                                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 bg-white px-4 py-2.5 outline-none border transition-all font-medium"
                                            >
                                                <option value="cash">現金活存</option>
                                                <option value="fixed_deposit">定存</option>
                                                <option value="stock">股票 / ETF</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">幣別</label>
                                            <select
                                                value={newAsset.currency}
                                                onChange={e => setNewAsset(prev => ({ ...prev, currency: e.target.value }))}
                                                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 bg-white px-4 py-2.5 outline-none border transition-all font-medium"
                                            >
                                                <option value="TWD">TWD 台幣</option>
                                                <option value="USD">USD 美金</option>
                                                <option value="JPY">JPY 日幣</option>
                                            </select>
                                        </div>
                                        {(newAsset.asset_type === 'stock' || newAsset.asset_type === 'rsu') && (
                                            <div className="relative">
                                                <label className="block text-sm font-bold text-slate-700 mb-1">股票代號 (Ticker)</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="搜尋代號或公司名..."
                                                        value={tickerQuery}
                                                        onChange={e => {
                                                            setTickerQuery(e.target.value);
                                                            setTickerSelected(false);
                                                            setTickerError('');
                                                            if (!e.target.value) setNewAsset(prev => ({ ...prev, ticker_symbol: '' }));
                                                        }}
                                                        onFocus={() => setTickerDropdownOpen(true)}
                                                        className={`w-full rounded-xl border shadow-sm bg-white px-4 py-2.5 outline-none transition-all pr-8 ${tickerError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 focus:ring-2' :
                                                            'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20 focus:ring-2'
                                                            }`}
                                                        autoComplete="off"
                                                    />
                                                    {tickerSearching && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    )}
                                                    {tickerSelected && newAsset.ticker_symbol && (
                                                        <button
                                                            type="button"
                                                            onClick={resetTickerState}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Dropdown suggestions */}
                                                {tickerDropdownOpen && (tickerSearching || tickerSuggestions.length > 0 || (tickerQuery.trim().length > 0 && !tickerSearching)) && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto py-1">
                                                        {tickerSearching ? (
                                                            <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                                                                <div className="w-3 h-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                                                                搜尋中...
                                                            </div>
                                                        ) : tickerSuggestions.length > 0 ? (
                                                            tickerSuggestions.map(s => (
                                                                <button
                                                                    key={s.symbol}
                                                                    type="button"
                                                                    onClick={() => handleTickerSelect(s)}
                                                                    className="w-full text-left px-4 py-2.5 hover:bg-brand-50 flex items-center justify-between gap-2 transition-colors border-b border-slate-50 last:border-0"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-slate-800 text-sm">{s.symbol}</span>
                                                                        <span className="text-slate-400 text-[10px] leading-tight truncate max-w-[150px]">{s.name}</span>
                                                                    </div>
                                                                    <span className="text-slate-300 text-[10px] font-medium px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100 uppercase">{s.exchange}</span>
                                                                </button>
                                                            ))
                                                        ) : (tickerQuery.trim().length > 0 && !tickerSearching) && (
                                                            <div className="px-4 py-3 text-sm text-slate-400 italic">
                                                                無符合結果 (請嘗試輸入代號如 AAPL)
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Error message */}
                                                {tickerError && (
                                                    <p className="mt-1.5 text-xs font-bold text-rose-500">{tickerError}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddModalOpen(false)}
                                            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                                        >
                                            取消
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 px-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-sm shadow-slate-200"
                                        >
                                            確定新增
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Restore Hidden Asset Modal */}
                    {isRestoreModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <ArchiveRestore className="w-5 h-5 text-indigo-500" /> 管理已隱藏 / 停用的資產
                                    </h3>
                                    <button onClick={() => setIsRestoreModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto bg-slate-50/50 flex-grow">
                                    {hiddenAssets.length === 0 ? (
                                        <div className="text-center py-10 text-slate-500 font-medium bg-white rounded-2xl border border-slate-200 border-dashed">
                                            目前沒有被隱藏的資產。
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {hiddenAssets.map(asset => (
                                                <div key={asset.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-slate-800">{asset.title}</h4>
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${asset.ownerColor}`}>
                                                                {asset.owner}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                            {asset.asset_type} • {asset.currency} {asset.ticker_symbol ? `• ${asset.ticker_symbol}` : ''}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRestoreAsset(asset)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-sm transition-colors"
                                                    >
                                                        <RefreshCcw className="w-4 h-4" />
                                                        重新啟用
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
