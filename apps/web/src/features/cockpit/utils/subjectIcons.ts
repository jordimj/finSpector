import {
  Banknote,
  Building2,
  Car,
  CircleParking,
  Home,
  type LucideIcon,
} from 'lucide-react';
import type { CockpitSubjectSlug } from '@finance/shared';

export const subjectIcons = {
  car: Car,
  flat: Building2,
  home: Home,
  parking: CircleParking,
  salaries: Banknote,
} satisfies Record<CockpitSubjectSlug, LucideIcon>;
