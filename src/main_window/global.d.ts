import type { AuthApi } from '../shared/auth';
import type { CatalogApi } from '../shared/catalog';
import type { PlayerApi } from '../shared/player';

declare global {
  interface Window {
    auth: AuthApi;
    catalog: CatalogApi;
    player: PlayerApi;
  }
}
