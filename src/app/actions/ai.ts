"use server";

import { supabase } from "@/utils/supabase/client";
import { GoogleGenAI } from "@google/genai";

// ─────────────────────────────────────────────────────────────────
// DEMO MODE MOCK DATA
// Toggle by setting NEXT_PUBLIC_DEMO_MODE=true in .env.local
// ─────────────────────────────────────────────────────────────────
const DEMO_AI_SUMMARY = "您的資產配置目前相當穩健。美金資產佔比達 68%，能在匯率波動中提供良好的對沖。建議繼續關注「夢想度假屋」目標的進度，目前已達成 50%，進度符合預期。";

// ─────────────────────────────────────────────────────────────────
// LIVE DATA FUNCTIONS
// ─────────────────────────────────────────────────────────────────
export async function generateLiveAISummary(dashboardData: any, userFeedback?: string): Promise<string> {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_AI_SUMMARY;

    // 1. Check for existing summary if no feedback is provided (Cache hit)
    if (!userFeedback && dashboardData.latestSnapshot?.ai_summary) {
        return dashboardData.latestSnapshot.ai_summary;
    }

    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_key_here') {
            return "⚠️ Gemini API Key 未設定，無法產生即時 AI 洞察。請在 .env 中設定 GEMINI_API_KEY。";
        }

        const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const newSummary = response.text() || "⚠️ AI 沒有回傳任何訊息。";

        // 2. Save result back to snapshot as the primary summary (Cache update)
        if (newSummary && !newSummary.startsWith("⚠️") && dashboardData.latestSnapshot?.id) {
            await supabase
                .from('snapshots')
                .update({ ai_summary: newSummary })
                .eq('id', dashboardData.latestSnapshot.id);
        }

        // 3. Log interaction to DB if user provided feedback
        if (userFeedback && newSummary && !newSummary.startsWith("⚠️")) {
            await supabase.from('ai_summary_feedback').insert({
                snapshot_id: dashboardData.latestSnapshot?.id || null,
                user_prompt: userFeedback,
                ai_response: newSummary
            });
        }

        return newSummary;
    } catch (err) {
        console.error("AI generation failed:", err);
        return "⚠️ AI 洞察產生失敗，請稍後再試。";
    }
}
