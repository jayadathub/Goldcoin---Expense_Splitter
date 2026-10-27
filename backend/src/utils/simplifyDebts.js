/**
 * Simplifies debts for a group into minimum number of transactions using a greedy algorithm.
 *
 * @param {Object} balances - Map of userId -> netBalance (positive means they should receive, negative means they owe)
 * @param {Array} members - Array of member user objects (to attach details like name and email)
 * @returns {Array} - Array of simplified transactions: [{ from, to, amount }]
 */
export const simplifyDebts = (balances, members = []) => {
  // Map members for quick lookup
  const memberMap = {};
  members.forEach((m) => {
    memberMap[m._id.toString()] = m;
  });

  const creditors = []; // People who are owed money (balance > 0)
  const debtors = []; // People who owe money (balance < 0)

  for (const [userId, amount] of Object.entries(balances)) {
    // Round to 2 decimal places to avoid floating point issues
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0.01) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ userId, amount: -rounded }); // store positive value of debt
    }
  }

  // Sort descending by amount for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0; // index for creditors
  let j = 0; // index for debtors

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settleAmount = Math.min(creditor.amount, debtor.amount);
    const roundedSettle = Math.round(settleAmount * 100) / 100;

    if (roundedSettle > 0) {
      transactions.push({
        from: memberMap[debtor.userId] || { _id: debtor.userId },
        to: memberMap[creditor.userId] || { _id: creditor.userId },
        amount: roundedSettle,
      });
    }

    creditor.amount -= roundedSettle;
    debtor.amount -= roundedSettle;

    if (Math.abs(creditor.amount) < 0.01) i++;
    if (Math.abs(debtor.amount) < 0.01) j++;
  }

  return transactions;
};
