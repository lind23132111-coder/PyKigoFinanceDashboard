import { getSplitSettlement } from '../src/app/actions/expenses.ts'
import 'dotenv/config'

// Mock environment variables for local script execution if needed, 
// though the function uses the imported supabase client which should be configured.

async function verifyFix() {
    console.log("Verifying Split Settlement Fix...")
    
    // Testing with a specific month that has unreviewed items
    const startDate = '2026-03-01'
    const endDate = '2026-03-31'
    
    try {
        const result = await getSplitSettlement(undefined, undefined, startDate, endDate)
        console.log("Result for March 2026:")
        console.log(JSON.stringify(result, null, 2))
        
        // Manual calculation from previous dump:
        // Confirmed Credits (All Time): 85540
        // Confirmed Debits (All Time): 23750
        // Settled By PY: 17768
        // Settled By Kigo: 1200
        // Base Balance: 61790
        // Net Balance: 61790 - 17768 + 1200 = 45222
        
        console.log("\nVerification Check:")
        if (result.net_balance === 45222) {
            console.log("✅ Net Balance matches expected (45222). Unreviewed items excluded.")
        } else {
            console.log("❌ Net Balance mismatch. Expected 45222, got " + result.net_balance)
        }
        
        // Check period credits
        // In March (from dump): 
        // 2026-03-05: PY 1250 (Half) -> 625
        // 2024-03-10: PY 150 (Half) -> 75 (Wait, this is 2024)
        // 2026-03-08: PY 320 (Full) -> Wait, 320 was paid_for: PY? Let's check dump.
        
        console.log("\nPeriod Stats (March 2026):")
        console.log(`PY Credit: ${result.py_credit}`)
        console.log(`PY Debit: ${result.py_debit}`)
        
    } catch (e) {
        console.error("Error during verification:", e)
    }
}

verifyFix()
