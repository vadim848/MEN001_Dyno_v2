// S1 catalog tests (SCENARIO_CATALOG.md). Target: env CATALOG_SAL_DIR; stage filter: env CATALOG_STAGES.
import {register} from '../helpers/catalog-program.js';
import {B} from './lib/g.js';
register(B);
