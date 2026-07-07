type NoticeProps = {
  description: string;
  title: string;
};

export function Notice({ description, title }: NoticeProps) {
  return (
    <div className='mb-5 rounded-lg border border-accent-rose/35 bg-accent-rose/10 px-4 py-3'>
      <p className='text-sm font-semibold text-accent-rose'>{title}</p>
      <p className='mt-1 text-sm font-medium text-muted-strong'>
        {description}
      </p>
    </div>
  );
}
