import type { CockpitSubjectDetail } from '@finance/shared';
import { InsightGroupCard } from './InsightGroupCard';
import { InsightTimeline } from './InsightTimeline';

type SubjectInsightsPanelProps = {
  subject?: CockpitSubjectDetail;
};

export function SubjectInsightsPanel({
  subject,
}: SubjectInsightsPanelProps) {
  const groups = subject?.insights?.groups ?? [];
  const timeline = subject?.insights?.timeline ?? [];
  const showTimeline = subject?.slug === 'salaries' || timeline.length > 0;

  if (groups.length === 0 && !showTimeline) {
    return null;
  }

  return (
    <div className='mt-8 grid gap-5 xl:grid-cols-2'>
      {groups.map((group) => (
        <InsightGroupCard key={group.title} group={group} />
      ))}
      {showTimeline ? (
        <InsightTimeline
          items={timeline}
          title={subject?.slug === 'salaries' ? 'Salary periods' : 'Timeline'}
        />
      ) : null}
    </div>
  );
}
