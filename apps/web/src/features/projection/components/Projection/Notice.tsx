import { CircleAlert } from 'lucide-react';

type NoticeProps = {
  description: string;
  title: string;
  tone: 'amber' | 'lavender' | 'rose';
};

export function Notice({ description, title, tone }: NoticeProps) {
  const toneClass = {
    amber: 'border-accent-amber/35 bg-accent-amber/10 text-accent-amber',
    lavender:
      'border-accent-lavender/35 bg-accent-lavender/10 text-accent-lavender',
    rose: 'border-accent-rose/35 bg-accent-rose/10 text-accent-rose',
  }[tone];

  return (
    <div className={`mb-5 rounded-lg border p-4 ${toneClass}`}>
      <div className='flex gap-3'>
        <CircleAlert className='mt-0.5 size-5 shrink-0' aria-hidden='true' />
        <div>
          <p className='text-sm font-semibold text-ink'>{title}</p>
          <p className='mt-1 text-sm font-medium text-muted-strong'>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
