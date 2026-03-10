"use server";

import { supabase } from "@/lib/supabase";
import { Expense, ExpenseCategory, Settlement } from "@/types/expenses";

export async function getExpenses(filters?: { 
    project_label?: string, 
    goal_id?: string, 
    is_reviewed?: boolean,
    startDate?: string,
    endDate?: string
}) {
    let query = supabase
        .from('expenses')
        .select('*, categories:expense_categories(*)')
        .order('date', { ascending: false });

    if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
    }

    if (filters?.project_label && filters.project_label !== 'all') {
        query = query.eq('project_label', filters.project_label);
    }
    if (filters?.goal_id) {
        query = query.eq('goal_id', filters.goal_id);
    }
    if (filters?.is_reviewed !== undefined) {
        query = query.eq('is_reviewed', filters.is_reviewed);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Expense[];
}

export async function getCategories() {
    const { data, error } = await supabase.from('expense_categories').select('*').order('name');
    if (error) throw error;
    return data as ExpenseCategory[];
}

export async function createCategory(name: string, icon: string = 'tag', color: string = '#6b7280') {
    const { data, error } = await supabase.from('expense_categories').insert({ name, icon, color }).select().single();
    if (error) throw error;
    return data as ExpenseCategory;
}

export async function deleteCategory(id: string) {
    const { error } = await supabase.from('expense_categories').delete().eq('id', id);
    if (error) throw error;
}

export async function updateCategory(id: string, updates: Partial<ExpenseCategory>) {
    const { data, error } = await supabase.from('expense_categories').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as ExpenseCategory;
}

export async function mergeCategories(sourceId: string, targetId: string) {
    // 1. Update all expenses from source to target
    const { error: updateError } = await supabase
        .from('expenses')
        .update({ category_id: targetId })
        .eq('category_id', sourceId);
    if (updateError) throw updateError;

    // 2. Delete the source category
    const { error: deleteError } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', sourceId);
    if (deleteError) throw deleteError;
}

export async function createExpense(expense: Partial<Expense>) {
    // Ensure amount is a number and valid
    const amount = Number(expense.amount);
    if (isNaN(amount)) throw new Error("Invalid amount");
    
    // Sanitize UUIDs: convert empty strings to null
    const sanitizedExpense = {
        ...expense,
        amount,
        goal_id: expense.goal_id === '' ? null : expense.goal_id,
        category_id: expense.category_id === '' ? null : expense.category_id
    };
    
    const { data, error } = await supabase.from('expenses').insert(sanitizedExpense).select().single();
    if (error) throw error;
    return data as Expense;
}

export async function updateExpense(id: string, updates: Partial<Expense>) {
    // Sanitize UUIDs: convert empty strings to null
    const sanitizedUpdates = {
        ...updates,
        goal_id: updates.goal_id === '' ? null : updates.goal_id,
        category_id: updates.category_id === '' ? null : updates.category_id
    };

    const { data, error } = await supabase.from('expenses').update(sanitizedUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data as Expense;
}

export async function deleteExpense(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
}

export async function deleteExpenses(ids: string[]) {
    const { error } = await supabase.from('expenses').delete().in('id', ids);
    if (error) throw error;
}

export async function cleanUnreviewedExpenses() {
    const { error } = await supabase.from('expenses').delete().eq('is_reviewed', false);
    if (error) throw error;
}

export async function confirmExpenses(ids: string[], commonUpdates: Partial<Expense>) {
    const { data, error } = await supabase
        .from('expenses')
        .update({ ...commonUpdates, is_reviewed: true })
        .in('id', ids)
        .select();
    if (error) throw error;
    return data as Expense[];
}

/**
 * 分帳結算計算 (PY 視視角)
 * Balance = (PY_Credit - PY_Debit) - (Existing Settlements)
 */
export async function getSplitSettlement(project_label?: string, goal_id?: string, startDate?: string, endDate?: string) {
    // 1. Get raw expenses data
    let query = supabase.from('expenses').select('amount, paid_by, paid_for, is_reviewed');
    
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (project_label && project_label !== 'all') query = query.eq('project_label', project_label);
    if (goal_id) query = query.eq('goal_id', goal_id);

    const { data: expData, error: expError } = await query;
    if (expError) throw expError;

    let totalPYCredit = 0;
    let totalPYDebit = 0;

    expData.forEach(exp => {
        const amount = Number(exp.amount);
        if (exp.paid_by === 'PY') {
            if (exp.paid_for === 'Kigo') totalPYCredit += amount;
            else if (exp.paid_for === 'Both') totalPYCredit += amount * 0.5;
        } else if (exp.paid_by === 'Kigo') {
            if (exp.paid_for === 'PY') totalPYDebit += amount;
            else if (exp.paid_for === 'Both') totalPYDebit += amount * 0.5;
        }
    });

    // 2. Get past settlements data
    let setlQuery = supabase.from('settlements').select('amount, payer, payee');
    if (project_label && project_label !== 'all') setlQuery = setlQuery.eq('project_label', project_label);
    if (goal_id) setlQuery = setlQuery.eq('goal_id', goal_id);

    const { data: pastSetl, error: setlError } = await setlQuery;
    if (setlError) throw setlError;

    let settledAmountByPY = 0;
    let settledAmountByKigo = 0;

    pastSetl?.forEach(s => {
        if (s.payer === 'PY' && s.payee === 'Kigo') settledAmountByPY += Number(s.amount);
        if (s.payer === 'Kigo' && s.payee === 'PY') settledAmountByKigo += Number(s.amount);
    });

    const baseBalance = totalPYCredit - totalPYDebit; 
    const currentBalance = baseBalance - settledAmountByPY + settledAmountByKigo;

    return {
        py_credit: totalPYCredit,
        py_debit: totalPYDebit,
        net_balance: currentBalance,
        base_balance: baseBalance,
        settled_total: settledAmountByPY + settledAmountByKigo,
        summary: currentBalance > 0 ? "Kigo 應給付 PY" : currentBalance < 0 ? "PY 應給付 Kigo" : "雙方互不相欠",
        abs_balance: Math.abs(currentBalance)
    };
}

export async function getSettlementHistory(project_label?: string, goal_id?: string) {
    let query = supabase.from('settlements').select('*').order('settlement_date', { ascending: false });
    if (project_label && project_label !== 'all') query = query.eq('project_label', project_label);
    if (goal_id) query = query.eq('goal_id', goal_id);

    const { data, error } = await query;
    if (error) throw error;
    return data as Settlement[];
}

export async function createSettlement(settlement: Partial<Settlement>) {
    const { data, error } = await supabase.from('settlements').insert(settlement).select().single();
    if (error) throw error;
    return data as Settlement;
}

export async function createExpenses(expenses: Partial<Expense>[]) {
    // Sanitize all items
    const sanitized = expenses.map(exp => ({
        ...exp,
        amount: Math.max(0, Number(exp.amount) || 0),
        goal_id: exp.goal_id === '' ? null : exp.goal_id,
        category_id: exp.category_id === '' ? null : exp.category_id,
        is_duplicate: !!exp.is_duplicate,
        metadata: {
            ...(exp.metadata || {}),
            import_info: "AI_BULK_IMPORT"
        }
    }));
    
    const { data, error } = await supabase.from('expenses').insert(sanitized).select();
    if (error) throw error;
    return data as Expense[];
}

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI Data Import & Deduplication
 * Uses Gemini to parse text/content and check against existing expenses
 */
export async function processAIImport(content: string, type: 'text' | 'csv' | 'carrier') {
    // 1. Get existing expenses for deduplication check (recent 60 days for better coverage)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const { data: existingExpenses } = await supabase
        .from('expenses')
        .select('id, amount, date, store_name')
        .gte('date', sixtyDaysAgo.toISOString().split('T')[0]);

    // 1.5 Get categories for classification
    const { data: categories } = await supabase
        .from('expense_categories')
        .select('id, name');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 2. Construct Prompt
    const prompt = `
        You are a financial assistant. Parse the following ${type} content into a JSON array of expense objects.
        Content: "${content}"
        
        Rules for each object:
        - store_name: string (clean and consistent name)
        - amount: number (must be >= 0)
        - date: string (ISO YYYY-MM-DD)
        - category_name: string (Choose the most suitable from: ${categories?.map(c => c.name).join(', ')})
        - is_duplicate: boolean (True if a SIGNIFICANTLY SIMILAR entry exists below)
        - duplicate_id: string (The 'id' from Comparison Data if is_duplicate is true, else null)
        
        Deduplication Strategy:
        Set is_duplicate = true if you detect an entry in "Comparison Data" that represents the same transaction.
        Criteria:
        1. Exact match: Same amount AND same date AND similar brand/store.
        2. Near match: Same amount AND date within +/- 1 day AND similar brand/store.
        
        CRITICAL CONSISTENCY RULE: 
        If is_duplicate is true, you MUST use the EXACT 'store_name' from the matching entry in "Comparison Data" for your result's 'store_name'. Do not invent a new clean name if one already exists for this store in history.
        
        Comparison Data (Existing recent entries):
        ${JSON.stringify(existingExpenses)}

        Return ONLY the JSON array inside a code block.
    `;

    try {
        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        
        // Extract JSON from markdown code block
        const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("Could not find JSON array in AI response");
        
        let parsedData = JSON.parse(jsonMatch[0]);
        
        // Ensure all objects have required fields and map categories
        parsedData = parsedData.map((item: any) => {
            const matchedCategory = categories?.find(c => c.name === item.category_name);
            return {
                store_name: item.store_name || '未知商店',
                amount: Number(item.amount) || 0,
                date: item.date || new Date().toISOString().split('T')[0],
                category_id: matchedCategory?.id || null,
                is_duplicate: !!item.is_duplicate,
                metadata: { 
                    original_text: content.substring(0, 500),
                    ai_description: item.description,
                    is_duplicate_ai: !!item.is_duplicate,
                    ai_suggested_category: item.category_name,
                    duplicate_of_id: item.duplicate_id || null
                }
            };
        });
        
        return parsedData;
    } catch (err: any) {
        console.error("AI Import Error:", err);
        throw err;
    }
}
