export interface PaletaConfig {
  id: string;
  label: string;
  swatch: string;
}

export const DEFAULT_PALETTE_ID = 'calmo';

export const PALETAS: PaletaConfig[] = [{ id: 'calmo', label: 'Calmo', swatch: '#2f6f6b' }];
