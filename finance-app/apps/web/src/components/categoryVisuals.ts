import {
  Banknote,
  Car,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Plane,
  ReceiptText,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

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

const categoryIconMatches: Array<{
  icon: LucideIcon;
  matches: string[];
}> = [
  { icon: Home, matches: ['home', 'house', 'rent', 'mortgage', 'housing'] },
  { icon: Utensils, matches: ['food', 'grocery', 'groceries', 'dining'] },
  { icon: GraduationCap, matches: ['school', 'kid', 'child', 'education'] },
  { icon: Gamepad2, matches: ['fun', 'entertainment', 'game', 'hobby'] },
  { icon: Car, matches: ['car', 'transport', 'fuel', 'gas', 'parking'] },
  { icon: ShoppingBag, matches: ['shop', 'clothing', 'retail'] },
  { icon: HeartPulse, matches: ['health', 'medical', 'fitness'] },
  { icon: Plane, matches: ['travel', 'trip', 'holiday'] },
  { icon: Banknote, matches: ['income', 'salary', 'pay'] },
];

export function getCategoryColor(index: number): string {
  return categoryColors[index % categoryColors.length] ?? categoryColors[0];
}

export function getCategoryIcon(category: string): LucideIcon {
  const normalizedCategory = category.toLowerCase();
  const match = categoryIconMatches.find((item) =>
    item.matches.some((token) => normalizedCategory.includes(token)),
  );

  return match?.icon ?? ReceiptText;
}
