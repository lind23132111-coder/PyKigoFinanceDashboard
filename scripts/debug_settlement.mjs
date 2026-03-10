import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qaniibhydovvhtuvxuqc.supabase.co'
const supabaseAnonKey = 'sb_publishable_iNW6xDVD4-MCv6I7dvUT6Q_bDyjqRcW'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugSettlement() {
  console.log('--- Expenses (Confirmed) ---')
  const { data: expenses, error: expError } = await supabase
    .from('expenses')
    .select('id, store_name, amount, paid_by, paid_for, is_reviewed, date')
    .eq('is_reviewed', true)
    .order('date', { ascending: false })
    .limit(50)

  if (expError) console.error(expError)
  else {
    let pyCredit = 0;
    let pyDebit = 0;
    expenses.forEach(e => {
        const amt = Number(e.amount)
        if (e.paid_by === 'PY') {
            if (e.paid_for === 'Kigo') {
                pyCredit += amt
                console.log(`[PY Credit Full] ${e.date} ${e.store_name}: ${amt}`)
            }
            else if (e.paid_for === 'Both') {
                pyCredit += amt * 0.5
                console.log(`[PY Credit Half] ${e.date} ${e.store_name}: ${amt} -> ${amt * 0.5}`)
            }
        } else if (e.paid_by === 'Kigo') {
            if (e.paid_for === 'PY') {
                pyDebit += amt
                console.log(`[PY Debit Full] ${e.date} ${e.store_name}: ${amt}`)
            }
            else if (e.paid_for === 'Both') {
                pyDebit += amt * 0.5
                console.log(`[PY Debit Half] ${e.date} ${e.store_name}: ${amt} -> ${amt * 0.5}`)
            }
        }
    })
    console.log(`Total PY Credit: ${pyCredit}`)
    console.log(`Total PY Debit: ${pyDebit}`)
    console.log(`Base Balance: ${pyCredit - pyDebit}`)
  }

  console.log('\n--- Settlements ---')
  const { data: settlements, error: setlError } = await supabase
    .from('settlements')
    .select('*')

  if (setlError) console.error(setlError)
  else {
    let settledByPY = 0
    let settledByKigo = 0
    settlements.forEach(s => {
        if (s.payer === 'PY') settledByPY += Number(s.amount)
        if (s.payer === 'Kigo') settledByKigo += Number(s.amount)
        console.log(`[Settlement] ${s.settlement_date}: ${s.payer} -> ${s.payee} amount: ${s.amount}`)
    })
    console.log(`Total Settled by PY: ${settledByPY}`)
    console.log(`Total Settled by Kigo: ${settledByKigo}`)
  }
  
  console.log('\n--- Expenses (Unreviewed) ---')
  const { data: unreviewed } = await supabase
    .from('expenses')
    .select('store_name, amount, paid_by, paid_for')
    .eq('is_reviewed', false)
  
  if (unreviewed && unreviewed.length > 0) {
      console.log(`Found ${unreviewed.length} unreviewed items. These MIGHT be affecting calculation if not filtered.`)
      unreviewed.forEach(e => {
          console.log(`- ${e.store_name}: ${e.amount} (Paid by ${e.paid_by} for ${e.paid_for})`)
      })
  } else {
      console.log('No unreviewed items.')
  }
}

debugSettlement()
