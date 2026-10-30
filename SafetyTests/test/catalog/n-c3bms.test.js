// Catalog section N (registration only; definitions in lib/n.js) - C3/BMS battery relays switch ON only on a NEW command (Q-C3-1 = Б, Vadim 2026-10-29; Niv gap #1).
// Target: env CATALOG_SAL_DIR; stage filter: env CATALOG_STAGES.
import {register} from '../helpers/catalog-program.js';
import {N} from './lib/n.js';
register(N);
