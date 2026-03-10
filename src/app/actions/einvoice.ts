"use server";

import { supabase } from "@/lib/supabase";
import { Expense } from "@/types/expenses";

export async function reconcileAndSaveExpenses(einvoices: any[]) {
    const results = [];
    
    for (const inv of einvoices) {
        // 1. Check for duplicates
        const { data: existing } = await supabase
            .from('expenses')
            .select('id')
            .eq('einvoice_id', inv.invNum)
            .maybeSingle();

        if (existing) continue;

        // 2. Draft expense object
        const newExpense: Partial<Expense> = {
            store_name: inv.sellerName,
            amount: inv.amount,
            date: inv.date,
            einvoice_id: inv.invNum,
            is_automated: true,
            is_reviewed: false, // For Inbox flow
            project_label: inv.sellerName.includes("宜家") || inv.sellerName.includes("特力屋") ? 'new_home' : 'general',
            metadata: { source: 'mof_api', raw: inv }
        };

        // 3. Save
        const { data, error } = await supabase.from('expenses').insert(newExpense).select().single();
        if (!error && data) results.push(data);
    }

    return results;
}
