export interface Asset {
    id: string;
    title: string;
    owner: 'PY' | 'Kigo' | 'Both';
    asset_type: 'cash' | 'stock' | 'fixed_deposit' | 'rsu';
    currency: 'TWD' | 'USD' | 'JPY';
    ticker_symbol?: string;
}

export interface Snapshot {
    id: string;
    period_name: string;
    created_at: string;
    ai_summary?: string;
}

export interface SnapshotRecord {
    id: string;
    snapshot_id: string;
    asset_id: string;
    amount: number;
    price: number;
    total_twd_value: number;
    assets?: Asset; // Joined asset data
}

export interface PieChartItem {
    name: string;
    value: number;
    raw_value: number;
    color: string;
    originalKey: string;
}

export interface TrendChartItem {
    id: string;
    name: string;
    fullAssets: number;
    filteredAssets: number;
    color: string;
}

export interface SnapshotDetail {
    period_name: string;
    totalNetWorth: number;
    rawRecords: SnapshotRecord[];
    currencyData: PieChartItem[];
    allocationData: PieChartItem[];
    ownershipData: PieChartItem[];
    trendData?: TrendChartItem[];
}

export interface DashboardData {
    totalNetWorth: number;
    currencyData: PieChartItem[];
    allocationData: PieChartItem[];
    ownershipData: PieChartItem[];
    trendData: TrendChartItem[];
    latestSnapshot: Snapshot | null;
    snapshotDetails: Record<string, SnapshotDetail>;
    rawRecords: SnapshotRecord[];
}

export interface StrategyTarget {
    category: string;
    target_percentage: number;
    current_percentage?: number;
    color: string;
}

export interface ProjectedDividend {
    year: number;
    amount: number;
}

export interface StrategyNote {
    id: string;
    ticker_symbol: string;
    note_content: string;
    target_buy_price: number | null;
    target_sell_price: number | null;
    confidence_level: number;
    updated_at: string;
}
