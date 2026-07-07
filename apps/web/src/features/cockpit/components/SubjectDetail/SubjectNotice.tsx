import { CircleAlert } from 'lucide-react';

type SubjectNoticeProps = {
  description: string;
  title: string;
};

export function SubjectNotice({
  description,
  title,
}: SubjectNoticeProps) {
  return (
    <div className='mb-5 flex gap-3 rounded-lg border border-accent-rose/35 bg-accent-rose/10 px-4 py-3'>
      <CircleAlert
        className='mt-0.5 size-5 shrink-0 text-accent-rose'
        aria-hidden='true'
      />
      <div>
        <p className='text-sm font-semibold text-accent-rose'>{title}</p>
        <p className='mt-1 text-sm font-medium text-muted-strong'>
          {description}
        </p>
      </div>
    </div>
  );
}
