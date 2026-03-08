import { createClient } from './supabase/client';

// ── Workspaces ─────────────────────────────────────────────────────────────

export async function fetchUserWorkspaces() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role, workspaces(id, name)')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data.map(row => {
    const wsData = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
    return {
      id: wsData?.id,
      name: wsData?.name,
      role: row.role,
    };
  }).filter(w => w.id);
}

// ── Workspace Settings ─────────────────────────────────────────────────────

export async function fetchWorkspaceSettings(workspaceId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workspace_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveWorkspaceSettings(workspaceId, expenseCats, incomeTypes) {
  const supabase = createClient();
  const { error } = await supabase
    .from('workspace_settings')
    .upsert(
      { workspace_id: workspaceId, expense_cats: expenseCats, income_types: incomeTypes, updated_at: new Date().toISOString() },
      { onConflict: 'workspace_id' }
    );
  if (error) throw error;
}

// ── Workspace Invites ──────────────────────────────────────────────────────

export async function getWorkspaceMembers(workspaceId) {
  const supabase = createClient();
  
  // We need generic user info, but auth.users is often protected.
  // Instead we'll just get the member rows. We might only show roles & IDs since we lack a profiles table.
  const { data, error } = await supabase
    .from('workspace_members')
    .select('user_id, role, created_at')
    .eq('workspace_id', workspaceId);
    
  if (error) throw error;
  return data;
}

export async function createInvite(workspaceId, role, email) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workspace_invites')
    .insert({ workspace_id: workspaceId, role, email })
    .select('token')
    .single();
    
  if (error) throw error;
  return data.token;
}

export async function acceptInvite(token) {
  const supabase = createClient();
  
  // 1. Get the invite details
  const { data: invite, error: invErr } = await supabase
    .from('workspace_invites')
    .select('workspace_id, role, email')
    .eq('token', token)
    .single();
    
  if (invErr) throw invErr;
  
  // 2. Insert member using our own UID
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  
  // Verify matching email
  if (userData.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new Error(`This invitation was sent to ${invite.email}, please log in with that account to accept it.`);
  }
  
  const { error: joinErr } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: invite.workspace_id, user_id: userData.user.id, role: invite.role });
    
  // Ignore conflict if already a member
  if (joinErr && joinErr.code !== '23505') throw joinErr;
  
  // Delete the invite token after successful use
  await supabase.from('workspace_invites').delete().eq('token', token);
  
  return invite.workspace_id;
}

export async function updateWorkspaceName(workspaceId, newName) {
  const supabase = createClient();
  const { error } = await supabase
    .from('workspaces')
    .update({ name: newName })
    .eq('id', workspaceId);
  if (error) throw error;
}

export async function getWorkspaceLogs(workspaceId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workspace_logs')
    .select('*, profiles(email)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}


// ── Transactions ───────────────────────────────────────────────────────────

export async function fetchTransactions(workspaceId) {
  if (!workspaceId) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data.map(normalise);
}

export async function upsertSheetTransactions(workspaceId, year, month, transactions) {
  const supabase = createClient();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // 1. Fetch existing transactions for this month
  const { data: existing, error: fetchErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('date', `${monthStr}-01`)
    .lte('date', `${monthStr}-31`);
  
  if (fetchErr) throw fetchErr;

  // 2. Map existing by key (category + date)
  // Note: If multiple exist for one key, we'll keep the first and mark others for deletion to collapse.
  const existingMap = {};
  const toDelete = [];
  existing.forEach(t => {
    const key = `${t.category}|${t.date}`;
    if (!existingMap[key]) {
      existingMap[key] = t;
    } else {
      toDelete.push(t.id);
    }
  });

  const toInsert = [];
  const toUpdate = [];
  const processedKeys = new Set();

  // 3. Compare with new transactions from grid
  transactions.forEach(t => {
    const key = `${t.category}|${t.date}`;
    processedKeys.add(key);
    const amt = Number(t.amount);
    const existingRow = existingMap[key];

    if (existingRow) {
      if (Number(existingRow.amount) !== amt) {
        toUpdate.push({ id: existingRow.id, amount: amt });
      }
    } else {
      toInsert.push({
        workspace_id: workspaceId,
        date: t.date,
        type: t.type,
        category: t.category,
        amount: amt,
        note: t.note || '',
        recurring: t.recurring || false,
        recurring_freq: t.recurringFreq || 'monthly',
      });
    }
  });

  // 4. Identify deletions (keys in map but not in local grid)
  Object.keys(existingMap).forEach(key => {
    if (!processedKeys.has(key)) {
      toDelete.push(existingMap[key].id);
    }
  });

  // 5. Execute operations concurrently
  const ops = [];
  if (toDelete.length > 0) ops.push(supabase.from('transactions').delete().in('id', toDelete));
  if (toInsert.length > 0) ops.push(supabase.from('transactions').insert(toInsert));
  toUpdate.forEach(u => {
    ops.push(supabase.from('transactions').update({ amount: u.amount }).eq('id', u.id));
  });

  const results = await Promise.all(ops);
  const compositeErr = results.find(r => r.error);
  if (compositeErr) throw compositeErr.error;
}

export async function insertTransaction(workspaceId, tx) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      workspace_id:   workspaceId,
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
