import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

// Middlewares
import { errorMiddleware } from "./middlewares/error.middleware";

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

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app: Application = express();

// Global middlewares
app.use(compression()); // Compress all responses
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

app.use("/api/upload", uploadRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get("/", (_req, res) => {
  res.json({ status: "Menu API running 🚀" });
});

// Routes
app.use("/api/restaurants", restaurantsRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/branches", branchFacilitiesRoutes); // Mount at /api/branches to extend branch routes
app.use("/api", menuImagesRoutes); // Mount at /api because the router has specific paths
app.use("/api", restaurantPhotosRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/votes", votesRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/facilities", facilitiesRoutes);
app.use("/api/areas", areasRoutes);

// Global error handler (MUST be last)
app.use(errorMiddleware);

export default app;
