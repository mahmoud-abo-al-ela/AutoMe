import {
  Car,
  Calendar,
  Users,
  Building2,
  MessageSquare,
  CreditCard,
  Settings,
  UserCog,
} from "lucide-react";

export const ACTION_COLORS = {
  CAR_CREATED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CAR_UPDATED:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CAR_DELETED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CAR_STATUS_CHANGED:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  TEST_DRIVE_CREATED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  TEST_DRIVE_CONFIRMED:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  TEST_DRIVE_CANCELED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  MEMBER_INVITED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MEMBER_ACCEPTED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MEMBER_ROLE_CHANGED:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  MEMBER_REMOVED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  SETTINGS_UPDATED:
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  ORG_UPDATED:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ORG_CREATED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ORG_DELETED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  SUBSCRIPTION_CREATED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  SUBSCRIPTION_UPGRADED:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export const ENTITY_ICONS = {
  CAR: Car,
  TEST_DRIVE: Calendar,
  MEMBERSHIP: Users,
  ORGANIZATION: Building2,
  CONVERSATION: MessageSquare,
  SUBSCRIPTION: CreditCard,
  SETTINGS: Settings,
  USER: UserCog,
};
