import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { parse } from 'csv-parse';
import * as path from 'path';

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define CSV structure
interface CsvRow {
    PIC: string;            // PY, Kigo, Both
    類型: string;             // 活存, 定存, 股票
    名稱: string;           // Asset Title
    數量: string;             // Quantity
    attribute: string;      // cash or ticker
    金額: string;             // Amount
    幣別: string;             // Currency
    NTD: string;            // Total TWD (e.g., "NT$850,000.00")
    更新時間: string;         // Snapshot period e.g., "2023/11"
    股價: string;             // Unit price
    匯率: string;             // FX rate
}

async function main() {
    console.log('Starting CSV Import...');
    const csvFilePath = path.resolve(process.cwd(), 'data.csv');

    if (!fs.existsSync(csvFilePath)) {
        console.error(`CSV file not found at ${csvFilePath}`);
        process.exit(1);
    }

    // Parse CSV
    const parser = fs.createReadStream(csvFilePath).pipe(
        parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
        })
    );

    const rows: CsvRow[] = [];
    for await (const record of parser) {
        rows.push(record);
    }

    console.log(`Parsed ${rows.length} rows from CSV.`);

    // 1. Collect unique snapshot periods
    const periods = [...new Set(rows.map(r => r.更新時間))];
    console.log(`Found ${periods.length} unique snapshot periods:`, periods);

    // Map to store period strings to snapshot UUIDs
    const snapshotMap: Record<string, string> = {};

    for (const period of periods) {
        // Generate dates based on format like "2023/11"
        const [year, month] = period.split('/');
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        // Approximate end date for simplicity (1st of next month minus 1 day, or simplify to last day typically 28-31)
        const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

        // Check if snapshot exists
        let { data: existingSnapshot } = await supabase
            .from('snapshots')
            .select('id')
            .eq('period_name', period)
            .single();

        if (existingSnapshot) {
            console.log(`Snapshot [${period}] exists: ${existingSnapshot.id}`);
            snapshotMap[period] = existingSnapshot.id;
        } else {
            const { data: newSnapshot, error } = await supabase
                .from('snapshots')
                .insert({
                    period_name: period,
                    start_date: startDate,
                    end_date: endDate,
                    notes: 'Imported from historical CSV'
                })
                .select()
                .single();

            if (error) {
                console.error(`Failed to create snapshot for ${period}:`, error);
                continue;
            }
            console.log(`Created Snapshot [${period}]: ${newSnapshot.id}`);
            snapshotMap[period] = newSnapshot.id;
        }
    }

    // 2. Identify unique assets based on Owner, Title, Currency, and Type
    // Let's create a composite key: Owner_Title_Currency
    const assetMap: Record<string, string> = {}; // key: PY_渣打_TWD -> uuid

    for (const row of rows) {
        const owner = row.PIC;
        const title = row.名稱;
        const currency = row.幣別;
        let assetType = 'cash';
        let tickerSymbol = null;

        if (row.類型 === '股票') {
            // Determine if RSU or stock
            if (title.toUpperCase().includes('RSU') || title.toUpperCase().includes('ESPP')) {
                assetType = 'rsu';
            } else {
                assetType = 'stock';
            }
            tickerSymbol = row.attribute === 'cash' ? null : row.attribute;
        } else if (row.類型 === '定存') {
            assetType = 'fixed_deposit';
        }

        const uniqueKey = `${owner}_${title}_${currency}_${assetType}`;

        if (!assetMap[uniqueKey]) {
            // Check if it already exists in DB
            let { data: existingAsset } = await supabase
                .from('assets')
                .select('id')
                .eq('owner', owner)
                .eq('title', title)
                .eq('currency', currency)
                .eq('asset_type', assetType)
                .single();

            if (existingAsset) {
                assetMap[uniqueKey] = existingAsset.id;
            } else {
                // Insert new asset
                console.log(`Creating new asset: ${uniqueKey}`);
                const { data: newAsset, error } = await supabase
                    .from('assets')
                    .insert({
                        owner,
                        title,
                        asset_type: assetType,
                        currency,
                        ticker_symbol: tickerSymbol,
                        is_active: true
                    })
                    .select()
                    .single();

                if (error) {
                    console.error(`Failed to create asset ${uniqueKey}:`, error);
                } else {
                    assetMap[uniqueKey] = newAsset.id;
                }
            }
        }
    }

    // 3. Insert Snapshot Records
    let recordsInserted = 0;
    const recordsToInsert = [];

    console.log(`Preparing ${rows.length} records for insertion...`);
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const period = row.更新時間;
        const snapshotId = snapshotMap[period];

        // Determine asset Type to get the ID
        let assetType = 'cash';
        if (row.類型 === '股票') {
            if (row.名稱.toUpperCase().includes('RSU') || row.名稱.toUpperCase().includes('ESPP')) {
                assetType = 'rsu';
            } else {
                assetType = 'stock';
            }
        } else if (row.類型 === '定存') {
            assetType = 'fixed_deposit';
        }
        const uniqueKey = `${row.PIC}_${row.名稱}_${row.幣別}_${assetType}`;
        const assetId = assetMap[uniqueKey];

        if (!snapshotId || !assetId) {
            console.error(`Skipping row ${i + 1} due to missing reference - Snapshot: ${snapshotId}, Asset: ${assetId} for ${uniqueKey}`);
            continue;
        }

        // Parse numeric values
        // Remove "NT$", commas, etc.
        const rawNTD = row.NTD.replace(/[^0-9.-]+/g, "");
        let totalTwdValue = parseFloat(rawNTD);
        if (isNaN(totalTwdValue)) {
            // If NA or missing, calculate it
            const qty = parseFloat(row.數量.replace(/,/g, '')) || 0;
            const price = parseFloat(row.股價) || 1;
            const fx = parseFloat(row.匯率) || 1;
            totalTwdValue = qty * price * fx;
        }

        let quantity = parseFloat(row.數量.replace(/,/g, '')) || 0;

        // For unit price and fx rate
        let unitPrice = null;
        if (row.股價 && !isNaN(parseFloat(row.股價))) {
            unitPrice = parseFloat(row.股價);
        } else if (assetType !== 'cash' && assetType !== 'fixed_deposit') {
            // for NA prices if stock, we try to derive it or let it be null. But if totalTwd is valid:
            if (quantity > 0 && !isNaN(totalTwdValue)) {
                unitPrice = (totalTwdValue / quantity) / (parseFloat(row.匯率) || 1);
            }
        }

        let fxRate = 1;
        if (row.匯率 && !isNaN(parseFloat(row.匯率))) {
            fxRate = parseFloat(row.匯率);
        } else if (row.幣別 !== 'TWD') {
            // try to calculate fx if missing
            if (quantity > 0 && totalTwdValue > 0 && (assetType === 'cash' || assetType === 'fixed_deposit')) {
                fxRate = totalTwdValue / quantity;
            }
        }

        recordsToInsert.push({
            snapshot_id: snapshotId,
            asset_id: assetId,
            quantity,
            unit_price: unitPrice,
            fx_rate: fxRate,
            total_twd_value: totalTwdValue
        });
    }

    if (recordsToInsert.length > 0) {
        console.log(`Executing batch insert for ${recordsToInsert.length} records to Supabase...`);
        const BATCH_SIZE = 20;

        for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
            const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
            console.log(`-> Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(recordsToInsert.length / BATCH_SIZE)} (Records ${i + 1} to ${Math.min(i + BATCH_SIZE, recordsToInsert.length)})...`);

            const { error: batchError } = await supabase
                .from('snapshot_records')
                .insert(batch);

            if (batchError) {
                console.error(`❌ Failed to insert batch ${Math.floor(i / BATCH_SIZE) + 1}:`, batchError);
                // We don't break, maybe it's just one row error
            } else {
                recordsInserted += batch.length;
            }
        }
        console.log('✅ All batch inserts completed!');
    } else {
        console.log('No valid records to insert.');
    }

    console.log(`\nImport complete! Inserted ${recordsInserted} snapshot records.`);
}

main().catch(console.error);
