import { PERSONAL_HALF_SHARE_ACCOUNTS } from "@finance/shared";

const personalHalfShareAccountSqlList = PERSONAL_HALF_SHARE_ACCOUNTS.map(
  (account) => `'${account}'`,
).join(", ");

export function personalAmountSql(tableName: "expenses" | "income"): string {
  return `case when ${tableName}.account in (${personalHalfShareAccountSqlList}) then ${tableName}.amount / 2 else ${tableName}.amount end`;
}
