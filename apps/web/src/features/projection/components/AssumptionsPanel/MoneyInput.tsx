type MoneyInputProps = {
  min?: number;
  onChange: (value: string) => void;
  value: number;
};

export function MoneyInput({ min, onChange, value }: MoneyInputProps) {
  return (
    <div className='flex h-9 items-center overflow-hidden rounded-md border border-line bg-panel text-sm font-semibold text-ink focus-within:border-accent-lavender'>
      <span className='border-r border-line px-2 text-xs text-muted'>EUR</span>
      <input
        type='number'
        step='10'
        min={min}
        className='h-full min-w-0 flex-1 bg-transparent px-2 text-right outline-none'
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}
