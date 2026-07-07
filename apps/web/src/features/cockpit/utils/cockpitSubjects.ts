import {
  COCKPIT_SUBJECT_SLUGS,
  type CockpitSubjectSlug,
  type CockpitSubjectSummary,
} from '@finance/shared';

export function isSubjectSummary(
  subject: CockpitSubjectSummary | undefined,
): subject is CockpitSubjectSummary {
  return subject !== undefined;
}

export function isExpenseOnlySubject(slug: CockpitSubjectSlug): boolean {
  return slug === 'home' || slug === 'car';
}

export function isIncomeOnlySubject(slug: CockpitSubjectSlug): boolean {
  return slug === 'salaries';
}

export function isCockpitSubjectSlug(
  value: string | undefined,
): value is CockpitSubjectSlug {
  return (
    value !== undefined &&
    COCKPIT_SUBJECT_SLUGS.some((subjectSlug) => subjectSlug === value)
  );
}
