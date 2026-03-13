import "dotenv/config";

import { db } from "../db/client";
import {
  areas,
  branches,
  branchFacilities,
  categories,
  facilities,
  menuImages,
  restaurantPhotos,
  offers,
  restaurants,
  restaurantCategories,
  users,
} from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function clearExisting() {
  console.log("Clearing existing data...");

  // Order matters because of FKs
  await db.delete(menuImages);
  await db.delete(restaurantPhotos);
  await db.delete(restaurantCategories);
  await db.delete(branchFacilities);
  await db.delete(offers);
  await db.delete(branches);
  await db.delete(restaurants);
  await db.delete(categories);
  await db.delete(facilities);
  await db.delete(areas);
  await db.delete(users);
}

async function seedUsers() {
  console.log("Seeding users...");
  const passwordHash = await bcrypt.hash("password123", 10);
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  const [user] = await db
    .insert(users)
    .values({
      name: "Demo User",
      email: "demo@menu.app",
      password: passwordHash,
      role: "user",
    })
    .onConflictDoNothing()
    .returning();

  await db
    .insert(users)
    .values({
      name: "Admin User",
      email: "admin@menu.app",
      password: adminPasswordHash,
      role: "admin",
    })
    .onConflictDoNothing()
    .returning();

  return user;
}

async function seedAreas() {
  console.log("Seeding areas...");
  const [downtown] = await db
    .insert(areas)
    .values({
      name_en: "Downtown",
      name_ar: "وسط البلد",
    })
    .returning();

  const [west] = await db
    .insert(areas)
    .values({
      name_en: "West Amman",
      name_ar: "غرب عمان",
    })
    .returning();

  return { downtown, west };
}

async function seedFacilities() {
  console.log("Seeding facilities...");
  const [wifi] = await db
    .insert(facilities)
    .values({
      name_en: "Free Wi-Fi",
      name_ar: "واي فاي مجاني",
      icon: "wifi",
    })
    .returning();

  const [parking] = await db
    .insert(facilities)
    .values({
      name_en: "Parking",
      name_ar: "مواقف سيارات",
      icon: "parking",
    })
    .returning();

  const [kids] = await db
    .insert(facilities)
    .values({
      name_en: "Kids Area",
      name_ar: "منطقة أطفال",
      icon: "kids",
    })
    .returning();

  return { wifi, parking, kids };
}

async function seedCategories() {
  console.log("Seeding categories...");
  const [burgers] = await db
    .insert(categories)
    .values({
      nameEn: "Burgers",
      nameAr: "برغر",
      descriptionEn: "Burger and fast casual spots",
      descriptionAr: "مطاعم البرغر والوجبات السريعة",
      icon: "burger",
      imageUrl: null,
      displayOrder: 1,
      isActive: 1,
    })
    .returning();

  const [coffee] = await db
    .insert(categories)
    .values({
      nameEn: "Coffee",
      nameAr: "قهوة",
      descriptionEn: "Cafés and coffee houses",
      descriptionAr: "المقاهي ومحلات القهوة",
      icon: "coffee",
      imageUrl: null,
      displayOrder: 2,
      isActive: 1,
    })
    .returning();

  const [dessert] = await db
    .insert(categories)
    .values({
      nameEn: "Dessert",
      nameAr: "حلويات",
      descriptionEn: "Dessert, cakes, ice cream",
      descriptionAr: "حلويات، كيك، آيس كريم",
      icon: "dessert",
      imageUrl: null,
      displayOrder: 3,
      isActive: 1,
    })
    .returning();
  const [shawarma] = await db
    .insert(categories)
    .values({
      nameEn: "Shawarma",
      nameAr: "شاورما",
      descriptionEn: "Middle Eastern grills and shawarma.",
      descriptionAr: "مطاعم الشاورما والمشاوي.",
      icon: "shawarma",
      imageUrl: null,
      displayOrder: 4,
      isActive: 1,
    })
    .returning();

  const [pizza] = await db
    .insert(categories)
    .values({
      nameEn: "Pizza",
      nameAr: "بيتزا",
      descriptionEn: "Pizzerias and Italian casual.",
      descriptionAr: "مطاعم البيتزا والمأكولات الإيطالية.",
      icon: "pizza",
      imageUrl: null,
      displayOrder: 5,
      isActive: 1,
    })
    .returning();

  const [asian] = await db
    .insert(categories)
    .values({
      nameEn: "Asian",
      nameAr: "آسيوي",
      descriptionEn: "Sushi, noodles and Asian fusion.",
      descriptionAr: "سوشي، نودلز ومطابخ آسيوية متنوعة.",
      icon: "asian",
      imageUrl: null,
      displayOrder: 6,
      isActive: 1,
    })
    .returning();

  const [breakfast] = await db
    .insert(categories)
    .values({
      nameEn: "Breakfast & Brunch",
      nameAr: "فطور وبرنش",
      descriptionEn: "Breakfast spots and brunch cafés.",
      descriptionAr: "مطاعم ومقاهي الفطور والبرنش.",
      icon: "breakfast",
      imageUrl: null,
      displayOrder: 7,
      isActive: 1,
    })
    .returning();

  return { burgers, coffee, dessert, shawarma, pizza, asian, breakfast };
}

async function seedRestaurants(args: {
  burgersId: string;
  coffeeId: string;
  dessertId: string;
  shawarmaId: string;
  pizzaId: string;
  asianId: string;
  breakfastId: string;
}) {
  console.log("Seeding restaurants...");

  const [burgerHub] = await db
    .insert(restaurants)
    .values({
      name_en: "Burger Hub",
      name_ar: "برغر هب",
      description_en: "Craft burgers & fries.",
      description_ar: "برغر مميز وبطاطا مقلية.",
      logoUrl: null,
      phone: "+962790000001",
    })
    .returning();

  const [javaHouse] = await db
    .insert(restaurants)
    .values({
      name_en: "Java House",
      name_ar: "جافا هاوس",
      description_en: "Specialty coffee and pastries.",
      description_ar: "قهوة مميزة ومعجنات.",
      logoUrl: null,
      phone: "+962790000002",
    })
    .returning();

  const [sweetSpot] = await db
    .insert(restaurants)
    .values({
      name_en: "Sweet Spot",
      name_ar: "سويت سبوت",
      description_en: "Dessert bar and gelato.",
      description_ar: "حلويات وجيلاتو.",
      logoUrl: null,
      phone: "+962790000003",
    })
    .returning();

  const [shawarmaKing] = await db
    .insert(restaurants)
    .values({
      name_en: "Shawarma King",
      name_ar: "شاورما كينغ",
      description_en: "Classic chicken and beef shawarma.",
      description_ar: "شاورما دجاج ولحم على الطريقة التقليدية.",
      logoUrl: null,
      phone: "+962790000004",
    })
    .returning();

  const [pizzaPalace] = await db
    .insert(restaurants)
    .values({
      name_en: "Pizza Palace",
      name_ar: "بيتزا بالاس",
      description_en: "Wood-fired pizzas and pasta.",
      description_ar: "بيتزا على الحطب ومكرونات.",
      logoUrl: null,
      phone: "+962790000005",
    })
    .returning();

  const [sushiCorner] = await db
    .insert(restaurants)
    .values({
      name_en: "Sushi Corner",
      name_ar: "سوشي كورنر",
      description_en: "Rolls, sashimi and poke bowls.",
      description_ar: "لفائف السوشي، الساشيمي وأطباق البوكي.",
      logoUrl: null,
      phone: "+962790000006",
    })
    .returning();

  const [sunriseCafe] = await db
    .insert(restaurants)
    .values({
      name_en: "Sunrise Café",
      name_ar: "صن رايز كافيه",
      description_en: "All‑day breakfast and brunch.",
      description_ar: "فطور وبرنش طوال اليوم.",
      logoUrl: null,
      phone: "+962790000007",
    })
    .returning();

  // Attach categories (many-to-many)
  await db.insert(restaurantCategories).values([
    {
      restaurantId: burgerHub.id,
      categoryId: args.burgersId,
    },
    {
      restaurantId: javaHouse.id,
      categoryId: args.coffeeId,
    },
    {
      restaurantId: sweetSpot.id,
      categoryId: args.dessertId,
    },
    {
      restaurantId: shawarmaKing.id,
      categoryId: args.shawarmaId,
    },
    {
      restaurantId: pizzaPalace.id,
      categoryId: args.pizzaId,
    },
    {
      restaurantId: sushiCorner.id,
      categoryId: args.asianId,
    },
    {
      restaurantId: sunriseCafe.id,
      categoryId: args.breakfastId,
    },
  ]);

  const restaurantsWithIds = {
    burgerHub,
    javaHouse,
    sweetSpot,
    shawarmaKing,
    pizzaPalace,
    sushiCorner,
    sunriseCafe,
  };

  console.log("Seeding restaurant photos...");
  const samplePhotos: string[] = [
    "https://picsum.photos/800/600?photo=1",
    "https://picsum.photos/800/600?photo=2",
    "https://picsum.photos/800/600?photo=3",
  ];

  const allRestaurantIds: string[] = Object.values(restaurantsWithIds).map(
    (r) => r.id as string,
  );

  for (const restaurantId of allRestaurantIds) {
    const values = samplePhotos.map((url, index) => ({
      restaurantId,
      imageUrl: url,
      caption: null,
      displayOrder: index + 1,
      isActive: 1,
    }));
    // eslint-disable-next-line no-await-in-loop
    await db.insert(restaurantPhotos).values(values as any);
  }

  return restaurantsWithIds;
}

async function seedBranches(args: {
  burgerHubId: string;
  javaHouseId: string;
  sweetSpotId: string;
  shawarmaKingId: string;
  pizzaPalaceId: string;
  sushiCornerId: string;
  sunriseCafeId: string;
  downtownAreaId: string;
  westAreaId: string;
  wifiId: string;
  parkingId: string;
  kidsId: string;
}) {
  console.log("Seeding branches...");

  const [burgerDowntown] = await db
    .insert(branches)
    .values({
      restaurantId: args.burgerHubId,
      areaId: args.downtownAreaId,
      name_en: "Downtown Branch",
      name_ar: "فرع وسط البلد",
      address: "Downtown Street 1",
      latitude: "31.9566",
      longitude: "35.9457",
      costLevel: 2,
      isOpen: 1,
    })
    .returning();

  const [burgerWest] = await db
    .insert(branches)
    .values({
      restaurantId: args.burgerHubId,
      areaId: args.westAreaId,
      name_en: "West Amman Branch",
      name_ar: "فرع غرب عمان",
      address: "West Amman Boulevard",
      latitude: "31.9632",
      longitude: "35.8770",
      costLevel: 3,
      isOpen: 1,
    })
    .returning();

  const [javaDowntown] = await db
    .insert(branches)
    .values({
      restaurantId: args.javaHouseId,
      areaId: args.downtownAreaId,
      name_en: "Java Downtown",
      name_ar: "جافا وسط البلد",
      address: "Downtown Plaza",
      latitude: "31.9550",
      longitude: "35.9390",
      costLevel: 2,
      isOpen: 1,
    })
    .returning();

  const [sweetWest] = await db
    .insert(branches)
    .values({
      restaurantId: args.sweetSpotId,
      areaId: args.westAreaId,
      name_en: "Sweet Spot West",
      name_ar: "سويت سبوت غرب",
      address: "West Mall",
      latitude: "31.9645",
      longitude: "35.8810",
      costLevel: 3,
      isOpen: 1,
    })
    .returning();

  const [shawarmaDowntown] = await db
    .insert(branches)
    .values({
      restaurantId: args.shawarmaKingId,
      areaId: args.downtownAreaId,
      name_en: "Shawarma King Downtown",
      name_ar: "شاورما كينغ وسط البلد",
      address: "Zahran Street 5",
      latitude: "31.9530",
      longitude: "35.9100",
      costLevel: 1,
      isOpen: 1,
    })
    .returning();

  const [pizzaDowntown] = await db
    .insert(branches)
    .values({
      restaurantId: args.pizzaPalaceId,
      areaId: args.downtownAreaId,
      name_en: "Pizza Palace Downtown",
      name_ar: "بيتزا بالاس وسط البلد",
      address: "Rainbow Street 12",
      latitude: "31.9515",
      longitude: "35.9320",
      costLevel: 2,
      isOpen: 1,
    })
    .returning();

  const [sushiWest] = await db
    .insert(branches)
    .values({
      restaurantId: args.sushiCornerId,
      areaId: args.westAreaId,
      name_en: "Sushi Corner Boulevard",
      name_ar: "سوشي كورنر بوليفارد",
      address: "Boulevard Mall",
      latitude: "31.9690",
      longitude: "35.8800",
      costLevel: 4,
      isOpen: 1,
    })
    .returning();

  const [sunriseWest] = await db
    .insert(branches)
    .values({
      restaurantId: args.sunriseCafeId,
      areaId: args.westAreaId,
      name_en: "Sunrise Café West",
      name_ar: "صن رايز كافيه غرب",
      address: "Abdoun Circle",
      latitude: "31.9555",
      longitude: "35.8600",
      costLevel: 2,
      isOpen: 1,
    })
    .returning();

  // Attach facilities
  await db.insert(branchFacilities).values([
    { branchId: burgerDowntown.id, facilityId: args.wifiId },
    { branchId: burgerDowntown.id, facilityId: args.parkingId },
    { branchId: burgerWest.id, facilityId: args.parkingId },
    { branchId: javaDowntown.id, facilityId: args.wifiId },
    { branchId: sweetWest.id, facilityId: args.wifiId },
    { branchId: sweetWest.id, facilityId: args.kidsId },
    { branchId: shawarmaDowntown.id, facilityId: args.parkingId },
    { branchId: pizzaDowntown.id, facilityId: args.parkingId },
    { branchId: sushiWest.id, facilityId: args.wifiId },
    { branchId: sunriseWest.id, facilityId: args.wifiId },
  ]);

  const branchesWithIds = {
    burgerDowntown,
    burgerWest,
    javaDowntown,
    sweetWest,
    shawarmaDowntown,
    pizzaDowntown,
    sushiWest,
    sunriseWest,
  };

  // Seed simple menu images for each branch using placeholder URLs
  console.log("Seeding menu images...");
  const sampleImages: string[] = [
    "https://picsum.photos/800/1200?menu=1",
    "https://picsum.photos/800/1200?menu=2",
    "https://picsum.photos/800/1200?menu=3",
  ];

  const allBranchIds: string[] = Object.values(branchesWithIds).map(
    (b) => b.id as string,
  );

  for (finalBranchId of allBranchIds) {
    const values = sampleImages.map((url, index) => ({
      branchId: finalBranchId,
      imageUrl: url,
      displayOrder: index + 1,
      isActive: 1,
    }));
    // eslint-disable-next-line no-await-in-loop
    await db.insert(menuImages).values(values as any);
  }

  return branchesWithIds;
}

async function seedOffers(restaurantIds: string[]) {
  console.log("Seeding offers...");
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(offers).values(
    [
      {
        restaurantId: restaurantIds[0],
        title: "2x1 Burger Tuesdays",
        description: "Buy one burger, get another free every Tuesday.",
        imageUrl: null,
        startDate: now,
        endDate: nextMonth,
      },
      {
        restaurantId: restaurantIds[1],
        title: "Happy Hour Coffee",
        description: "50% off espresso-based drinks from 5–7 PM.",
        imageUrl: null,
        startDate: now,
        endDate: nextMonth,
      },
      {
        restaurantId: restaurantIds[2],
        title: "Dessert Sampler",
        description: "Try three desserts for the price of two.",
        imageUrl: null,
        startDate: now,
        endDate: nextMonth,
      },
      {
        restaurantId: restaurantIds[3],
        title: "Family Shawarma Combo",
        description: "Family platter with 4 sandwiches, fries and drinks.",
        imageUrl: null,
        startDate: now,
        endDate: nextMonth,
      },
      {
        restaurantId: restaurantIds[4],
        title: "Pizza Night",
        description: "Any large pizza + free appetizer.",
        imageUrl: null,
        startDate: now,
        endDate: nextMonth,
      },
      {
        restaurantId: restaurantIds[5],
        title: "Sushi Wednesday",
        description: "All‑you‑can‑eat sushi rolls every Wednesday.",
        imageUrl: null,
        startDate: now,
        endDate: nextMonth,
      },
      {
        restaurantId: restaurantIds[6],
        title: "Brunch Bundle",
        description: "Brunch for two with coffee included.",
        imageUrl: null,
        startDate: now,
        endDate: nextMonth,
      },
    ] as any,
  );
}

async function main() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set. Create config.env with a valid URL.");
    }

    console.log("Using database:", process.env.DATABASE_URL);

    await clearExisting();

    const user = await seedUsers();
    const { downtown, west } = await seedAreas();
    const { wifi, parking, kids } = await seedFacilities();
    const {
      burgers,
      coffee,
      dessert,
      shawarma,
      pizza,
      asian,
      breakfast,
    } = await seedCategories();

    const {
      burgerHub,
      javaHouse,
      sweetSpot,
      shawarmaKing,
      pizzaPalace,
      sushiCorner,
      sunriseCafe,
    } = await seedRestaurants({
      burgersId: burgers.id,
      coffeeId: coffee.id,
      dessertId: dessert.id,
      shawarmaId: shawarma.id,
      pizzaId: pizza.id,
      asianId: asian.id,
      breakfastId: breakfast.id,
    });

    await seedBranches({
      burgerHubId: burgerHub.id,
      javaHouseId: javaHouse.id,
      sweetSpotId: sweetSpot.id,
      shawarmaKingId: shawarmaKing.id,
      pizzaPalaceId: pizzaPalace.id,
      sushiCornerId: sushiCorner.id,
      sunriseCafeId: sunriseCafe.id,
      downtownAreaId: downtown.id,
      westAreaId: west.id,
      wifiId: wifi.id,
      parkingId: parking.id,
      kidsId: kids.id,
    });

    await seedOffers([
      burgerHub.id,
      javaHouse.id,
      sweetSpot.id,
      shawarmaKing.id,
      pizzaPalace.id,
      sushiCorner.id,
      sunriseCafe.id,
    ]);

    console.log("Seed completed successfully.");
    console.log("Demo user credentials: demo@menu.app / password123");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    // pg pool will exit with the process
  }
}

main();

