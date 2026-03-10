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
    limit?: number
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
    if (project_label && project_label !== 'all') totalQuery = totalQuery.eq('project_label', project_label);
    if (goal_id) totalQuery = totalQuery.eq('goal_id', goal_id);

    const { data: allExpData, error: allExpError } = await totalQuery;
    if (allExpError) throw allExpError;

    let totalPYCredit_AllTime = 0;
    let totalPYDebit_AllTime = 0;

    allExpData.forEach(exp => {
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

    // 2. Get all settlements data (lifetime)
    let setlQuery = supabase.from('settlements').select('amount, payer, payee');
    if (project_label && project_label !== 'all') setlQuery = setlQuery.eq('project_label', project_label);
    if (goal_id) setlQuery = setlQuery.eq('goal_id', goal_id);

    const { data: pastSetl, error: setlError } = await setlQuery;
    if (setlError) throw setlError;

    let settledAmountByPY = 0;
    let settledAmountByKigo = 0;

    pastSetl?.forEach(s => {
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
