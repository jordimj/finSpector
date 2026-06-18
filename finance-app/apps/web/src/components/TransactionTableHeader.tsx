export function TransactionTableHeader() {
  return (
    <div className='hidden grid-cols-[minmax(0,1.3fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(7rem,0.65fr)_minmax(7rem,0.65fr)] gap-4 border-y border-line bg-panel-raised/35 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-strong md:grid'>
      <span>Transaction</span>
      <span>Category</span>
      <span>Account</span>
      <span>Date</span>
      <span className='text-right'>Amount</span>
    </div>
  );
}
