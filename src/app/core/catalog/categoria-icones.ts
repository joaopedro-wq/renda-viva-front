import {
  LucideBriefcase,
  LucideCar,
  LucideEllipsis,
  LucideGamepad2,
  LucideGraduationCap,
  LucideHeart,
  LucideHeartPulse,
  LucideHouse,
  LucideLaptop,
  LucidePercent,
  LucideRepeat,
  LucideShoppingBag,
  LucideShoppingCart,
  LucideTag,
  LucideTrendingUp,
  LucideUtensils,
  type LucideIcon,
} from '@lucide/angular';


const ICONES_POR_NOME: Record<string, LucideIcon> = {
  utensils: LucideUtensils,
  home: LucideHouse,
  car: LucideCar,
  'heart-pulse': LucideHeartPulse,
  'gamepad-2': LucideGamepad2,
  'graduation-cap': LucideGraduationCap,
  'shopping-bag': LucideShoppingBag,
  repeat: LucideRepeat,
  heart: LucideHeart,
  'more-horizontal': LucideEllipsis,
  briefcase: LucideBriefcase,
  laptop: LucideLaptop,
  'shopping-cart': LucideShoppingCart,
  percent: LucidePercent,
  'trending-up': LucideTrendingUp,
};

export function iconeCategoria(nome: string | null | undefined): LucideIcon {
  if (!nome) return LucideTag;
  return ICONES_POR_NOME[nome] ?? LucideTag;
}
