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

    return (
        <div className="tradingview-widget-container h-full w-full" ref={container}>
            <div className="tradingview-widget-container__widget h-full w-full"></div>
        </div>
    );
}
