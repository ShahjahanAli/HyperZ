// ──────────────────────────────────────────────────────────────
// HyperZ — API Routes
// ──────────────────────────────────────────────────────────────

import { HyperZRouter } from '../../src/http/Router.js';
import { HomeController } from '../controllers/HomeController.js';

const router = new HyperZRouter();
const home = new HomeController();

// ── Public Routes ───────────────────────────────────────────

router.get('/', home.index.bind(home));
router.get('/health', home.health.bind(home));

// ── Add your API routes below ───────────────────────────────
// Example:
// import { UserController } from '../controllers/UserController.js';
// const users = new UserController();
// router.resource('/users', users);

export default router;
