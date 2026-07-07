import { formatCurrency } from '../../../../../utils';
import {
  getMetricToneClass,
  type SubjectMetricModel,
} from '../../../utils/subjectMetrics';

type SubjectSecondaryMetricProps = {
  metric: SubjectMetricModel;
};

export function SubjectSecondaryMetric({
  metric,
}: SubjectSecondaryMetricProps) {
  return (
    <div className='min-w-0'>
      <p className='truncate text-[0.7rem] font-bold uppercase tracking-[0.12em] text-muted'>
        {metric.label}
      </p>
      <p
        className={`mt-1 truncate text-sm font-bold tabular-nums ${getMetricToneClass(
          metric.tone,
        )}`}
      >
        {formatCurrency(Number(metric.value))}
      </p>
    </div>
  );
}
