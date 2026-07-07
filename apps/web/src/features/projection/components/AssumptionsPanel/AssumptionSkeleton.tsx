export function AssumptionSkeleton() {
  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={index}
          className='h-14 animate-pulse rounded-md bg-panel-raised/70'
        />
      ))}
    </div>
  );
}
