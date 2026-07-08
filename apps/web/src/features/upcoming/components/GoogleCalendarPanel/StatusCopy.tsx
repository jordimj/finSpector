export function StatusCopy({
  description,
  detail,
  title,
}: {
  description?: string;
  detail?: string;
  title: string;
}) {
  return (
    <div>
      <p className='text-sm font-semibold text-ink'>{title}</p>
      {description === undefined ? null : (
        <p className='mt-1 text-sm font-medium leading-6 text-muted'>
          {description}
        </p>
      )}
      {detail === undefined ? null : (
        <p className='mt-2 text-xs font-semibold text-muted-strong'>{detail}</p>
      )}
    </div>
  );
}
