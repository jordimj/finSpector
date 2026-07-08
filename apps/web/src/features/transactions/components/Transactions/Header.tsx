export function Header({
  hasAnyFilter,
  hasDateFilter,
  periodLabel,
  transactionCountLabel,
}: {
  hasAnyFilter: boolean;
  hasDateFilter: boolean;
  periodLabel: string;
  transactionCountLabel: string;
}) {
  return (
    <div className='mb-7 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
          Transactions
        </h1>
        <div className='mt-3 flex flex-wrap items-center gap-3'>
          <span className='inline-flex h-6 items-center rounded-full bg-accent-green/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-green'>
            {hasAnyFilter ? 'Filtered history' : 'All history'}
          </span>
          <span className='text-sm font-medium text-muted-strong'>
            {transactionCountLabel}
          </span>
          {hasDateFilter ? (
            <span className='text-sm font-medium text-muted'>
              Period: {periodLabel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
