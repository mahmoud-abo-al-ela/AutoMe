"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCars({
  page = 1,
  limit = 9,
  search,
  make,
  bodyType,
  fuelType,
  transmission,
  minPrice,
  maxPrice,
  sortBy = "newest",
}) {
  try {
    const { userId } = await auth();
    let userDB = null;
    if (userId) {
      userDB = await db.user.findUnique({
        where: {
          clerkId: userId,
        },
      });
    }

    // Build where clause with all filters
    const where = {
      status: "AVAILABLE",
    };

    // Apply search filter if provided
    if (search && search.trim() !== "") {
      where.OR = [
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Apply additional filters if provided
    if (make) where.make = make;
    if (bodyType) where.bodyType = bodyType;
    if (fuelType) where.fuelType = fuelType;
    if (transmission) where.transmission = transmission;

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const skip = (page - 1) * limit;

    // Determine sort order based on sortBy parameter
    let orderBy = { createdAt: "desc" }; // default sorting (newest)

    if (sortBy === "priceAsc") {
      orderBy = { price: "asc" };
    } else if (sortBy === "priceDesc") {
      orderBy = { price: "desc" };
    }

    const totalCars = await db.car.count({
      where,
    });

    const cars = await db.car.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });

    // Get user's wishlist if logged in
    let wishlist = new Set();
    if (userDB) {
      const savedCars = await db.savedCar.findMany({
        where: {
          userId: userDB.id,
        },
        select: {
          carId: true,
        },
      });
      wishlist = new Set(savedCars.map((car) => car.carId));
    }

    return {
      success: true,
      data: {
        cars: cars.map((car) => ({
          ...car,
          price: parseFloat(car.price.toString()),
          createdAt: car.createdAt.toISOString(),
          updatedAt: car.updatedAt.toISOString(),
          isWishlisted: wishlist.has(car.id),
        })),
        pagination: {
          total: parseInt(totalCars),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCars / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching cars", error);
    return {
      success: false,
      error: "Error fetching cars",
    };
  }
}

export async function getCarsFilters({
  search,
  make,
  bodyType,
  fuelType,
  transmission,
  minPrice,
  maxPrice,
} = {}) {
  try {
    const baseWhere = {
      status: "AVAILABLE",
    };

    if (search && search.trim() !== "") {
      baseWhere.OR = [
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (make) baseWhere.make = make;
    if (bodyType) baseWhere.bodyType = bodyType;
    if (fuelType) baseWhere.fuelType = fuelType;
    if (transmission) baseWhere.transmission = transmission;

    if (minPrice !== undefined || maxPrice !== undefined) {
      baseWhere.price = {};
      if (minPrice !== undefined) baseWhere.price.gte = minPrice;
      if (maxPrice !== undefined) baseWhere.price.lte = maxPrice;
    }

    // Helper function to get distinct values
    const getDistinctValues = async (field) => {
      const excludeField = { ...baseWhere };
      if (excludeField[field]) delete excludeField[field];

      const results = await db.car.findMany({
        where: excludeField,
        select: { [field]: true },
        distinct: [field],
        orderBy: { [field]: "asc" },
      });

      return results.map((item) => item[field]);
    };

    const [makes, bodyTypes, fuelTypes, transmissions] = await Promise.all([
      getDistinctValues("make"),
      getDistinctValues("bodyType"),
      getDistinctValues("fuelType"),
      getDistinctValues("transmission"),
    ]);

    const priceRanges = await db.car.aggregate({
      where: baseWhere,
      _min: { price: true },
      _max: { price: true },
    });

    const totalFilteredCars = await db.car.count({
      where: baseWhere,
    });

    return {
      success: true,
      data: {
        makes,
        bodyTypes,
        fuelTypes,
        transmissions,
        priceRanges: {
          min: priceRanges._min.price
            ? parseFloat(priceRanges._min.price.toString())
            : 0,
          max: priceRanges._max.price
            ? parseFloat(priceRanges._max.price.toString())
            : 1000000,
        },
        totalFilteredCars,
        appliedFilters: {
          search,
          make,
          bodyType,
          fuelType,
          transmission,
          minPrice,
          maxPrice,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching cars filters", error);
    return {
      success: false,
      error: "Error fetching cars filters",
    };
  }
}

export async function toggleWishlist(carId) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const userDB = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (!userDB) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const car = await db.car.findUnique({
      where: {
        id: carId,
      },
    });

    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    const savedCar = await db.savedCar.findUnique({
      where: {
        userId_carId: {
          userId: userDB.id,
          carId,
        },
      },
    });

    if (savedCar) {
      await db.savedCar.delete({
        where: {
          userId_carId: {
            userId: userDB.id,
            carId,
          },
        },
      });
    } else {
      await db.savedCar.create({
        data: {
          userId: userDB.id,
          carId,
        },
      });
    }

    // Revalidate both paths
    revalidatePath("/wishlist");
    revalidatePath("/cars");

    return {
      success: true,
      message: savedCar ? "Car removed from wishlist" : "Car added to wishlist",
    };
  } catch (error) {
    console.error("Error toggling wishlist", error);
    return {
      success: false,
      error: "Error toggling wishlist",
    };
  }
}

export async function getWishlist({ page = 1, limit = 6 } = {}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const userDB = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (!userDB) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Calculate pagination values
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await db.savedCar.count({
      where: {
        userId: userDB.id,
      },
    });

    const savedCars = await db.savedCar.findMany({
      where: {
        userId: userDB.id,
      },
      include: {
        car: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const cars = savedCars.map((savedCar) => ({
      ...savedCar.car,
      price: parseFloat(savedCar.car.price.toString()),
      createdAt: savedCar.car.createdAt.toISOString(),
      updatedAt: savedCar.car.updatedAt.toISOString(),
      isWishlisted: true,
    }));

    return {
      success: true,
      data: {
        cars,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching saved cars", error);
    return {
      success: false,
      error: "Error fetching saved cars",
    };
  }
}
