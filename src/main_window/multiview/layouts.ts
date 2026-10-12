/** At most this many feeds play at once. */
export const MAX_TILES = 4;

export type LayoutId =
  | 'single'
  | 'side-by-side'
  | 'main-1'
  | 'main-2'
  | 'main-3'
  | 'grid';

export interface Layout {
  id: LayoutId;
  label: string;
  tiles: number;
}

/**
 * Layouts like the F1TV multiview. In the main-N layouts the first tile is
 * large and the others stack beside it; see .layout-* in index.css.
 */
export const LAYOUTS: Layout[] = [
  { id: 'single', label: 'Single', tiles: 1 },
  { id: 'side-by-side', label: 'Side by side', tiles: 2 },
  { id: 'main-1', label: 'Main and 1', tiles: 2 },
  { id: 'main-2', label: 'Main and 2', tiles: 3 },
  { id: 'main-3', label: 'Main and 3', tiles: 4 },
  { id: 'grid', label: 'Grid of 4', tiles: 4 },
];
