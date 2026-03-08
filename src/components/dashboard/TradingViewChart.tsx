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

        // 1. Handle Known Suffixes (Yahoo Finance style)
        if (tvSymbol.endsWith('.TW')) {
            tvSymbol = `TWSE:${tvSymbol.replace('.TW', '')}`;
        } else if (tvSymbol.endsWith('.TWO')) {
            tvSymbol = `TPEX:${tvSymbol.replace('.TWO', '')}`;
        }
        // 2. Handle Known Prefixes (Sometimes used in DB)
        else if (tvSymbol.startsWith('TPE:')) {
            // TPE: usually refers to Listed (TWSE) in many local datasets
            tvSymbol = `TWSE:${tvSymbol.replace('TPE:', '')}`;
        } else if (tvSymbol.startsWith('TWO:') || tvSymbol.startsWith('TPEX:')) {
            tvSymbol = `TPEX:${tvSymbol.includes(':') ? tvSymbol.split(':')[1] : tvSymbol}`;
        }
        // 3. Special Case for ETFs or Numeric strings without prefix
        else if (/^\d{4,6}[A-Z]{0,1}$/.test(tvSymbol)) {
            // If it's pure numeric (00688L), default to TWSE as a guess for Taiwan users
            tvSymbol = `TWSE:${tvSymbol}`;
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
    }, [symbol]);

    return (
        <div className="tradingview-widget-container h-full w-full" ref={container}>
            <div className="tradingview-widget-container__widget h-full w-full"></div>
        </div>
    );
}
