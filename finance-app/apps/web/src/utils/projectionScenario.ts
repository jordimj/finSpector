import type { Projection } from '../hooks/useProjection';
import type {
  ProjectionScenarioEvent,
  ProjectionSettings,
} from '../hooks/useProjectionSettings';

export function applyProjectionScenario(
  projection: Projection,
  settings: ProjectionSettings,
): Projection {
  if (settings.oneOffEvents.length === 0) {
    return projection;
  }

  const months = projection.months.map((month) => {
    const oneOffEvents = settings.oneOffEvents.filter(
      (event) => event.month === month.month,
    );
    const oneOffIncome = sumEvents(oneOffEvents, 'income');
    const oneOffExpenses = sumEvents(oneOffEvents, 'expense');
    const income = month.incomeAmount + oneOffIncome;
    const expenses = month.expensesAmount + oneOffExpenses;
    const normalizedIncome = Math.max(0, income);
    const normalizedExpenses = Math.max(0, expenses);
    const net = normalizedIncome - normalizedExpenses;

    return {
      ...month,
      expenses: toMoneyText(normalizedExpenses),
      expensesAmount: normalizedExpenses,
      income: toMoneyText(normalizedIncome),
      incomeAmount: normalizedIncome,
      net: toMoneyText(net),
      netAmount: net,
    };
  });
  const incomeTotal = months.reduce(
    (sum, month) => sum + month.incomeAmount,
    0,
  );
  const expensesTotal = months.reduce(
    (sum, month) => sum + month.expensesAmount,
    0,
  );
  const netTotal = incomeTotal - expensesTotal;
  const totals = {
    income: toMoneyText(incomeTotal),
    expenses: toMoneyText(expensesTotal),
    net: toMoneyText(netTotal),
    savingsRate:
      incomeTotal > 0 ? Number((netTotal / incomeTotal).toFixed(4)) : null,
  };

  return {
    ...projection,
    chartData: {
      ...projection.chartData,
      totals,
      periods: months.map((month) => ({
        period: month.month,
        label: month.label,
        income: month.income,
        expenses: month.expenses,
        net: month.net,
        incomeAmount: month.incomeAmount,
        expensesAmount: month.expensesAmount,
        netAmount: month.netAmount,
      })),
    },
    months,
    totals,
  };
}

function sumEvents(
  events: ProjectionScenarioEvent[],
  type: ProjectionScenarioEvent['type'],
): number {
  return events.reduce(
    (sum, event) => sum + (event.type === type ? event.amount : 0),
    0,
  );
}

function toMoneyText(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;

  if (Object.is(rounded, -0) || rounded === 0) {
    return '0.00';
  }

  return rounded.toFixed(2);
}
