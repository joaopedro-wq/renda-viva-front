import type { ShellNavItem } from 'bandeira-shell';
import {
  LucideBanknote,
  LucideHouse,
  LucideReceipt,
  LucideShoppingCart,
  LucideUploadCloud,
} from '@lucide/angular';

export const NAV_ITEMS: ShellNavItem[] = [
  { path: '/dashboard', label: 'Painel', icon: LucideHouse },
  { path: '/rendas', label: 'Rendas', icon: LucideBanknote },
  { path: '/gastos', label: 'Gastos', icon: LucideShoppingCart },
  { path: '/obrigacoes-fixas', label: 'Obrigações fixas', icon: LucideReceipt },
  { path: '/importacao', label: 'Importar extrato', icon: LucideUploadCloud },
];
