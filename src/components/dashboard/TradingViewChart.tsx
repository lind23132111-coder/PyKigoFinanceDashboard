"use client";

import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
    symbol: string;
}

export default function TradingViewChart({ symbol }: TradingViewChartProps) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Map symbol for TradingView
        // e.g., 2330.TW -> TWSE:2330, 006208.TWO -> TPEX:006208, TPE:0050 -> TWSE:0050
        let tvSymbol = symbol.toUpperCase().trim();
        let ticker = tvSymbol.includes(':') ? tvSymbol.split(':')[1] : tvSymbol;

        // 1. Differentiate TWSE vs TPEX (Critical for Taiwan)
        // Most Bond ETFs (ending in B) and specific OTC stocks are on TPEX
        const isTPEx = ticker.endsWith('.TWO') ||
            ticker.endsWith('B') ||
            ['8069', '8299', '5483', '6488'].includes(ticker); // Common OTC

        if (tvSymbol.endsWith('.TW')) {
            tvSymbol = `TWSE:${ticker.replace('.TW', '')}`;
        } else if (tvSymbol.endsWith('.TWO')) {
            tvSymbol = `TPEX:${ticker.replace('.TWO', '')}`;
        } else if (tvSymbol.startsWith('TPE:')) {
            // TPE: could be TWSE or TPEX. Map based on our check.
            tvSymbol = `${isTPEx ? 'TPEX' : 'TWSE'}:${ticker}`;
        } else if (tvSymbol.startsWith('TPEX:') || tvSymbol.startsWith('TWO:')) {
            tvSymbol = `TPEX:${ticker}`;
        } else if (/^\d{4,6}[A-Z]{0,1}$/.test(tvSymbol)) {
            // Numeric only - guess based on pattern
            tvSymbol = `${isTPEx ? 'TPEX' : 'TWSE'}:${tvSymbol}`;
        }

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": tvSymbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "zh_TW",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "hide_side_toolbar": true,
            "hide_top_toolbar": false,
            "calendar": false,
            "support_host": "https://www.tradingview.com"
        });

        // ... existing symbol mapping ...
        if (container.current) {
            container.current.innerHTML = "";
            container.current.appendChild(script);
        }

        return () => {
            if (container.current) {
                container.current.innerHTML = "";
            }
        };
    }, [symbol]);

    // Check if it's TWSE restricted
    const isTWSE = symbol.includes('TWSE') ||
        (symbol.startsWith('00') && !symbol.endsWith('B') && !symbol.includes('TWO')) ||
        (symbol.length === 4 && !['8069', '8299', '5483', '6488'].includes(symbol) && !symbol.includes(':'));

    return (
        <div className="tradingview-widget-container h-full w-full relative" ref={container}>
            <div className="tradingview-widget-container__widget h-full w-full"></div>

            {/* Restriction Warning Overlay (Subtle) */}
            {symbol.startsWith('TPE:') && !symbol.endsWith('B') && (
                <div className="absolute top-24 left-0 right-0 z-10 px-12 pointer-events-none">
                    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-4 rounded-xl shadow-2xl pointer-events-auto">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1 bg-amber-500/20 rounded">
                                <span className="text-amber-500 text-xs font-bold">⚠️ 數據受限</span>
                            </div>
                            <span className="text-white/80 text-[11px] font-bold">部分台股上市標的無法直接顯示線圖</span>
                        </div>
                        <p className="text-white/40 text-[10px] leading-relaxed mb-3">
                            TradingView 元件限制「上市」標的 (TWSE) 僅能於官網瀏覽。若下方顯示錯誤或導向 Apple (AAPL)，請點擊右上方或下方按鈕開啟。
                        </p>
                        <a
                            href={`https://www.tradingview.com/chart/?symbol=TWSE:${symbol.split(':')[1] || symbol}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[10px] font-black transition-all shadow-xl shadow-brand-500/20 shadow-lg active:scale-95"
                        >
                            前往 TradingView 觀看完整數據
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
