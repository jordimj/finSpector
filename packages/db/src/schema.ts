import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const importStatus = pgEnum('import_status', [
  'started',
  'completed',
  'failed',
]);
export const expenseAccount = pgEnum('expense_account', [
  'mine',
  'shared',
  'kids',
  'splitwise',
]);
export const paymentCadence = pgEnum('payment_cadence', [
  'oneTime',
  'monthly',
  'quarterly',
  'annually',
]);
export const paymentReminderSource = pgEnum('payment_reminder_source', [
  'manual',
  'detected',
]);
export const paymentOccurrenceStatus = pgEnum('payment_occurrence_status', [
  'paid',
  'skipped',
]);

export const categories = pgTable(
  'categories',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameUnique: uniqueIndex('categories_name_unique').on(table.name),
  }),
);

export const subcategories = pgTable(
  'subcategories',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    categoryNameUnique: uniqueIndex('subcategories_category_name_unique').on(
      table.categoryId,
      table.name,
    ),
    idCategoryUnique: uniqueIndex('subcategories_id_category_unique').on(
      table.id,
      table.categoryId,
    ),
    categoryIdx: index('subcategories_category_id_idx').on(table.categoryId),
  }),
);

export const imports = pgTable('imports', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceName: text('source_name').notNull(),
  sourceType: text('source_type').notNull(),
  status: importStatus('status').notNull().default('started'),
  rowCount: numeric('row_count').notNull().default('0'),
  duplicateCount: numeric('duplicate_count').notNull().default('0'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: date('date').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    description: text('description'),
    bankConcept: text('bank_concept'),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    subcategoryId: integer('subcategory_id'),
    account: expenseAccount('account').notNull().default('mine'),
    sourceImportId: uuid('source_import_id').references(() => imports.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    duplicateLookupIdx: index('expenses_duplicate_lookup_idx').on(
      table.date,
      table.amount,
      table.account,
      table.categoryId,
      table.subcategoryId,
      table.description,
    ),
    categoryIdx: index('expenses_category_id_idx').on(table.categoryId),
    subcategoryIdx: index('expenses_subcategory_id_idx').on(
      table.subcategoryId,
    ),
    subcategoryCategoryFk: foreignKey({
      columns: [table.subcategoryId, table.categoryId],
      foreignColumns: [subcategories.id, subcategories.categoryId],
      name: 'expenses_subcategory_category_fk',
    }),
  }),
);

export const income = pgTable(
  'income',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: date('date').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    description: text('description'),
    bankConcept: text('bank_concept'),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    subcategoryId: integer('subcategory_id'),
    account: expenseAccount('account').notNull().default('mine'),
    sourceImportId: uuid('source_import_id').references(() => imports.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    duplicateLookupIdx: index('income_duplicate_lookup_idx').on(
      table.date,
      table.amount,
      table.account,
      table.categoryId,
      table.subcategoryId,
      table.description,
    ),
    categoryIdx: index('income_category_id_idx').on(table.categoryId),
    subcategoryIdx: index('income_subcategory_id_idx').on(table.subcategoryId),
    subcategoryCategoryFk: foreignKey({
      columns: [table.subcategoryId, table.categoryId],
      foreignColumns: [subcategories.id, subcategories.categoryId],
      name: 'income_subcategory_category_fk',
    }),
  }),
);

export const paymentReminders = pgTable(
  'payment_reminders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    amountTolerance: numeric('amount_tolerance', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('5.00'),
    cadence: paymentCadence('cadence').notNull().default('monthly'),
    source: paymentReminderSource('source').notNull().default('manual'),
    account: expenseAccount('account').notNull().default('mine'),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    subcategoryId: integer('subcategory_id'),
    matchText: text('match_text'),
    startDate: date('start_date').notNull(),
    dueDay: integer('due_day').notNull(),
    leadDays: integer('lead_days').notNull().default(7),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    accountIdx: index('payment_reminders_account_idx').on(table.account),
    activeIdx: index('payment_reminders_active_idx').on(table.active),
    categoryIdx: index('payment_reminders_category_id_idx').on(
      table.categoryId,
    ),
    subcategoryCategoryFk: foreignKey({
      columns: [table.subcategoryId, table.categoryId],
      foreignColumns: [subcategories.id, subcategories.categoryId],
      name: 'payment_reminders_subcategory_category_fk',
    }),
  }),
);

export const paymentReminderOccurrences = pgTable(
  'payment_reminder_occurrences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentReminderId: uuid('payment_reminder_id')
      .notNull()
      .references(() => paymentReminders.id, { onDelete: 'cascade' }),
    dueDate: date('due_date').notNull(),
    status: paymentOccurrenceStatus('status').notNull(),
    matchedExpenseId: uuid('matched_expense_id').references(() => expenses.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    skippedAt: timestamp('skipped_at', { withTimezone: true }),
  },
  (table) => ({
    reminderDueUnique: uniqueIndex(
      'payment_reminder_occurrences_reminder_due_unique',
    ).on(table.paymentReminderId, table.dueDate),
    reminderIdx: index('payment_reminder_occurrences_reminder_id_idx').on(
      table.paymentReminderId,
    ),
    dueDateIdx: index('payment_reminder_occurrences_due_date_idx').on(
      table.dueDate,
    ),
    matchedExpenseIdx: index(
      'payment_reminder_occurrences_matched_expense_id_idx',
    ).on(table.matchedExpenseId),
  }),
);

export const paymentReminderDismissedSuggestions = pgTable(
  'payment_reminder_dismissed_suggestions',
  {
    suggestionKey: text('suggestion_key').primaryKey(),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const categoryRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
  paymentReminders: many(paymentReminders),
}));

export const subcategoryRelations = relations(subcategories, ({ one }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
}));

export const paymentReminderRelations = relations(
  paymentReminders,
  ({ many, one }) => ({
    category: one(categories, {
      fields: [paymentReminders.categoryId],
      references: [categories.id],
    }),
    occurrences: many(paymentReminderOccurrences),
    subcategory: one(subcategories, {
      fields: [paymentReminders.subcategoryId],
      references: [subcategories.id],
    }),
  }),
);

export const paymentReminderOccurrenceRelations = relations(
  paymentReminderOccurrences,
  ({ one }) => ({
    matchedExpense: one(expenses, {
      fields: [paymentReminderOccurrences.matchedExpenseId],
      references: [expenses.id],
    }),
    paymentReminder: one(paymentReminders, {
      fields: [paymentReminderOccurrences.paymentReminderId],
      references: [paymentReminders.id],
    }),
  }),
);
