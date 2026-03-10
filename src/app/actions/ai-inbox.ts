"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Expense } from "@/types/expenses";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function parseInvoice(input: string | Buffer, isImage: boolean = false): Promise<Partial<Expense>> {
    const prompt = `
        你是一個專業的財務數據解析器。請解析提供的發票/收據資訊，並將其轉換為 JSON 格式。
        請包含以下欄位：
        - store_name: 店家名稱
        - amount: 數字金額
        - date: 格式為 YYYY-MM-DD
        - currency: 貨幣代碼（預設 TWD）
        - category_suggestion: 建議的類別名稱（如：餐飲外食、日常採買、育兒用品、裝潢工程、軟裝家具、交通機票、水電瓦斯）
        - project_label_suggestion: 判定此支出是否屬於特定計畫。如果是裝修相關請回傳 'new_home'，否則回傳 'general'。
        - einvoice_id: 如果有發票號碼請回傳，否則為空。

        請只回傳 JSON 字串。
    `;

    try {
        let result;
        if (isImage) {
            result = await model.generateContent([prompt, { inlineData: { data: input.toString('base64'), mimeType: "image/jpeg" } }]);
        } else {
            result = await model.generateContent([prompt, input as string]);
        }

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return {
                store_name: data.store_name,
                amount: Number(data.amount),
                date: data.date,
                currency: data.currency || 'TWD',
                einvoice_id: data.einvoice_id || null,
                project_label: data.project_label_suggestion || 'general',
                is_reviewed: false,
                is_automated: true,
                metadata: { ai_parsed: true, raw_suggestion: data }
            };
        }
    } catch (error) {
        console.error("AI Invoice Parsing failed:", error);
    }
    
    return {};
}
