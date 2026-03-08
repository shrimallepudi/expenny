import { createClient } from './supabase/client';

// ── Transactions ───────────────────────────────────────────────────────────

export async function fetchTransactions(userId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data.map(normalise);
}

export async function upsertSheetTransactions(userId, year, month, transactions) {
  const supabase = createClient();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Delete existing rows for this month
  const { error: delErr } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId)
    .gte('date', `${monthStr}-01`)
    .lte('date', `${monthStr}-31`);
  if (delErr) throw delErr;

  if (!transactions.length) return;

  const rows = transactions.map(t => ({
    user_id:        userId,
    date:           t.date,
    type:           t.type,
    category:       t.category,
    amount:         Number(t.amount),
    note:           t.note || '',
    recurring:      t.recurring || false,
    recurring_freq: t.recurringFreq || 'monthly',
  }));

  const { error: insErr } = await supabase.from('transactions').insert(rows);
  if (insErr) throw insErr;
}

export async function insertTransaction(userId, tx) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id:        userId,
      date:           tx.date,
      type:           tx.type,
      category:       tx.category,
      amount:         Number(tx.amount),
      note:           tx.note || '',
      recurring:      tx.recurring || false,
      recurring_freq: tx.recurringFreq || 'monthly',
    })
    .select()
    .single();
  if (error) throw error;
  return normalise(data);
}

export async function deleteTransaction(txId) {
  const supabase = createClient();
  const { error } = await supabase.from('transactions').delete().eq('id', txId);
  if (error) throw error;
}

// ── User settings ──────────────────────────────────────────────────────────

export async function fetchUserSettings(userId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveUserSettings(userId, expenseCats, incomeTypes) {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, expense_cats: expenseCats, income_types: incomeTypes, updated_at: new Date().toISOString() },
             { onConflict: 'user_id' });
  if (error) throw error;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalise(row) {
  return {
    id:            row.id,
    date:          row.date,
    type:          row.type,
    category:      row.category,
    amount:        Number(row.amount),
    note:          row.note || '',
    recurring:     row.recurring || false,
    recurringFreq: row.recurring_freq || 'monthly',
  };
}
