import { relations } from "drizzle-orm";
import {
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
  uuid
} from "drizzle-orm/pg-core";

export const importStatus = pgEnum("import_status", ["started", "completed", "failed"]);
export const expenseAccount = pgEnum("expense_account", ["mine", "shared", "kids", "splitwise"]);

export const categories = pgTable(
  "categories",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    nameUnique: uniqueIndex("categories_name_unique").on(table.name)
  })
);

export const subcategories = pgTable(
  "subcategories",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    categoryNameUnique: uniqueIndex("subcategories_category_name_unique").on(
      table.categoryId,
      table.name
    ),
    idCategoryUnique: uniqueIndex("subcategories_id_category_unique").on(
      table.id,
      table.categoryId
    ),
    categoryIdx: index("subcategories_category_id_idx").on(table.categoryId)
  })
);

export const imports = pgTable("imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceName: text("source_name").notNull(),
  sourceType: text("source_type").notNull(),
  status: importStatus("status").notNull().default("started"),
  rowCount: numeric("row_count").notNull().default("0"),
  duplicateCount: numeric("duplicate_count").notNull().default("0"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true })
});

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: date("date").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    merchantName: text("merchant_name").notNull(),
    originalDescription: text("original_description").notNull(),
    categoryId: integer("category_id").notNull().references(() => categories.id),
    subcategoryId: integer("subcategory_id"),
    notes: text("notes"),
    account: expenseAccount("account").notNull().default("mine"),
    sourceImportId: uuid("source_import_id").references(() => imports.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    duplicateLookupIdx: index("expenses_duplicate_lookup_idx").on(
      table.date,
      table.amount,
      table.account
    ),
    categoryIdx: index("expenses_category_id_idx").on(table.categoryId),
    subcategoryIdx: index("expenses_subcategory_id_idx").on(table.subcategoryId),
    merchantIdx: index("expenses_merchant_name_idx").on(table.merchantName),
    subcategoryCategoryFk: foreignKey({
      columns: [table.subcategoryId, table.categoryId],
      foreignColumns: [subcategories.id, subcategories.categoryId],
      name: "expenses_subcategory_category_fk"
    })
  })
);

export const income = pgTable(
  "income",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: date("date").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    payerName: text("payer_name").notNull(),
    originalDescription: text("original_description").notNull(),
    categoryId: integer("category_id").notNull().references(() => categories.id),
    notes: text("notes"),
    sourceImportId: uuid("source_import_id").references(() => imports.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    duplicateLookupIdx: index("income_duplicate_lookup_idx").on(table.date, table.amount),
    categoryIdx: index("income_category_id_idx").on(table.categoryId),
    payerIdx: index("income_payer_name_idx").on(table.payerName)
  })
);

export const categoryRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories)
}));

export const subcategoryRelations = relations(subcategories, ({ one }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id]
  })
}));
