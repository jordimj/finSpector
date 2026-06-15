import {
  EXPENSE_ACCOUNTS,
  type ExpenseAccount,
} from '@finance/shared';

export type TransactionTypeFilter = 'all' | 'expense' | 'income';

export type TransactionQuery = {
  type?: TransactionTypeFilter;
  account?: ExpenseAccount;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type ReportQuery = {
  account?: ExpenseAccount;
  from?: string;
  to?: string;
  limit?: number;
};

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function transactionQuerySchema(): object {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { type: 'string', enum: ['all', 'expense', 'income'] },
      account: { type: 'string', enum: EXPENSE_ACCOUNTS },
      from: { type: 'string', pattern: isoDatePattern.source },
      to: { type: 'string', pattern: isoDatePattern.source },
      search: { type: 'string', minLength: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 500, default: 100 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
  };
}

export function reportQuerySchema(includeLimit = false): object {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      account: { type: 'string', enum: EXPENSE_ACCOUNTS },
      from: { type: 'string', pattern: isoDatePattern.source },
      to: { type: 'string', pattern: isoDatePattern.source },
      ...(includeLimit
        ? { limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 } }
        : {}),
    },
  };
}

export function toTransactionQuery(query: TransactionQuery): Required<
  Pick<TransactionQuery, 'type' | 'limit' | 'offset'>
> &
  Omit<TransactionQuery, 'type' | 'limit' | 'offset'> {
  return {
    ...query,
    type: query.type ?? 'all',
    limit: query.limit ?? 100,
    offset: query.offset ?? 0,
  };
}

export function toReportQuery(query: ReportQuery): ReportQuery {
  return query;
}
