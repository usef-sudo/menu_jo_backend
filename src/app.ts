import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

// Middlewares
import { errorMiddleware } from "./middlewares/error.middleware";
import { globalApiLimiter } from "./middlewares/rateLimit.middleware";
import { CORS_ORIGINS, ENABLE_SWAGGER, NODE_ENV } from "./config/env";
import { logger } from "./config/logger";

// Module routes
import restaurantsRoutes from "./modules/restaurants/restaurants.routes";
import branchesRoutes from "./modules/branches/branches.routes";
import usersRoutes from "./modules/users/user.routes";
import votesRoutes from "./modules/votes/vote.routes";
import offersRoutes from "./modules/offers/offers.routes";
import categoriesRoutes from "./modules/categories/categories.routes";
import facilitiesRoutes from "./modules/facilities/facilities.routes";
import areasRoutes from "./modules/areas/areas.routes";
import branchFacilitiesRoutes from "./modules/branchFacilities/branchFacilities.routes";
import menuImagesRoutes from "./modules/menuImages/menuImage.routes";
import restaurantPhotosRoutes from "./modules/restaurantPhotos/restaurantPhotos.routes";
import uploadRoutes from "./modules/uploader/uploader.routes";
import reviewsRoutes from "./modules/reviews/reviews.routes";
import favoritesRoutes from "./modules/favorites/favorites.routes";
import healthRoutes from "./modules/health/health.routes";
import restaurantCategoriesRoutes from "./modules/restaurantCategories/restaurantCategories.routes";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app: Application = express();

const corsOptions: cors.CorsOptions =
  CORS_ORIGINS.length > 0
    ? { origin: CORS_ORIGINS, credentials: true }
    : { origin: true, credentials: true };

if (CORS_ORIGINS.length === 0 && NODE_ENV === "production") {
  logger.warn(
    "CORS_ORIGINS is empty — permissive CORS; set CORS_ORIGINS for a strict browser allowlist",
  );
}

// Global middlewares
app.use(compression());
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

app.use(globalApiLimiter);

app.use("/api/upload", uploadRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (ENABLE_SWAGGER) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else if (NODE_ENV === "production") {
  logger.info("Swagger /api/docs disabled (set ENABLE_SWAGGER=true to enable)");
}

// Health (no auth; for load balancers / k8s)
app.use("/api/health", healthRoutes);

// Root
app.get("/", (_req, res) => {
  res.json({ status: "Menu API running 🚀" });
});

// Routes
app.use("/api/restaurants", restaurantsRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/branches", branchFacilitiesRoutes);
app.use("/api", menuImagesRoutes);
app.use("/api", restaurantPhotosRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/votes", votesRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/restaurant-categories", restaurantCategoriesRoutes);
app.use("/api/facilities", facilitiesRoutes);
app.use("/api/areas", areasRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/favorites", favoritesRoutes);

app.use(errorMiddleware);

export default app;
