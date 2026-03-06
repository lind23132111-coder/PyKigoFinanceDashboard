"use client";

import React from "react";
import { Sparkles, Send } from "lucide-react";

interface AIInsightSectionProps {
    latestSummary: string;
    feedbackText: string;
    setFeedbackText: (text: string) => void;
    handleRegenerate: () => void;
    isRegenerating: boolean;
}

export const AIInsightSection: React.FC<AIInsightSectionProps> = ({
    latestSummary,
    feedbackText,
    setFeedbackText,
    handleRegenerate,
    isRegenerating
}) => {
    const isLoading = latestSummary.includes('正在為您產生') || latestSummary.includes('載入最新的財務數據');

    return (
        <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm text-brand-600 mt-1">
                <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 w-full">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    AI Summary Insight
                </h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed whitespace-pre-line min-h-[40px]">
                    {latestSummary}
                </p>
                <div className="mt-3 flex gap-2 relative">
                    <input
                        type="text"
                        placeholder="給 AI 一些建議，例如：請短一點、多關注股票..."
                        className="text-xs px-3 py-1.5 rounded-lg border border-brand-200 bg-white shadow-sm flex-1 outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-700"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
                        disabled={isRegenerating || isLoading}
                    />
                    <button
                        onClick={handleRegenerate}
                        disabled={isRegenerating || !feedbackText.trim() || isLoading}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRegenerating ? <span className="animate-pulse text-xs">生成中...</span> : <><Send className="w-3 h-3" /> 重新生成</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
