export interface PaletaConfig {
  id: string;
  label: string;
  swatch: string;
}

export const DEFAULT_PALETTE_ID = 'indigo';

export const PALETAS: PaletaConfig[] = [
  { id: 'indigo', label: 'Índigo', swatch: '#4b4a9e' },
  { id: 'calmo', label: 'Calmo', swatch: '#2f6f6b' },
  { id: 'coral', label: 'Coral', swatch: '#c65a5a' },
  { id: 'ardosia', label: 'Ardósia', swatch: '#c05a4e' },
  { id: 'ameixa', label: 'Ameixa', swatch: '#7d4570' },
];
