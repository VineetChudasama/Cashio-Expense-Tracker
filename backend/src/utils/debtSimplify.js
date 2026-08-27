export function simplifyDebts(balancesMap) {
  const balances = Array.from(balancesMap.entries()).map(([userId, amount]) => ({ userId, amount }));
  
  const debtors = balances.filter(b => b.amount < -0.01).sort((a, b) => a.amount - b.amount);
  const creditors = balances.filter(b => b.amount > 0.01).sort((a, b) => b.amount - a.amount);

  const transactions = [];

  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
    
    if (amount > 0.01) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(amount * 100) / 100
      });
    }

    debtor.amount += amount;
    creditor.amount -= amount;

    if (Math.abs(debtor.amount) < 0.01) d++;
    if (creditor.amount < 0.01) c++;
  }

  return transactions;
}
