import { registerApiRoutes } from '../controllers/apiController.js';

export default function mountApiRoutes(app) {
  registerApiRoutes(app);
}
