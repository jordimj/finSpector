export function SubjectCardSkeleton() {
  return (
    <div className='min-h-[20rem] rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-8 flex items-start justify-between'>
        <div className='size-12 animate-pulse rounded-full bg-muted/15' />
        <div className='h-7 w-20 animate-pulse rounded-full bg-muted/15' />
      </div>
      <div className='h-6 w-28 animate-pulse rounded-full bg-muted/25' />
      <div className='mt-4 h-4 w-4/5 animate-pulse rounded-full bg-muted/15' />
      <div className='mt-2 h-4 w-3/5 animate-pulse rounded-full bg-muted/15' />
      <div className='mt-8 h-24 animate-pulse rounded-md bg-muted/10' />
      <div className='mt-6 h-20 animate-pulse rounded-md bg-muted/10' />
      <div className='mt-4 flex justify-end border-t border-line pt-4'>
        <div className='size-9 animate-pulse rounded-full bg-muted/10' />
      </div>
    </div>
  );
}
