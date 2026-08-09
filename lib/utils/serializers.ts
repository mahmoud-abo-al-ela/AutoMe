// Data serialization utilities
import type { User, Car, TestDrive } from "@/lib/generated/prisma";

/** Organization summary as the car/dealership queries select it. */
interface OrgSummary {
  name: string;
  logo: string | null;
  slug: string;
  phone?: string | null;
  address?: string | null;
}

/** A full car row (Prisma model) with the organization relation optionally joined. */
type CarInput = Car & { organization?: OrgSummary | null };

/** A user row carrying the fields serializeUser reads. */
type SerializableUser = Pick<
  User,
  "id" | "clerkId" | "email" | "name" | "imageUrl" | "role"
> & {
  createdAt: Date | string;
  updatedAt: Date | string;
};

/** Loosely-shaped car used where only some fields are selected. */
type PartialCarInput = Record<string, unknown> & {
  price?: unknown;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export function serializeCar(car: CarInput | null) {
  if (!car) return null;

  return {
    ...car,
    price: parseFloat(car.price.toString()),
    createdAt:
      car.createdAt instanceof Date
        ? car.createdAt.toISOString()
        : car.createdAt,
    updatedAt:
      car.updatedAt instanceof Date
        ? car.updatedAt.toISOString()
        : car.updatedAt,
    // Pass through organization data if included in the query
    ...(car.organization && {
      organization: {
        name: car.organization.name,
        logo: car.organization.logo,
        slug: car.organization.slug,
        ...(car.organization.phone && { phone: car.organization.phone }),
        ...(car.organization.address && { address: car.organization.address }),
      },
    }),
  };
}

/**
 * Serialize an array of cars
 */
export function serializeCars(cars: CarInput[]) {
  if (!Array.isArray(cars)) return [];
  return cars.map(serializeCar);
}

/**
 * Serialize car with wishlist status
 */
export function serializeCarWithWishlist(car: CarInput | null, isWishlisted = false) {
  return {
    ...serializeCar(car),
    isWishlisted,
  };
}

/**
 * Serialize partial car object (for cases where only some fields are selected)
 */
export function serializePartialCar(car: PartialCarInput | null) {
  if (!car) return null;

  const serialized: Record<string, unknown> = { ...car };

  // Only serialize fields that exist
  if (car.price !== undefined) {
    serialized.price = parseFloat(String(car.price));
  }
  if (car.createdAt !== undefined && car.createdAt !== null) {
    serialized.createdAt =
      car.createdAt instanceof Date
        ? car.createdAt.toISOString()
        : car.createdAt;
  }
  if (car.updatedAt !== undefined && car.updatedAt !== null) {
    serialized.updatedAt =
      car.updatedAt instanceof Date
        ? car.updatedAt.toISOString()
        : car.updatedAt;
  }

  return serialized;
}

/**
 * Serialize car with images formatted for display
 */
export function serializeCarWithImages(car: CarInput | null) {
  const serialized = serializeCar(car);
  if (!serialized) return null;

  return {
    ...serialized,
    images: serialized.images.map((url) => ({
      url,
      alt: `${car?.make} ${car?.model}`,
    })),
  };
}

/**
 * Serialize user object (remove sensitive data)
 */
export function serializeUser(user: SerializableUser | null) {
  if (!user) return null;

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    role: user.role,
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : user.createdAt,
    updatedAt:
      user.updatedAt instanceof Date
        ? user.updatedAt.toISOString()
        : user.updatedAt,
  };
}

/** A test drive row with car/user relations optionally joined. */
type TestDriveInput = TestDrive & {
  car?: PartialCarInput | null;
  user?: SerializableUser | null;
  date?: Date | string | null;
};

/**
 * Serialize test drive object
 */
export function serializeTestDrive(testDrive: TestDriveInput | null) {
  if (!testDrive) return null;

  return {
    ...testDrive,
    date:
      testDrive.date instanceof Date
        ? testDrive.date.toISOString()
        : testDrive.date,
    createdAt:
      testDrive.createdAt instanceof Date
        ? testDrive.createdAt.toISOString()
        : testDrive.createdAt,
    updatedAt:
      testDrive.updatedAt instanceof Date
        ? testDrive.updatedAt.toISOString()
        : testDrive.updatedAt,
    car: testDrive.car ? serializePartialCar(testDrive.car) : null,
    user: testDrive.user ? serializeUser(testDrive.user) : null,
  };
}

/** Participant / message / conversation shapes (legacy chat serializers). */
interface ParticipantInput {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  role: unknown;
}

interface MessageInput extends Record<string, unknown> {
  createdAt?: Date | string | null;
  readAt?: Date | string | null;
  sender?: SerializableUser | null;
}

interface ConversationInput extends Record<string, unknown> {
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  car?: PartialCarInput | null;
  participants?: ParticipantInput[];
  messages?: MessageInput[];
}

/**
 * Serialize conversation object
 */
export function serializeConversation(conversation: ConversationInput | null) {
  if (!conversation) return null;

  // Participants are partial user objects, don't use full serializeUser
  const serializeParticipant = (p: ParticipantInput) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    imageUrl: p.imageUrl,
    role: p.role,
  });

  return {
    ...conversation,
    createdAt:
      conversation.createdAt instanceof Date
        ? conversation.createdAt.toISOString()
        : conversation.createdAt,
    updatedAt:
      conversation.updatedAt instanceof Date
        ? conversation.updatedAt.toISOString()
        : conversation.updatedAt,
    car: conversation.car ? serializePartialCar(conversation.car) : null,
    participants: conversation.participants
      ? conversation.participants.map(serializeParticipant)
      : [],
    messages: conversation.messages
      ? conversation.messages.map(serializeMessage)
      : [],
    lastMessage: conversation.messages?.[0]
      ? serializeMessage(conversation.messages[0])
      : null,
  };
}

/**
 * Serialize message object
 */
export function serializeMessage(message: MessageInput | null) {
  if (!message) return null;

  return {
    ...message,
    createdAt:
      message.createdAt instanceof Date
        ? message.createdAt.toISOString()
        : message.createdAt,
    readAt:
      message.readAt instanceof Date
        ? message.readAt.toISOString()
        : message.readAt,
    sender: message.sender ? serializeUser(message.sender) : null,
  };
}
