import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_TYPES } from '@/lib/constants';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch Workspaces for this user
  const { data: memberRows } = await supabase
    .from('workspace_members')
    .select('role, workspaces(id, name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  let workspaces = (memberRows || []).map(r => {
    // Supabase might return joined data as an array or a single object depending on the foreign key setup
    const wsData = Array.isArray(r.workspaces) ? r.workspaces[0] : r.workspaces;
    return {
      id: wsData?.id,
      name: wsData?.name,
      role: r.role
    };
  }).filter(w => w.id); // Filter out any that failed to map

  // If the user has NO workspaces, create a default one for them
  if (workspaces.length === 0) {
    const defaultName = `${user.email.split('@')[0]}'s Workspace`;
    const newWsId = uuidv4();
    const { error: wsErr } = await supabase.from('workspaces').insert({ id: newWsId, name: defaultName });
    
    if (!wsErr) {
      // Add user to their new workspace
      await supabase.from('workspace_members').insert({ workspace_id: newWsId, user_id: user.id, role: 'owner' });
      workspaces = [{ id: newWsId, name: defaultName, role: 'owner' }];
      
      // Seed default settings for this new workspace
      await supabase.from('workspace_settings').insert({
        workspace_id: newWsId,
        expense_cats: DEFAULT_EXPENSE_CATS,
        income_types: DEFAULT_INCOME_TYPES
      });
    }
  }

  // Active Workspace is the first one by default (or we could read a cookie later)
  const activeWorkspace = workspaces[0];

  // Fetch transactions for active workspace
  const { data: txRows } = await supabase
    .from('transactions')
    .select('*')
    .eq('workspace_id', activeWorkspace?.id)
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

  // Fetch workspace settings
  const { data: settings } = await supabase
    .from('workspace_settings')
    .select('*')
    .eq('workspace_id', activeWorkspace?.id)
    .maybeSingle();

  const expenseCats = settings?.expense_cats || DEFAULT_EXPENSE_CATS;
  const incomeTypes = settings?.income_types || DEFAULT_INCOME_TYPES;
  const customCats = settings?.custom_categories || [];

  return (
    <AppShell
      userEmail={user.email}
      workspaces={workspaces}
      initialWorkspace={activeWorkspace}
      initialTransactions={transactions}
      initialExpenseCats={expenseCats}
      initialIncomeTypes={incomeTypes}
      initialCustomCats={customCats}
    />
  );
}
