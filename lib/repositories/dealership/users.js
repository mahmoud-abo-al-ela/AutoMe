// Dealership users repository functions
import { db } from "@/lib/prisma";

/**
 * Find users with search and pagination
 */
export async function findManyUsers(search = "", pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ],
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  return {
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
    pagination: {
      total,
      page,
      limit,
    },
  };
}

/**
 * Update user role
 */
export async function updateUserRole(userId, role) {
  await db.user.update({
    where: { id: userId },
    data: { role },
  });
}

/**
 * Delete user
 */
export async function deleteUserById(userId) {
  await db.user.delete({
    where: { id: userId },
  });
}
