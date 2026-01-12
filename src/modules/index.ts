
import { Router } from "express";
import usersRoutes from "./users/user.routes";
import restaurantsRoutes from "../modules/restaurants/restaurants.routes";
import branchesRoutes from "../modules/branches/branches.routes";
import categoriesRoutes from "../modules/categories/categories.routes";
import restaurantCategoriesRoutes from "../modules/restaurantCategories/restaurantCategories.routes";
import facilitiesRoutes from "../modules/facilities/facilities.routes";
import branchFacilitiesRoutes from "../modules/branchFacilities/branchFacilities.routes";
import offersRoutes from "../modules/offers/offers.routes";
import votesRoutes from "./votes/vote.routes";
import areasRoutes from "../modules/areas/areas.routes";
import menuImagesRoutes from "../modules/menuImages/menuImage.routes";
import uploadRoutes from "../modules/uploader/uploader.routes";

const router = Router();

router.use("/users", usersRoutes);
router.use("/restaurants", restaurantsRoutes);
router.use("/branches", branchesRoutes);
router.use("/categories", categoriesRoutes);
router.use("/restaurant-categories", restaurantCategoriesRoutes);
router.use("/facilities", facilitiesRoutes);
router.use("/branch-facilities", branchFacilitiesRoutes);
router.use("/offers", offersRoutes);
router.use("/votes", votesRoutes);
router.use("/areas", areasRoutes);
router.use("/menu-images", menuImagesRoutes);
router.use("/uploader", uploadRoutes);


export default router;
