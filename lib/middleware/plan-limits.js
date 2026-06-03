import { db } from "@/lib/prisma";

export const RESOURCE_CONFIG = {
  cars: {
    planField: "maxCars",
    countQuery: (orgId) => db.car.count({ where: { organizationId: orgId } }),
    label: "cars",
    upgradeMessage: "Upgrade your plan to add more cars to your inventory.",
  },
  members: {
    planField: "maxMembers",
    countQuery: (orgId) => db.membership.count({ where: { organizationId: orgId } }),
    label: "team members",
    upgradeMessage: "Upgrade your plan to invite more team members.",
  },
  aiProcessing: {
    planField: null, // uses features.aiProcessing.limit
    featureKey: "aiProcessing",
    countQuery: async (orgId) => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      return db.auditLog.count({
        where: {
          organizationId: orgId,
          action: "CAR_CREATED", // For now we consider CAR_CREATED as consuming 1 AI processing
          createdAt: {
            gte: startOfMonth,
          },
        }
      });
    },
    label: "AI processing requests",
    upgradeMessage: "Upgrade your plan for more AI-powered image processing.",
  },
};
