// ──────────────────────────────────────────────────────────────
// HyperZ — Web Routes
// ──────────────────────────────────────────────────────────────

import { HyperZRouter } from '../../src/http/Router.js';
import { HomeController } from '../controllers/HomeController.js';

const router = new HyperZRouter({ source: 'web' });
const home = new HomeController();

/**
 * Root Landing Page
 */
router.get('/', home.welcome.bind(home));

export default router;
