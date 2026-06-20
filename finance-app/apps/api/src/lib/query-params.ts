import {
  EXPENSE_ACCOUNTS,
  type TransactionType,
  type ExpenseAccount,
} from '@finance/shared';

export type TransactionTypeFilter = 'all' | TransactionType;

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
  categoryId?: number;
  from?: string;
  to?: string;
  limit?: number;
  type?: TransactionType;
};

export type ProjectionQuery = {
  account?: ExpenseAccount;
  excludeCategoryIds?: string;
  excludeSubcategoryIds?: string;
};

export type ParsedProjectionQuery = {
  account?: ExpenseAccount;
  excludeCategoryIds: number[];
  excludeSubcategoryIds: number[];
};

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const commaSeparatedIntegerPattern = /^\d+(,\d+)*$/;

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

export function reportQuerySchema(
  options: {
    includeCategoryId?: boolean;
    includeExcludeCategoryIds?: boolean;
    includeExcludeSubcategoryIds?: boolean;
    includeLimit?: boolean;
    includeTransactionType?: boolean;
  } = {},
): object {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      account: { type: 'string', enum: EXPENSE_ACCOUNTS },
      ...(options.includeCategoryId
        ? { categoryId: { type: 'integer', minimum: 1 } }
        : {}),
      ...(options.includeExcludeCategoryIds
        ? {
            excludeCategoryIds: {
              type: 'string',
              minLength: 1,
              pattern: commaSeparatedIntegerPattern.source,
            },
          }
        : {}),
      ...(options.includeExcludeSubcategoryIds
        ? {
            excludeSubcategoryIds: {
              type: 'string',
              minLength: 1,
              pattern: commaSeparatedIntegerPattern.source,
            },
          }
        : {}),
      from: { type: 'string', pattern: isoDatePattern.source },
      to: { type: 'string', pattern: isoDatePattern.source },
      ...(options.includeTransactionType
        ? { type: { type: 'string', enum: ['expense', 'income'] } }
        : {}),
      ...(options.includeLimit
        ? { limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 } }
        : {}),
    },
  };
}

export function toTransactionQuery(
  query: TransactionQuery,
): Required<Pick<TransactionQuery, 'type' | 'limit' | 'offset'>> &
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

export function toProjectionQuery(
  query: ProjectionQuery,
): ParsedProjectionQuery {
  return {
    account: query.account,
    excludeCategoryIds:
      query.excludeCategoryIds === undefined
        ? []
        : query.excludeCategoryIds.split(',').map(Number),
    excludeSubcategoryIds:
      query.excludeSubcategoryIds === undefined
        ? []
        : query.excludeSubcategoryIds.split(',').map(Number),
  };
}
