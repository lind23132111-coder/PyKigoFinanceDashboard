import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { GoogleGenAI } from '@google/genai';
import { submitQuarterlySnapshot, CashInputDTO } from '@/app/actions/wizard';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const assets = payload.assets || [];

        // 1. Map UI assets to DTOs for the V2 backend logic
        const cashInputs: CashInputDTO[] = assets.map((a: any) => {
            const isStockOrRsu = a.asset_type === 'stock' || a.asset_type === 'rsu';
            return {
                asset_id: a.id,
                quantity: isStockOrRsu ? Number(a.shares || 0) : Number(a.defaultValue || 0)
            };
        });

        // 2. Submit the unified snapshot (Creates snapshot AND snapshot_records)
        const result = await submitQuarterlySnapshot(cashInputs, payload.period_name || '2026/02');

        const snapshot_id = result.snapshot_id;


        // 2. AI Summarization Integration
        let aiSummaryText = "暫無 AI 分析（請確認已設定 GEMINI_API_KEY）。";

        if (process.env.GEMINI_API_KEY) {
            try {
                // Formatting the asset list for the prompt
                const assetDetails = assets.map((a: any) =>
                    `- ${a.title} (${a.owner}): ${a.shares || 0}股 / 餘額 ${a.defaultValue || 0} ${a.currency}`
                ).join('\n');

                const prompt = `
你是一位高級家庭財務顧問。以下是我們家庭在 2026/02 結算時輸入的資產清單與餘額：

${assetDetails}

請根據這些數據，用大約 3 到 4 句話，撰寫一個繁體中文的季度財務洞察總結。
語氣要專業、正向，可以點出目前部位最多在哪裡（現金還是股票）、外幣配置，或是給予簡單的鼓勵。
不用過於沉重，重點在於讓家庭成員（PY 和 Kigo）感到這是一個健康的財務檢視。`;

                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });

                if (response.text) {
                    aiSummaryText = response.text;
                }
            } catch (aiError) {
                console.error("Gemini API Error:", aiError);
                aiSummaryText = "AI 分析生成失敗，請稍後重試。";
            }
        }

        // 3. Update the snapshot with the generated summary
        if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
            await supabase
                .from('snapshots')
                .update({ ai_summary: aiSummaryText })
                .eq('id', snapshot_id);
        }

        return NextResponse.json({ success: true, snapshot_id: snapshot_id });
    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
