"use client";

import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
    symbol: string;
}

export default function TradingViewChart({ symbol }: TradingViewChartProps) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Map symbol for TradingView
        // e.g., 2330.TW -> TWSE:2330, 006208.TWO -> TPEX:006208
        let tvSymbol = symbol.toUpperCase();

        if (tvSymbol.endsWith('.TW')) {
            tvSymbol = `TWSE:${tvSymbol.replace('.TW', '')}`;
        } else if (tvSymbol.endsWith('.TWO')) {
            tvSymbol = `TPEX:${tvSymbol.replace('.TWO', '')}`;
        } else if (tvSymbol.startsWith('TPE:')) {
            // Some systems use TPE: for listed stocks, map to TWSE
            tvSymbol = `TWSE:${tvSymbol.replace('TPE:', '')}`;
        } else if (tvSymbol.startsWith('TWO:') || tvSymbol.startsWith('TPEX:')) {
            tvSymbol = `TPEX:${tvSymbol.split(':')[1]}`;
        } else if (!tvSymbol.includes(':')) {
            // Default to common US exchanges if not specified
            // For common stocks without suffix, it works. 
            // For Taiwan users without suffix, we might want a fallback, 
            // but usually Yahoo format (.TW) is our standard.
            tvSymbol = tvSymbol;
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
