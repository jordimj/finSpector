import type { CockpitSubjectSummary } from '@finance/shared';
import type { CockpitSection } from '../../utils/cockpitSections';
import { SubjectCard } from './SubjectCard';
import { SubjectCardSkeleton } from './SubjectCardSkeleton';

type SubjectSectionProps = {
  isLoading: boolean;
  section: CockpitSection;
  subjects: CockpitSubjectSummary[];
};

export function SubjectSection({
  isLoading,
  section,
  subjects,
}: SubjectSectionProps) {
  if (!isLoading && subjects.length === 0) {
    return null;
  }

  return (
    <section>
      <div className='mb-4 border-b border-line pb-3'>
        <h2 className='text-lg font-semibold tracking-normal text-ink'>
          {section.title}
        </h2>
      </div>

      <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
        {isLoading
          ? section.slugs.map((slug) => <SubjectCardSkeleton key={slug} />)
          : subjects.map((subject) => (
              <SubjectCard key={subject.slug} subject={subject} />
            ))}
      </div>
    </section>
  );
}
