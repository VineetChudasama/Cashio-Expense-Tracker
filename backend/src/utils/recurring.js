export function detectRecurringPatterns(expenses) {
  const grouped = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) acc[exp.category] = [];
    acc[exp.category].push(exp);
    return acc;
  }, {});

  const patterns = [];

  for (const [category, exps] of Object.entries(grouped)) {
    if (exps.length < 3) continue;

    exps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let totalInterval = 0;
    const intervals = [];
    for (let i = 1; i < exps.length; i++) {
      const days = (new Date(exps[i].date).getTime() - new Date(exps[i-1].date).getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(days);
      totalInterval += days;
    }
    const meanInterval = totalInterval / intervals.length;

    let totalAmount = 0;
    for (const exp of exps) {
      totalAmount += exp.amount;
    }
    const meanAmount = totalAmount / exps.length;

    const allIntervalsWithinTolerance = intervals.every(interval => 
      interval >= meanInterval * 0.65 && interval <= meanInterval * 1.35
    );

    const allAmountsWithinTolerance = exps.every(exp => 
      exp.amount >= meanAmount * 0.75 && exp.amount <= meanAmount * 1.25
    );

    if (allIntervalsWithinTolerance && allAmountsWithinTolerance) {
      const intervalVariance = intervals.reduce((sum, int) => sum + Math.abs(int - meanInterval), 0) / intervals.length;
      const amountVariance = exps.reduce((sum, exp) => sum + Math.abs(exp.amount - meanAmount), 0) / exps.length;
      
      const intervalConfidence = Math.max(0, 1 - (intervalVariance / meanInterval));
      const amountConfidence = Math.max(0, 1 - (amountVariance / meanAmount));
      const confidence = Math.min(1, Math.max(0, intervalConfidence * amountConfidence));

      patterns.push({
        category,
        avgAmount: meanAmount,
        avgIntervalDays: meanInterval,
        lastOccurrence: exps[exps.length - 1].date,
        dataPoints: exps.length,
        confidence
      });
    }
  }

  return patterns;
}

export function generateProjections(patterns, days = 30) {
  const projections = [];
  const now = new Date();
  const maxDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  for (const pattern of patterns) {
    let nextDate = new Date(new Date(pattern.lastOccurrence).getTime() + pattern.avgIntervalDays * 24 * 60 * 60 * 1000);
    
    while (nextDate <= maxDate) {
      projections.push({
        date: new Date(nextDate),
        amount: pattern.avgAmount,
        category: pattern.category,
        isProjection: true
      });
      nextDate = new Date(nextDate.getTime() + pattern.avgIntervalDays * 24 * 60 * 60 * 1000);
    }
  }

  return projections;
}
