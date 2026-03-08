"use client";

import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
    symbol: string;
}

export default function TradingViewChart({ symbol }: TradingViewChartProps) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Map symbol for TradingView
        // e.g., 2330.TW -> TWSE:2330, AAPL -> NASDAQ:AAPL
        let tvSymbol = symbol;
        if (symbol.endsWith('.TW')) {
            tvSymbol = `TWSE:${symbol.replace('.TW', '')}`;
        } else if (!symbol.includes(':')) {
            // Default to common US exchanges if not specified
            // For a more robust solution, we'd need a mapping table or search API
            // but for common stocks this often works or stays as is.
            tvSymbol = symbol;
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
