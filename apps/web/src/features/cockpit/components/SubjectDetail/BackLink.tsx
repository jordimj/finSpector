import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

type BackLinkProps = {
  className?: string;
};

export function BackLink({ className }: BackLinkProps) {
  return (
    <Link
      to='/cockpit'
      className={[
        'inline-flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong transition hover:bg-panel-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ChevronLeft className='size-4' aria-hidden='true' />
      Cockpit
    </Link>
  );
}
