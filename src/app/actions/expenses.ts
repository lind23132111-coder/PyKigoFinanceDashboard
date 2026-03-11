"use server";

import { supabase } from "@/lib/supabase";
import { Expense, ExpenseCategory, Settlement } from "@/types/expenses";

export async function getExpenses(filters?: {
    project_label?: string,
    goal_id?: string,
    is_reviewed?: boolean,
    startDate?: string,
    endDate?: string,
    sortBy?: string,
    sortOrder?: 'ascending' | 'descending',
    limit?: number,
    paid_for?: string
}) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        const mockExpenses = [
            // Reviewed (Current Month)
            { id: '1', date: '2026-03-05', amount: 1250, store_name: '微風超市', project_label: 'general', goal_id: null, paid_by: 'PY', paid_for: 'Both', is_reviewed: true, is_automated: true, category_id: 'cat1', categories: { name: '餐飲食品', icon: 'utensils', color: '#ef4444' } },
            { id: '2', date: '2026-03-06', amount: 4500, store_name: '宜家家居', project_label: 'general', goal_id: 'demo-goal-1', paid_by: 'Kigo', paid_for: 'Both', is_reviewed: true, is_automated: false, category_id: 'cat2', categories: { name: '居家生活', icon: 'home', color: '#3b82f6' } },
            { id: '3', date: '2026-03-08', amount: 320, store_name: '7-11', project_label: 'general', goal_id: null, paid_by: 'PY', paid_for: 'PY', is_reviewed: true, is_automated: true, category_id: 'cat1', categories: { name: '餐飲食品', icon: 'utensils', color: '#ef4444' } },
            { id: '4', date: '2026-03-09', amount: 12000, store_name: '全國電子', project_label: 'general', goal_id: null, paid_by: 'PY', paid_for: 'Kigo', is_reviewed: true, is_automated: false, category_id: 'cat3', categories: { name: '電子產品', icon: 'cpu', color: '#8b5cf6' } },
            { id: '10', date: '2026-03-10', amount: 850, store_name: '星巴克 (已確認)', project_label: 'general', goal_id: null, paid_by: 'PY', paid_for: 'Both', is_reviewed: true, is_automated: true, category_id: 'cat1', categories: { name: '餐飲食品', icon: 'utensils', color: '#ef4444' } },

            // Unreviewed (AI Inbox / Smart Input)
            { id: '5', date: '2026-03-10', amount: 500, store_name: '星巴克', project_label: 'general', goal_id: null, paid_by: 'Kigo', paid_for: 'Both', is_reviewed: false, is_automated: true, category_id: 'cat1', categories: { name: '餐飲食品', icon: 'utensils', color: '#ef4444' } },
            { id: '8', date: '2026-03-10', amount: 1580, store_name: '屈臣氏', project_label: 'general', goal_id: null, paid_by: 'PY', paid_for: 'Both', is_reviewed: false, is_automated: true, category_id: 'cat4', categories: { name: '個人護理', icon: 'heart', color: '#ec4899' } },
            { id: '9', date: '2026-03-11', amount: 890, store_name: 'Uber Eating', project_label: 'general', goal_id: null, paid_by: 'PY', paid_for: 'Both', is_reviewed: false, is_automated: true, is_duplicate: true, category_id: 'cat1', categories: { name: '餐飲食品', icon: 'utensils', color: '#ef4444' } },

            // Past Month (February) - Home Renovation Goal
            { id: '6', date: '2026-02-15', amount: 8500, store_name: '特力屋', project_label: 'general', goal_id: 'demo-goal-1', paid_by: 'PY', paid_for: 'Both', is_reviewed: true, is_automated: false, category_id: 'cat2', categories: { name: '居家生活', icon: 'home', color: '#3b82f6' } },
            { id: '7', date: '2026-02-20', amount: 1500, store_name: '無印良品', project_label: 'general', goal_id: 'demo-goal-1', paid_by: 'Kigo', paid_for: 'PY', is_reviewed: true, is_automated: true, category_id: 'cat1', categories: { name: '餐飲食品', icon: 'utensils', color: '#ef4444' } },

            // Past Month (January)
            { id: 'jan1', date: '2026-01-10', amount: 3500, store_name: '壽司郎', project_label: 'general', goal_id: null, paid_by: 'PY', paid_for: 'Both', is_reviewed: true, is_automated: false, category_id: 'cat1', categories: { name: '餐飲食品', icon: 'utensils', color: '#ef4444' } },
            { id: 'jan2', date: '2026-01-25', amount: 48000, store_name: '長榮航空', project_label: 'general', goal_id: null, paid_by: 'Kigo', paid_for: 'Both', is_reviewed: true, is_automated: false, category_id: 'cat5', categories: { name: '交通旅遊', icon: 'plane', color: '#10b981' } }
        ];

        let filtered = [...mockExpenses];

        // Filter by review status
        if (filters?.is_reviewed !== undefined) {
            filtered = filtered.filter(e => e.is_reviewed === filters.is_reviewed);
        }

        // Filter by project
        if (filters?.project_label) {
            filtered = filtered.filter(e => e.project_label === filters.project_label);
        }

        // Filter by goal
        if (filters?.goal_id) {
            filtered = filtered.filter(e => e.goal_id === filters.goal_id);
        }

        // Filter by date range
        if (filters?.startDate) {
            filtered = filtered.filter(e => e.date >= filters.startDate!);
        }
        if (filters?.endDate) {
            filtered = filtered.filter(e => e.date <= filters.endDate!);
        }
        if (filters?.paid_for && filters.paid_for !== 'Both') {
            filtered = filtered.filter(e => e.paid_for === filters.paid_for);
        }

        // Apply sorting
        const sortBy = filters?.sortBy || 'date';
        const sortOrder = filters?.sortOrder || 'descending';

        filtered.sort((a: any, b: any) => {
            const valA = a[sortBy];
            const valB = b[sortBy];
            if (valA < valB) return sortOrder === 'ascending' ? -1 : 1;
            if (valA > valB) return sortOrder === 'ascending' ? 1 : -1;
            return 0;
        });

        // Apply limit
        if (filters?.limit) {
            filtered = filtered.slice(0, filters.limit);
        }

        return filtered as any[];
    }

    let query = supabase
        .from('expenses')
        .select('*, categories:expense_categories(*)');

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
    if (filters?.paid_for && filters.paid_for !== 'Both') {
        query = query.eq('paid_for', filters.paid_for);
    }
    if (filters?.is_reviewed !== undefined) {
        query = query.eq('is_reviewed', filters.is_reviewed);
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'date';
    const sortOrder = filters?.sortOrder || 'descending';
    query = query.order(sortBy, { ascending: sortOrder === 'ascending' });

    // Apply limit
    if (filters?.limit) {
        query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Expense[];
}

export async function getCategories() {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return [
            { id: 'cat1', name: '餐飲食品', icon: 'utensils', color: '#ef4444' },
            { id: 'cat2', name: '居家生活', icon: 'home', color: '#3b82f6' },
            { id: 'cat3', name: '電子產品', icon: 'cpu', color: '#8b5cf6' },
            { id: 'cat4', name: '交通運輸', icon: 'car', color: '#10b981' }
        ] as ExpenseCategory[];
    }
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

export async function batchConfirmExpenses(ids: string[]) {
    return confirmExpenses(ids, {});
}


export async function confirmExpensesBulk(items: { id: string, updates: Partial<Expense> }[]) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return [];

    // Supabase doesn't have a built-in multiple individual-updates-in-one-query without upserting full rows
    // Since these are already in DB, we'll use a transaction via RPC or just concurrent updates for now
    // For smaller batches, concurrent updates are fine
    const results = await Promise.all(items.map(async (item) => {
        const { data, error } = await supabase
            .from('expenses')
            .update({ ...item.updates, is_reviewed: true })
            .eq('id', item.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }));
    return results;
}

/**
 * 分帳結算計算 (PY 視視角)
 * Balance = (PY_Credit - PY_Debit) - (Existing Settlements)
 */
export async function getSplitSettlement(project_label?: string, goal_id?: string, startDate?: string, endDate?: string) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        const mockExpenses = [
            { id: '1', date: '2026-03-05', amount: 1250, store_name: '微風超市', project_label: '一般帳務', paid_by: 'PY', paid_for: 'Both' },
            { id: '2', date: '2026-03-06', amount: 4500, store_name: '宜家家居', project_label: '新家裝修', paid_by: 'Kigo', paid_for: 'Both' },
            { id: '3', date: '2026-03-08', amount: 320, store_name: '7-11', project_label: '一般帳務', paid_by: 'PY', paid_for: 'PY' },
            { id: '4', date: '2026-03-09', amount: 12000, store_name: '全國電子', project_label: '一般帳務', paid_by: 'PY', paid_for: 'Kigo' },
            { id: '5', date: '2026-03-10', amount: 500, store_name: '星巴克', project_label: '一般帳務', paid_by: 'Kigo', paid_for: 'Both' },
            { id: '6', date: '2026-02-15', amount: 8500, store_name: '特力屋', project_label: '新家裝修', paid_by: 'PY', paid_for: 'Both' },
            { id: '7', date: '2026-02-20', amount: 1500, store_name: '無印良品', project_label: '新家裝修', paid_by: 'Kigo', paid_for: 'PY' }
        ];

        let filtered = mockExpenses;
        if (startDate) filtered = filtered.filter(e => e.date >= startDate);
        if (endDate) filtered = filtered.filter(e => e.date <= endDate);
        if (project_label && project_label !== 'all') filtered = filtered.filter(e => e.project_label === project_label);

        let tpC_total = 0, tpD_total = 0;

        // Demo logic: Card stats ignore ALL UI filters for persistent "debt reality"
        // Also strictly excludes unconfirmed items
        (mockExpenses as any[]).forEach(exp => {
            if (!exp.is_reviewed) return; // Ignore unreviewed

            const amount = Number(exp.amount);
            const pBy = String(exp.paid_by).toUpperCase();
            const pFor = String(exp.paid_for).toUpperCase();

            if (pBy === 'PY') {
                if (pFor === 'KIGO') tpC_total += amount;
                else if (pFor === 'BOTH') tpC_total += amount * 0.5;
            } else if (pBy === 'KIGO') {
                if (pFor === 'PY') tpD_total += amount;
                else if (pFor === 'BOTH') tpD_total += amount * 0.5;
            }
        });

        const currentBalance = tpC_total - tpD_total;
        return {
            py_credit: tpC_total,
            py_debit: tpD_total,
            net_balance: currentBalance,
            base_balance: currentBalance,
            settled_total: 0,
            summary: currentBalance > 0 ? "Kigo 應給付 PY" : currentBalance < 0 ? "PY 應給付 Kigo" : "雙方互不相欠",
            abs_balance: Math.abs(currentBalance)
        };
    }

    // 1. Get ALL-TIME raw expenses data for Net Balance
    // Optimized: We only need sums, but grouping by payer/recipient is tricky in simple select
    // For now, we fetch ONLY necessary columns to reduce payload
    let totalQuery = supabase.from('expenses').select('amount, paid_by, paid_for').eq('is_reviewed', true);
    // 1 & 2. Get ALL-TIME raw expenses and settlements in parallel
    let setlQuery = supabase.from('settlements').select('amount, payer, payee');
    if (project_label && project_label !== 'all') setlQuery = setlQuery.eq('project_label', project_label);
    if (goal_id) setlQuery = setlQuery.eq('goal_id', goal_id);

    const [expRes, setlRes] = await Promise.all([
        totalQuery,
        setlQuery
    ]);

    const { data: allExpData, error: allExpError } = expRes;
    const { data: pastSetl, error: setlError } = setlRes;

    if (allExpError) throw allExpError;
    if (setlError) throw setlError;

    let totalPYCredit_AllTime = 0;
    let totalPYDebit_AllTime = 0;

    (allExpData as any[]).forEach((exp: any) => {
        const amount = Number(exp.amount);
        const pBy = String(exp.paid_by).toUpperCase();
        const pFor = String(exp.paid_for).toUpperCase();

        if (pBy === 'PY') {
            if (pFor === 'KIGO') totalPYCredit_AllTime += amount;
            else if (pFor === 'BOTH') totalPYCredit_AllTime += amount * 0.5;
        } else if (pBy === 'KIGO') {
            if (pFor === 'PY') totalPYDebit_AllTime += amount;
            else if (pFor === 'BOTH') totalPYDebit_AllTime += amount * 0.5;
        }
    });

    let settledAmountByPY = 0;
    let settledAmountByKigo = 0;

    (pastSetl as any[])?.forEach((s: any) => {
        const payer = String(s.payer).toUpperCase();
        if (payer === 'PY') settledAmountByPY += Number(s.amount);
        if (payer === 'KIGO') settledAmountByKigo += Number(s.amount);
    });

    // 3. Card stats should be ALL-TIME and ONLY include reviewed items
    const baseBalance = totalPYCredit_AllTime - totalPYDebit_AllTime;
    const currentBalance = baseBalance + settledAmountByPY - settledAmountByKigo;

    return {
        py_credit: totalPYCredit_AllTime,
        py_debit: totalPYDebit_AllTime,
        net_balance: currentBalance,
        base_balance: baseBalance,
        settled_total: settledAmountByPY + settledAmountByKigo,
        summary: currentBalance > 0 ? "Kigo 應給付 PY" : currentBalance < 0 ? "PY 應給付 Kigo" : "雙方互不相欠",
        abs_balance: Math.abs(currentBalance)
    };
}

export async function getExpensesSummary(filters?: {
    project_label?: string,
    goal_id?: string,
    is_reviewed?: boolean,
    startDate?: string,
    endDate?: string
}) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return { total: 15600, categoryBreakdown: {} };
    }

    let query = supabase.from('expenses').select('amount, category_id, is_automated').eq('is_reviewed', true);
    if (filters?.startDate) query = query.gte('date', filters.startDate);
    if (filters?.endDate) query = query.lte('date', filters.endDate);
    if (filters?.project_label && filters.project_label !== 'all') query = query.eq('project_label', filters.project_label);
    if (filters?.goal_id) query = query.eq('goal_id', filters.goal_id);

    const { data, error } = await query;
    if (error) throw error;

    const breakdown: Record<string, number> = {};
    let total = 0;
    let count = 0;
    let automatedCount = 0;

    data.forEach(e => {
        const amt = Number(e.amount);
        total += amt;
        count++;
        if (e.is_automated) automatedCount++;
        if (e.category_id) {
            breakdown[e.category_id] = (breakdown[e.category_id] || 0) + amt;
        }
    });

    return { total, count, automatedCount, categoryBreakdown: breakdown };
}

export async function getSettlementHistory(project_label?: string, goal_id?: string) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return [
            { id: 's1', settlement_date: '2026-02-28', amount: 2500, payer: 'Kigo', payee: 'PY', project_label: '一般帳務', notes: '2月生活費結清', created_at: new Date().toISOString() }
        ] as Settlement[];
    }
    let query = supabase.from('settlements').select('*').order('settlement_date', { ascending: false });
    if (project_label && project_label !== 'all') query = query.eq('project_label', project_label);
    if (goal_id) query = query.eq('goal_id', goal_id);

    const { data, error } = await query;
    if (error) throw error;
    return data as Settlement[];
}

export async function getSettlementStatus(project_label?: string, goal_id?: string) {
    const [current, history] = await Promise.all([
        getSplitSettlement(project_label, goal_id),
        getSettlementHistory(project_label, goal_id)
    ]);
    return { current, history };
}


export async function createSettlement(settlement: Partial<Settlement>) {
    const { data, error } = await supabase.from('settlements').insert(settlement).select().single();
    if (error) throw error;
    return data as Settlement;
}

export async function updateSettlement(id: string, updates: Partial<Settlement>) {
    const { data, error } = await supabase.from('settlements').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Settlement;
}

export async function deleteSettlement(id: string) {
    const { error } = await supabase.from('settlements').delete().eq('id', id);
    if (error) throw error;
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
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return [
            { store_name: '星巴克', amount: 165, date: new Date().toISOString().split('T')[0], category_name: '餐飲美食', category_id: 'cat1', is_duplicate: false },
            { store_name: '7-11', amount: 85, date: new Date().toISOString().split('T')[0], category_name: '餐飲美食', category_id: 'cat1', is_duplicate: true }
        ];
    }
    // 1. Get existing expenses for deduplication check (recent 45 days is enough)
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    const [{ data: existingExpenses }, { data: categories }] = await Promise.all([
        supabase
            .from('expenses')
            .select('id, amount, date, store_name')
            .gte('date', fortyFiveDaysAgo.toISOString().split('T')[0]),
        supabase
            .from('expense_categories')
            .select('id, name')
    ]);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 2. Construct Simplified Prompt (Parsing Only)
    const prompt = `
        You are a financial parsing engine. Convert the following ${type} content into a JSON array of expense objects.
        Content: "${content}"
        
        Rules for each object:
        - store_name: string (clean and consistent name, e.g., "7-11" instead of "7-11 台北店")
        - amount: number (must be >= 0)
        - date: string (ISO YYYY-MM-DD)
        - category_hint: string (Suggest a category like: ${categories?.map(c => c.name).join(', ')})
        
        Return ONLY the JSON array inside a code block.
    `;

    try {
        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();

        // Extract JSON from markdown code block
        const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("Could not find JSON array in AI response");

        let parsedData = JSON.parse(jsonMatch[0]);

        // 3. Server-Side Deduplication & Categorization
        const recentHistory = existingExpenses || [];

        parsedData = parsedData.map((item: any) => {
            const amount = Math.abs(Number(item.amount)) || 0;
            const itemDate = item.date || new Date().toISOString().split('T')[0];
            const cleanName = (item.store_name || '未知商店').trim();

            // Find matching category
            const matchedCategory = categories?.find(c =>
                c.name === item.category_hint ||
                cleanName.includes(c.name)
            );

            // Deduplication Logic
            const duplicate = recentHistory.find(prev => {
                const sameAmount = Math.abs(prev.amount - amount) < 1; // Tolerance for decimals
                const sameDate = prev.date === itemDate;
                const prevName = (prev.store_name || "").toLowerCase();
                const currName = cleanName.toLowerCase();
                const similarName = prevName.includes(currName) || currName.includes(prevName);

                return sameAmount && (sameDate || similarName) && (prev.date === itemDate || Math.abs(new Date(prev.date).getTime() - new Date(itemDate).getTime()) <= 86400000);
            });

            return {
                store_name: duplicate?.store_name || cleanName, // Use historical name if duplicate
                amount,
                date: itemDate,
                category_id: matchedCategory?.id || null,
                is_duplicate: !!duplicate,
                metadata: {
                    original_text: content.substring(0, 200),
                    is_duplicate_logic: !!duplicate,
                    duplicate_of_id: duplicate?.id || null,
                    ai_suggested_category: item.category_hint
                }
            };
        });

        return parsedData;
    } catch (err: any) {
        console.error("AI Import Error:", err);
        throw err;
    }
}

/**
 * Get expense statistics for a specific period and category breakdown
 */
export async function getExpenseStats(
    startDate: string,
    endDate: string,
    project_label?: string,
    compareMode: 'month' | 'quarter' | 'year' = 'month',
    goal_id?: string,
    paid_for?: string
) {
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    if (isDemo) {
        return {
            currentMonth: {
                total: 14264,
                startDate,
                endDate,
                categories: [
                    { name: '餐飲食品', amount: 6500, color: '#ef4444' },
                    { name: '居家生活', amount: 4500, color: '#3b82f6' },
                    { name: '電子產品', amount: 12000, color: '#8b5cf6' },
                    { name: '其他', amount: 1264, color: '#94a3b8' }
                ]
            },
            prevMonth: { total: 12500 },
            allTimeTotal: 45000,
            comparison: 14.1
        };
    }

    try {
        const categories = await getCategories();
        const catMap = new Map((categories as ExpenseCategory[]).map(c => [c.id, c]));

        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        let prevStart: Date | null = null;
        let prevEnd: Date | null = null;

        if (start && end) {
            if (compareMode === 'month') {
                prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
                prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
            } else if (compareMode === 'quarter') {
                prevStart = new Date(start.getFullYear(), start.getMonth() - 3, 1);
                prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
            } else { // year
                prevStart = new Date(start.getFullYear() - 1, 0, 1);
                prevEnd = new Date(start.getFullYear() - 1, 11, 31);
            }
        }

        const prevStartStr = prevStart?.toISOString().split('T')[0];
        const prevEndStr = prevEnd?.toISOString().split('T')[0];

        // Current Period Query
        let currentQuery = supabase.from('expenses').select('amount, category_id').eq('is_reviewed', true);
        if (startDate && endDate) {
            currentQuery = currentQuery.gte('date', startDate).lte('date', endDate);
        }
        if (project_label && project_label !== 'all') currentQuery = currentQuery.eq('project_label', project_label);
        if (goal_id) currentQuery = currentQuery.eq('goal_id', goal_id);
        if (paid_for && paid_for !== 'Both') currentQuery = currentQuery.eq('paid_for', paid_for);

        // All-Time Total for Goal Progress
        let allTimeQuery = supabase.from('expenses').select('amount').eq('is_reviewed', true);
        if (project_label && project_label !== 'all') allTimeQuery = allTimeQuery.eq('project_label', project_label);
        if (goal_id) allTimeQuery = allTimeQuery.eq('goal_id', goal_id);
        if (paid_for && paid_for !== 'Both') allTimeQuery = allTimeQuery.eq('paid_for', paid_for);

        // Previous Period Query
        let prevRes: any = { data: [] };
        if (prevStartStr && prevEndStr) {
            let prevQuery = supabase.from('expenses').select('amount').gte('date', prevStartStr).lte('date', prevEndStr).eq('is_reviewed', true);
            if (project_label && project_label !== 'all') prevQuery = prevQuery.eq('project_label', project_label);
            if (goal_id) prevQuery = prevQuery.eq('goal_id', goal_id);
            if (paid_for && paid_for !== 'Both') prevQuery = prevQuery.eq('paid_for', paid_for);
            prevRes = await prevQuery;
        }

        const [currentRes, allTimeRes] = await Promise.all([
            currentQuery,
            allTimeQuery
        ]);

        const currentData = currentRes.data || [];
        const allTimeData = allTimeRes.data || [];
        const prevData = prevRes.data || [];

        const currentTotal = currentData.reduce((s: number, e: { amount: number }) => s + (Number(e.amount) || 0), 0);
        const allTimeTotal = allTimeData.reduce((s: number, e: { amount: number }) => s + (Number(e.amount) || 0), 0);
        const prevTotal = prevData.reduce((s: number, e: { amount: number }) => s + (Number(e.amount) || 0), 0);

        const categoryGroups = new Map<string, { name: string, amount: number, color: string }>();
        currentData.forEach((e: { amount: number, category_id: string }) => {
            const cat = catMap.get(e.category_id);
            const name = cat?.name || '其他';
            const color = cat?.color || '#94a3b8';
            const amount = Number(e.amount) || 0;
            const existing = categoryGroups.get(name);
            if (existing) {
                existing.amount += amount;
            } else {
                categoryGroups.set(name, { name, amount, color });
            }
        });

        const categoryStats = Array.from(categoryGroups.values()).sort((a, b) => b.amount - a.amount);
        const comparison = prevTotal === 0 ? 0 : ((currentTotal - prevTotal) / prevTotal) * 100;

        return {
            currentMonth: { total: currentTotal, startDate, endDate, categories: categoryStats, month: startDate?.slice(0, 7) || "" },
            prevMonth: { total: prevTotal },
            allTimeTotal,
            comparison: parseFloat(comparison.toFixed(1))
        };
    } catch (err: any) {
        console.error("Stats Error:", err);
        throw err;
    }
}
