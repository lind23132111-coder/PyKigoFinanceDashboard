export interface Expense {
    id: string;
    date: string; // YYYY-MM-DD
    store_name: string;
    amount: number;
    currency: string;
    category_id?: string;
    project_label: string;
    goal_id?: string;
    paid_by: string;   // 'PY', 'Kigo'
    paid_for: string;  // 'Both', 'PY', 'Kigo'
    is_reviewed: boolean;
    is_automated: boolean;
    is_duplicate: boolean;
    einvoice_id?: string;
    metadata?: any;
    categories?: ExpenseCategory;
    created_at: string;
}

export interface ExpenseCategory {
    id: string;
    name: string;
    icon?: string;
    color?: string;
}

export interface AASettlement {
    total_py_paid: number;
    total_kigo_paid: number;
    py_owes_kigo: number;
    kigo_owes_py: number;
    net_settlement: {
        from: string;
        to: string;
        amount: number;
    };
}
export interface Settlement {
    id: string;
    settlement_date: string;
    amount: number;
    payer: string;   // 'PY', 'Kigo'
    payee: string;   // 'PY', 'Kigo'
    project_label: string;
    goal_id?: string;
    notes?: string;
    created_at: string;
}
