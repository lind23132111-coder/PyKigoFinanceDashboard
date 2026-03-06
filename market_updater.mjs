import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase credentials from process.env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchYahooPrice(ticker) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice;
}

async function main() {
    console.log("Fetching active stock/RSU tickers from Supabase...");

    // Get active stock & RSU tickers from assets table
    const { data: assets, error } = await supabase
        .from('assets')
        .select('ticker_symbol')
        .in('asset_type', ['stock', 'rsu'])
        .eq('is_active', true);

    if (error) {
        console.error("Error fetching assets:", error);
        return;
    }

    let tickers = assets.map(a => a.ticker_symbol).filter(Boolean);
    tickers = [...new Set(tickers)]; // deduplicate

    console.log(`Found tickers: ${tickers.join(', ')}`);

    const updates = [];

    for (const ticker of tickers) {
        try {
            let yfTicker = ticker;
            if (yfTicker.startsWith('TPE:')) {
                yfTicker = yfTicker.replace('TPE:', '') + '.TW';
            } else if (yfTicker.startsWith('NASDAQ:')) {
                yfTicker = yfTicker.replace('NASDAQ:', '');
            } else if (yfTicker.startsWith('NYSE:')) {
                yfTicker = yfTicker.replace('NYSE:', '');
            }

            console.log(`Fetching price for ${yfTicker}...`);
            const price = await fetchYahooPrice(yfTicker);

            if (price !== undefined && price !== null) {
                updates.push({
                    symbol: ticker,
                    price: price,
                    updated_at: new Date().toISOString()
                });
                console.log(`Fetched ${ticker} (${yfTicker}): ${price}`);
            } else {
                console.log(`No price found for ${ticker}`);
            }
        } catch (err) {
            console.error(`Error fetching ${ticker}:`, err.message);
        }
    }

    console.log("Fetching FX rates online...");
    try {
        const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
        const fxData = await fxRes.json();
        const usdTwd = fxData.rates.TWD;
        const usdJpy = fxData.rates.JPY;
        const jpyTwd = usdTwd / usdJpy;

        updates.push({
            symbol: 'USD/TWD',
            price: usdTwd,
            updated_at: new Date().toISOString()
        });

        updates.push({
            symbol: 'JPY/TWD',
            price: jpyTwd,
            updated_at: new Date().toISOString()
        });
        console.log(`Fetched FX: USD/TWD=${usdTwd}, JPY/TWD=${jpyTwd}`);
    } catch (err) {
        console.error("Error fetching FX rates:", err);
    }

    if (updates.length > 0) {
        console.log(`Upserting ${updates.length} rows to market_cache...`);
        const { error: upsertErr } = await supabase
            .from('market_cache')
            .upsert(updates, { onConflict: 'symbol' });

        if (upsertErr) {
            console.error("Error upserting to market_cache:", upsertErr);
        } else {
            console.log("Successfully updated all prices in Supabase.");
        }
    } else {
        console.log("No updates to make.");
    }
}

main();
