import { formatCurrency } from '../../../../../utils';
import {
  getMetricToneClass,
  type SubjectMetricModel,
} from '../../../utils/subjectMetrics';

type SubjectPrimaryMetricProps = {
  metric: SubjectMetricModel;
};

export function SubjectPrimaryMetric({ metric }: SubjectPrimaryMetricProps) {
  return (
    <div className='min-w-0'>
      <p className='text-xs font-bold uppercase tracking-[0.12em] text-muted'>
        {metric.label}
      </p>
      <p
        className={`mt-2 truncate text-2xl font-bold tabular-nums tracking-normal ${getMetricToneClass(
          metric.tone,
        )}`}
      >
        {formatCurrency(Number(metric.value))}
      </p>
    </div>
  );
}
