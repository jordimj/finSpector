import { useQuery } from '@tanstack/react-query';
import type {
  CockpitSubjectDetailResponse,
  CockpitSubjectListResponse,
  CockpitSubjectSlug,
} from '@finance/shared';
import { fetchJson } from '../lib/api';
import type { ReportDateRange } from '../types';
import { toReportQueryString } from '../utils';
import { useAccountFilter } from './useAccountFilter';

export function useCockpitSubjects(range: ReportDateRange) {
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: [
      'cockpit',
      'subjects',
      range.startDate ?? null,
      range.endDate ?? null,
      selectedAccount,
    ],
    queryFn: async () => {
      const queryString = toReportQueryString(range, selectedAccount);
      const response = await fetchJson<CockpitSubjectListResponse>({
        path: `/api/cockpit/subjects${queryString ? `?${queryString}` : ''}`,
      });

      return response.subjects;
    },
  });
}

export function useCockpitSubject(
  slug: CockpitSubjectSlug | undefined,
  range: ReportDateRange,
) {
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: [
      'cockpit',
      'subjects',
      slug ?? null,
      range.startDate ?? null,
      range.endDate ?? null,
      selectedAccount,
    ],
    enabled: slug !== undefined,
    queryFn: async () => {
      if (slug === undefined) {
        throw new Error('Missing cockpit subject');
      }

      const queryString = toReportQueryString(range, selectedAccount);
      const response = await fetchJson<CockpitSubjectDetailResponse>({
        path: `/api/cockpit/subjects/${slug}${
          queryString ? `?${queryString}` : ''
        }`,
      });

      return response.subject;
    },
  });
}
