import type { Expense, Settlement, Member, Balance, MemberBalance } from '../types';

/**
 * Calculate the net balance for each member
 * Positive = member is owed money
 * Negative = member owes money
 */
export function calculateMemberBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
): MemberBalance[] {
  // Initialize balances for all members
  const balances: Record<string, number> = {};
  members.forEach(m => {
    balances[m.id] = 0;
  });

  // Process expenses
  expenses.forEach(expense => {
    // The payer gets credited for the full amount
    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;

    // Each person in the split owes their share
    expense.splitBetween.forEach(split => {
      balances[split.memberId] = (balances[split.memberId] || 0) - split.amount;
    });
  });

  // Process settlements (transfers between members)
  settlements.forEach(settlement => {
    // The person who paid (from) gets credited
    balances[settlement.from] = (balances[settlement.from] || 0) + settlement.amount;
    // The person who received (to) gets debited
    balances[settlement.to] = (balances[settlement.to] || 0) - settlement.amount;
  });

  return members.map(m => ({
    memberId: m.id,
    balance: Math.round(balances[m.id] * 100) / 100, // Round to 2 decimal places
  }));
}

/**
 * Simplify debts using a greedy algorithm
 * Returns the minimum transactions needed to settle all debts
 */
export function simplifyDebts(memberBalances: MemberBalance[]): Balance[] {
  // Separate debtors (negative balance) and creditors (positive balance)
  const debtors: { memberId: string; amount: number }[] = [];
  const creditors: { memberId: string; amount: number }[] = [];

  memberBalances.forEach(mb => {
    if (mb.balance < -0.01) {
      debtors.push({ memberId: mb.memberId, amount: -mb.balance });
    } else if (mb.balance > 0.01) {
      creditors.push({ memberId: mb.memberId, amount: mb.balance });
    }
  });

  // Sort by amount (largest first for greedy matching)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: Balance[] = [];

  // Greedy matching
  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      transactions.push({
        from: debtor.memberId,
        to: creditor.memberId,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}

/**
 * Get a summary of what each member owes or is owed
 */
export function getBalanceSummary(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
): { member: Member; balance: number; owes: Balance[]; isOwed: Balance[] }[] {
  const memberBalances = calculateMemberBalances(members, expenses, settlements);
  const simplifiedDebts = simplifyDebts(memberBalances);

  return members.map(member => {
    const balance = memberBalances.find(mb => mb.memberId === member.id)?.balance || 0;
    const owes = simplifiedDebts.filter(d => d.from === member.id);
    const isOwed = simplifiedDebts.filter(d => d.to === member.id);

    return { member, balance, owes, isOwed };
  });
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Get total expenses for a group
 */
export function getTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

