export function generateInsights(expenses) {
  if (!expenses || expenses.length < 5) {
    return [{
      type: 'placeholder',
      title: 'Keep tracking!',
      description: 'Add a few more expenses to unlock spending insights.',
      data: {}
    }];
  }

  const insights = [];
  const now = new Date();
  
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  let currentMonthTotal = 0;
  let prevMonthTotal = 0;

  const categoryTotals = {};

  let weekendTotal = 0;
  let weekendCount = 0;
  let weekdayTotal = 0;
  let weekdayCount = 0;

  let largestExpense = expenses[0];

  expenses.forEach(exp => {
    const date = new Date(exp.date);
    
    if (date >= currentMonthStart) {
      currentMonthTotal += exp.amount;
    } else if (date >= prevMonthStart && date <= prevMonthEnd) {
      prevMonthTotal += exp.amount;
    }

    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;

    const day = date.getDay();
    if (day === 0 || day === 6) {
      weekendTotal += exp.amount;
      weekendCount++;
    } else {
      weekdayTotal += exp.amount;
      weekdayCount++;
    }

    if (exp.amount > largestExpense.amount) {
      largestExpense = exp;
    }
  });

  if (prevMonthTotal > 0) {
    const diff = currentMonthTotal - prevMonthTotal;
    const percentChange = (Math.abs(diff) / prevMonthTotal * 100).toFixed(1);
    const direction = diff > 0 ? 'more' : 'less';
    insights.push({
      type: 'mom_change',
      title: 'Month-over-month Spending',
      description: `You spent ${percentChange}% ${direction} this month compared to last month ($${currentMonthTotal.toFixed(2)} vs $${prevMonthTotal.toFixed(2)})`,
      data: { currentMonthTotal, prevMonthTotal, percentChange, diff }
    });
  }

  const totalSpend = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0) {
    const [topCategory, topAmount] = sortedCategories[0];
    const percent = ((topAmount / totalSpend) * 100).toFixed(1);
    insights.push({
      type: 'top_category',
      title: 'Top Spending Category',
      description: `Your top spending category is ${topCategory} at ${percent}% of total spending ($${topAmount.toFixed(2)})`,
      data: { category: topCategory, amount: topAmount, percent }
    });
  }

  if (weekendCount > 0 && weekdayCount > 0) {
    const weekendAvg = (weekendTotal / weekendCount).toFixed(2);
    const weekdayAvg = (weekdayTotal / weekdayCount).toFixed(2);
    insights.push({
      type: 'weekend_vs_weekday',
      title: 'Weekend vs Weekday Spending',
      description: `You spend an average of $${weekendAvg} per transaction on weekends vs $${weekdayAvg} on weekdays`,
      data: { weekendAvg: parseFloat(weekendAvg), weekdayAvg: parseFloat(weekdayAvg) }
    });
  }

  if (expenses.length > 0) {
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstDate = new Date(sortedExpenses[0].date);
    const daysTracked = Math.max(1, Math.ceil((now - firstDate) / (1000 * 60 * 60 * 24)));
    const dailyAvg = (totalSpend / daysTracked).toFixed(2);
    insights.push({
      type: 'daily_average',
      title: 'Daily Average Spending',
      description: `You spend an average of $${dailyAvg} per day`,
      data: { dailyAvg: parseFloat(dailyAvg), daysTracked, totalSpend }
    });
  }

  insights.push({
    type: 'largest_expense',
    title: 'Largest Single Expense',
    description: `Your largest expense was $${largestExpense.amount.toFixed(2)} on ${largestExpense.category} ${largestExpense.description ? '— ' + largestExpense.description : ''}`,
    data: { amount: largestExpense.amount, category: largestExpense.category, description: largestExpense.description, date: largestExpense.date }
  });

  return insights;
}
