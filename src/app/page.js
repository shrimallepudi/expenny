import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_TYPES } from '@/lib/constants';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch transactions
  const { data: txRows } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  const transactions = (txRows || []).map(row => ({
    id:            row.id,
    date:          row.date,
    type:          row.type,
    category:      row.category,
    amount:        Number(row.amount),
    note:          row.note || '',
    recurring:     row.recurring || false,
    recurringFreq: row.recurring_freq || 'monthly',
  }));

  // Fetch user settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const expenseCats = settings?.expense_cats || DEFAULT_EXPENSE_CATS;
  const incomeTypes = settings?.income_types || DEFAULT_INCOME_TYPES;

  return (
    <AppShell
      userId={user.id}
      userEmail={user.email}
      initialTransactions={transactions}
      initialExpenseCats={expenseCats}
      initialIncomeTypes={incomeTypes}
    />
  );
}
