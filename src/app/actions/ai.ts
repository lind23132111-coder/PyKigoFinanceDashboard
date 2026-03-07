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

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const { data: previousFeedback } = await supabase
            .from('ai_summary_feedback').select('user_prompt, ai_response')
            .order('created_at', { ascending: false }).limit(3);

        let historyContext = "";
        if (previousFeedback && previousFeedback.length > 0) {
            historyContext = "\n\n過往的調整指示與回應紀錄（請參考這些風格與要求）：\n" +
                previousFeedback.reverse().map((f: any) => `使用者要求：${f.user_prompt}\n你的回應：${f.ai_response}`).join('\n\n');
        }

        let newFeedbackContext = "";
        if (userFeedback) {
            newFeedbackContext = `\n\n這一次，使用者提出了新的要求與回饋，請務必按照這個指示重新撰寫：\n「${userFeedback}」`;
        }

        const prompt = `
作為一名專業的家庭財務顧問，這是一個家庭的即時財務狀況分析：

總資產淨值：約 ${Math.round((dashboardData.totalNetWorth || 0) / 10000)}萬 台幣
各幣別比例：${(dashboardData.currencyData || []).map((d: any) => `${d.name} ${d.value}%`).join(', ')}
資產配置：${(dashboardData.allocationData || []).map((d: any) => `${d.name} ${d.value}%`).join(', ')}
成員佔比：${(dashboardData.ownershipData || []).map((d: any) => `${d.name} ${d.value}%`).join(', ')}
${historyContext}${newFeedbackContext}
請給出一到兩句簡短、專業且具洞察力的財務總結與建議。不要囉嗦，字數預設控制在 60 字以內 (除非使用者有別的要求)，語氣要像是專業私人顧問。`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        const newSummary = response.text || "⚠️ AI 沒有回傳任何訊息。";

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
