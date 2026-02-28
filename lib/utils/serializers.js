// Data serialization utilities

export function serializeCar(car) {
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
 * @param {Array} cars - Array of car objects
 * @returns {Array} Array of serialized car objects
 */
export function serializeCars(cars) {
  if (!Array.isArray(cars)) return [];
  return cars.map(serializeCar);
}

/**
 * Serialize car with wishlist status
 * @param {Object} car - Car object
 * @param {boolean} isWishlisted - Whether car is in user's wishlist
 * @returns {Object} Serialized car with wishlist status
 */
export function serializeCarWithWishlist(car, isWishlisted = false) {
  return {
    ...serializeCar(car),
    isWishlisted,
  };
}

/**
 * Serialize partial car object (for cases where only some fields are selected)
 * @param {Object} car - Partial car object from database
 * @returns {Object} Serialized partial car object
 */
export function serializePartialCar(car) {
  if (!car) return null;

  const serialized = { ...car };

  // Only serialize fields that exist
  if (car.price !== undefined) {
    serialized.price = parseFloat(car.price.toString());
  }
  if (car.createdAt !== undefined) {
    serialized.createdAt =
      car.createdAt instanceof Date
        ? car.createdAt.toISOString()
        : car.createdAt;
  }
  if (car.updatedAt !== undefined) {
    serialized.updatedAt =
      car.updatedAt instanceof Date
        ? car.updatedAt.toISOString()
        : car.updatedAt;
  }

  return serialized;
}

/**
 * Serialize car with images formatted for display
 * @param {Object} car - Car object
 * @returns {Object} Serialized car with formatted images
 */
export function serializeCarWithImages(car) {
  const serialized = serializeCar(car);

  return {
    ...serialized,
    images: serialized.images.map((url) => ({
      url,
      alt: `${car.make} ${car.model}`,
    })),
  };
}

/**
 * Serialize user object (remove sensitive data)
 * @param {Object} user - User object from database
 * @returns {Object} Serialized user object
 */
export function serializeUser(user) {
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

/**
 * Serialize test drive object
 * @param {Object} testDrive - Test drive object from database
 * @returns {Object} Serialized test drive object
 */
export function serializeTestDrive(testDrive) {
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

/**
 * Serialize conversation object
 * @param {Object} conversation - Conversation object from database
 * @returns {Object} Serialized conversation object
 */
export function serializeConversation(conversation) {
  if (!conversation) return null;

  // Participants are partial user objects, don't use full serializeUser
  const serializeParticipant = (p) => ({
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
 * @param {Object} message - Message object from database
 * @returns {Object} Serialized message object
 */
export function serializeMessage(message) {
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
