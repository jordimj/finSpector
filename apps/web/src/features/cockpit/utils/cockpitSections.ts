import type { CockpitSubjectSlug } from '@finance/shared';

export type CockpitSection = {
  title: string;
  slugs: CockpitSubjectSlug[];
};

export const cockpitSections = [
  {
    title: 'Grouped expenses',
    slugs: ['home', 'car'],
  },
  {
    title: 'Salaries',
    slugs: ['salaries'],
  },
  {
    title: 'Properties',
    slugs: ['flat', 'parking'],
  },
] satisfies CockpitSection[];
