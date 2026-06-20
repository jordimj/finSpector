import {
  Baby,
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Bus,
  Car,
  CarTaxiFront,
  CircleParking,
  Coffee,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Laptop,
  Landmark,
  Music,
  Pill,
  Plane,
  ReceiptText,
  Scissors,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Sofa,
  Ticket,
  Utensils,
  Wallet,
  WashingMachine,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { TransactionType } from '@finance/shared';

export const categoryColors = [
  '#b8befd',
  '#4ade80',
  '#ffc4d8',
  '#818cf8',
  '#67e8f9',
  '#fbbf24',
  '#60a5fa',
  '#f472b6',
] as const;

type IconMatch = {
  icon: LucideIcon;
  matches: string[];
};

type TransactionIconOptions = {
  category: string;
  subcategory: string | null;
  type: TransactionType;
};

const iconMatches: IconMatch[] = [
  {
    icon: ShoppingBasket,
    matches: ['compra', 'fleca', 'fruiteria', 'supermercat', 'verdures'],
  },
  {
    icon: Utensils,
    matches: [
      'berenar',
      'esmorzar',
      'gelat',
      'menjar',
      'restaurant',
      'reposteria',
      'snack',
      'takeaway',
    ],
  },
  {
    icon: Coffee,
    matches: ['alcohol', 'beguda', 'cafe', 'cervesa'],
  },
  {
    icon: Pill,
    matches: ['farmacia', 'psoriasi'],
  },
  {
    icon: HeartPulse,
    matches: ['higiene', 'psicologa', 'salut'],
  },
  {
    icon: Dumbbell,
    matches: ['gym', 'gimnas', 'spa'],
  },
  {
    icon: Bus,
    matches: ['bus', 'metro', 't10'],
  },
  {
    icon: CarTaxiFront,
    matches: ['taxi'],
  },
  {
    icon: Fuel,
    matches: ['fuel', 'gasolina'],
  },
  {
    icon: CircleParking,
    matches: ['aparcament', 'parking', 'parquing'],
  },
  {
    icon: Car,
    matches: ['cotxe', 'peatge', 'transport'],
  },
  {
    icon: Plane,
    matches: ['avio', 'avions', 'travel', 'trip'],
  },
  {
    icon: Building2,
    matches: ['allotjament', 'hotel'],
  },
  {
    icon: Home,
    matches: ['casa', 'comunitat pis', 'hipoteca', 'lloguer', 'pis'],
  },
  {
    icon: Hammer,
    matches: ['acondicionament', 'derrama', 'obra', 'obres'],
  },
  {
    icon: Sofa,
    matches: ['mobles'],
  },
  {
    icon: WashingMachine,
    matches: ['electrodomestics', 'neteja'],
  },
  {
    icon: Zap,
    matches: ['aigua', 'calefaccio', 'llum'],
  },
  {
    icon: Wifi,
    matches: ['fibra', 'internet', 'simyo', 'wifi'],
  },
  {
    icon: GraduationCap,
    matches: ['afa', 'educacio', 'escola', 'formacio'],
  },
  {
    icon: BookOpen,
    matches: ['llibre', 'llibres'],
  },
  {
    icon: Baby,
    matches: ['escola bressol', 'joguines', 'nil'],
  },
  {
    icon: Ticket,
    matches: ['cine', 'concert', 'loteria', 'teatre', 'ticket'],
  },
  {
    icon: Music,
    matches: ['musica'],
  },
  {
    icon: Gamepad2,
    matches: ['activitats', 'hobby', 'plataformes'],
  },
  {
    icon: Shirt,
    matches: ['roba'],
  },
  {
    icon: Scissors,
    matches: ['perruqueria'],
  },
  {
    icon: ShieldCheck,
    matches: ['asseguranca', 'seguro'],
  },
  {
    icon: Landmark,
    matches: ['amortitzacio', 'ibi', 'renda'],
  },
  {
    icon: Laptop,
    matches: ['tech', 'tecnologia'],
  },
  {
    icon: Gift,
    matches: ['donacio', 'donacions', 'regal', 'regals'],
  },
  {
    icon: Banknote,
    matches: ['nomina', 'salari'],
  },
  {
    icon: Wallet,
    matches: ['caixer', 'transfe'],
  },
  {
    icon: ShoppingBag,
    matches: ['compres'],
  },
  {
    icon: BriefcaseBusiness,
    matches: ['feina'],
  },
];

export function getCategoryColor(index: number): string {
  return categoryColors[index % categoryColors.length] ?? categoryColors[0];
}

export function getCategoryIcon(category: string): LucideIcon {
  return findIcon(category) ?? ReceiptText;
}

export function getTransactionIcon({
  category,
  subcategory,
  type,
}: TransactionIconOptions): LucideIcon {
  return (
    findIcon(subcategory) ??
    findIcon(category) ??
    (type === 'income' ? Banknote : ReceiptText)
  );
}

function findIcon(value: string | null | undefined): LucideIcon | undefined {
  const normalizedValue = normalizeIconText(value);

  if (normalizedValue.length === 0) {
    return undefined;
  }

  const match = iconMatches.find((item) =>
    item.matches.some((token) =>
      normalizedValue.includes(normalizeIconText(token)),
    ),
  );

  return match?.icon;
}

function normalizeIconText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}
