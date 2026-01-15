import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { faker } from "@faker-js/faker";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============ CONSTANTS ============

const CAR_MAKES = [
  {
    make: "Toyota",
    models: ["Camry", "Corolla", "RAV4", "Highlander", "Prius"],
  },
  { make: "Honda", models: ["Civic", "Accord", "CR-V", "Pilot", "HR-V"] },
  { make: "BMW", models: ["3 Series", "5 Series", "X3", "X5", "M4"] },
  {
    make: "Mercedes-Benz",
    models: ["C-Class", "E-Class", "GLC", "GLE", "A-Class"],
  },
  {
    make: "Ford",
    models: ["F-150", "Mustang", "Explorer", "Escape", "Bronco"],
  },
  {
    make: "Chevrolet",
    models: ["Silverado", "Malibu", "Equinox", "Tahoe", "Camaro"],
  },
  { make: "Audi", models: ["A4", "A6", "Q5", "Q7", "e-tron"] },
  {
    make: "Nissan",
    models: ["Altima", "Sentra", "Rogue", "Pathfinder", "Leaf"],
  },
  {
    make: "Hyundai",
    models: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Ioniq"],
  },
  { make: "Kia", models: ["Optima", "Forte", "Sportage", "Sorento", "EV6"] },
];

const BODY_TYPES = [
  "SUV",
  "Sedan",
  "Hatchback",
  "Convertible",
  "Coupe",
  "Wagon",
  "Pickup",
];
const FUEL_TYPES = [
  "Gasoline",
  "Diesel",
  "Electric",
  "Hybrid",
  "Plug-in Hybrid",
];
const TRANSMISSIONS = ["Automatic", "Manual", "Semi-Automatic"];
const COLORS = [
  "Black",
  "White",
  "Silver",
  "Gray",
  "Red",
  "Blue",
  "Green",
  "Brown",
  "Beige",
];
const CAR_STATUSES = ["AVAILABLE", "UNAVAILABLE", "SOLD"] as const;
const TEST_DRIVE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;

// Stock car images from Unsplash (free to use)
const CAR_IMAGES = [
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
  "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
  "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
  "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
  "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
];

const CAR_FEATURES = [
  "Bluetooth",
  "Backup Camera",
  "Navigation System",
  "Leather Seats",
  "Sunroof",
  "Heated Seats",
  "Apple CarPlay",
  "Android Auto",
  "Blind Spot Monitor",
  "Lane Departure Warning",
  "Adaptive Cruise Control",
  "Keyless Entry",
  "Push Button Start",
  "Premium Sound System",
  "Wireless Charging",
  "Parking Sensors",
  "360 Camera",
  "Head-Up Display",
  "Ventilated Seats",
  "Memory Seats",
];

// ============ DEMO ORGANIZATIONS ============

const DEMO_ORGANIZATIONS = [
  {
    name: "AutoMe Cairo",
    slug: "autome-cairo",
    email: "cairo@autome.com",
    phone: "+201012345678",
    address: "Nasr City, Cairo, Egypt",
    description:
      "Premier car dealership in Cairo with the best selection of vehicles.",
  },
  {
    name: "AutoMe Alexandria",
    slug: "autome-alex",
    email: "alex@autome.com",
    phone: "+201123456789",
    address: "Stanley, Alexandria, Egypt",
    description: "Your trusted partner for quality vehicles in Alexandria.",
  },
  {
    name: "AutoMe Giza",
    slug: "autome-giza",
    email: "giza@autome.com",
    phone: "+201234567890",
    address: "6th of October, Giza, Egypt",
    description:
      "Giza's leading automotive destination with exceptional service.",
  },
];

// ============ HELPER FUNCTIONS ============

function generateCar(organizationId: string) {
  const makeData = faker.helpers.arrayElement(CAR_MAKES);
  const model = faker.helpers.arrayElement(makeData.models);
  const year = faker.number.int({ min: 2018, max: 2025 });
  const mileage = faker.number.int({ min: 0, max: 150000 });
  const price = faker.number.int({ min: 15000, max: 150000 });
  const features = faker.helpers.arrayElements(CAR_FEATURES, {
    min: 3,
    max: 10,
  });

  return {
    organizationId,
    make: makeData.make,
    model,
    year,
    price,
    mileage,
    fuelType: faker.helpers.arrayElement(FUEL_TYPES),
    transmission: faker.helpers.arrayElement(TRANSMISSIONS),
    color: faker.helpers.arrayElement(COLORS),
    bodyType: faker.helpers.arrayElement(BODY_TYPES),
    seats: faker.helpers.arrayElement([2, 4, 5, 7, 8]),
    status: faker.helpers.weightedArrayElement([
      { value: "AVAILABLE" as const, weight: 7 },
      { value: "UNAVAILABLE" as const, weight: 2 },
      { value: "SOLD" as const, weight: 1 },
    ]),
    featured: faker.datatype.boolean({ probability: 0.2 }),
    images: faker.helpers.arrayElements(CAR_IMAGES, { min: 2, max: 5 }),
    title: `${year} ${makeData.make} ${model}`,
    description: faker.lorem.paragraphs(2),
    location: faker.location.city() + ", Egypt",
    features,
  };
}

function generateWorkingHours(organizationId: string) {
  const days = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ] as const;

  return days.map((day) => ({
    organizationId,
    dayOfWeek: [day],
    openTime: day === "FRIDAY" ? "14:00" : "09:00",
    closeTime: day === "FRIDAY" ? "22:00" : "18:00",
    isOpen: day !== "SUNDAY",
  }));
}

function getRetainUntilDate(retentionDays: number | null): Date | null {
  if (retentionDays === null) return null;
  const date = new Date();
  date.setDate(date.getDate() + retentionDays);
  return date;
}

// ============ MAIN SEED FUNCTION ============

async function main() {
  console.log("🌱 Starting seed...\n");

  // Clean existing data
  console.log("🧹 Cleaning existing data...");
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.testDrive.deleteMany();
  await prisma.savedCar.deleteMany();
  await prisma.car.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.impersonationSession.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Data cleaned\n");

  // ============ CREATE PLANS ============
  console.log("📋 Creating plans...");

  const starterPlan = await prisma.plan.create({
    data: {
      name: "Starter",
      type: "STARTER",
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxCars: 15,
      maxMembers: 2,
      maxImagesPerCar: 5,
      maxStorageMB: 500,
      auditLogRetentionDays: 90,
      features: {
        aiProcessing: { enabled: false, limit: 0 },
        analytics: "basic",
        chat: false,
        apiAccess: false,
        whiteLabel: false,
        webhooks: false,
        prioritySupport: false,
      },
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      name: "Pro",
      type: "PRO",
      monthlyPrice: 4900, // $49.00
      yearlyPrice: 47000, // $470.00 (save 2 months)
      maxCars: 100,
      maxMembers: 10,
      maxImagesPerCar: 15,
      maxStorageMB: 5000,
      auditLogRetentionDays: 365,
      features: {
        aiProcessing: { enabled: true, limit: 100 },
        analytics: "advanced",
        chat: true,
        apiAccess: false,
        whiteLabel: false,
        webhooks: false,
        prioritySupport: true,
      },
    },
  });

  const enterprisePlan = await prisma.plan.create({
    data: {
      name: "Enterprise",
      type: "ENTERPRISE",
      monthlyPrice: 19900, // $199.00
      yearlyPrice: 190000, // $1,900.00 (save 2+ months)
      maxCars: -1, // Unlimited
      maxMembers: -1, // Unlimited
      maxImagesPerCar: 30,
      maxStorageMB: 50000,
      auditLogRetentionDays: null, // Unlimited retention
      features: {
        aiProcessing: { enabled: true, limit: -1 },
        analytics: "advanced",
        chat: true,
        apiAccess: true,
        whiteLabel: true,
        webhooks: true,
        prioritySupport: true,
        dedicatedSupport: true,
      },
    },
  });

  console.log("✅ Plans created: Starter, Pro, Enterprise\n");

  // ============ CREATE PLATFORM ADMIN ============
  console.log("👑 Creating Platform Admin...");

  const superAdmin = await prisma.user.create({
    data: {
      clerkId: "admin_clerk_id",
      email: "admin@autome.com",
      name: "Platform Admin",
      role: "ADMIN",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
  });

  console.log(`✅ Platform Admin created: ${superAdmin.email}\n`);

  // ============ CREATE ORGANIZATIONS ============
  console.log("🏢 Creating organizations...");

  const plans = [enterprisePlan, proPlan, starterPlan]; // Cairo gets Enterprise, Alex gets Pro, Giza gets Starter
  const createdOrgs: { org: any; plan: any }[] = [];

  for (let i = 0; i < DEMO_ORGANIZATIONS.length; i++) {
    const orgData = DEMO_ORGANIZATIONS[i];
    const plan = plans[i];

    const org = await prisma.organization.create({
      data: {
        name: orgData.name,
        slug: orgData.slug,
        email: orgData.email,
        phone: orgData.phone,
        address: orgData.address,
        description: orgData.description,
        isActive: true,
        theme: {
          primaryColor: faker.color.rgb(),
          secondaryColor: faker.color.rgb(),
        },
        settings: {
          currency: "EGP",
          timezone: "Africa/Cairo",
        },
      },
    });

    // Create subscription
    await prisma.subscription.create({
      data: {
        organizationId: org.id,
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    createdOrgs.push({ org, plan });
    console.log(`  ✅ Created: ${org.name} (${plan.name} plan)`);
  }
  console.log("");

  // ============ CREATE USERS & MEMBERSHIPS ============
  console.log("👥 Creating users and memberships...");

  for (const { org, plan } of createdOrgs) {
    // Create org owner/admin
    const adminUser = await prisma.user.create({
      data: {
        clerkId: `${org.slug}_admin_clerk_id`,
        email: `admin@${org.slug}.com`,
        name: `${org.name} Admin`,
        role: "ADMIN",
        phone: org.phone,
        imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${org.slug}-admin`,
      },
    });

    await prisma.membership.create({
      data: {
        userId: adminUser.id,
        organizationId: org.id,
        role: "OWNER",
        acceptedAt: new Date(),
      },
    });

    // Create additional members based on plan
    const memberCount = Math.min(plan.maxMembers - 1, 3);
    for (let j = 0; j < memberCount; j++) {
      const memberUser = await prisma.user.create({
        data: {
          clerkId: `${org.slug}_member_${j}_clerk_id`,
          email: `member${j + 1}@${org.slug}.com`,
          name: faker.person.fullName(),
          role: "USER",
          imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${org.slug}-member-${j}`,
        },
      });

      await prisma.membership.create({
        data: {
          userId: memberUser.id,
          organizationId: org.id,
          role: "MEMBER",
          invitedById: adminUser.id,
          invitedAt: new Date(),
          acceptedAt: new Date(),
        },
      });
    }

    console.log(`  ✅ ${org.name}: Created admin + ${memberCount} members`);
  }
  console.log("");

  // ============ CREATE REGULAR USERS (CUSTOMERS) ============
  console.log("🛒 Creating customer users...");

  const customerUsers: any[] = [];
  for (let i = 0; i < 10; i++) {
    const customer = await prisma.user.create({
      data: {
        clerkId: `customer_${i}_clerk_id`,
        email: faker.internet.email().toLowerCase(),
        name: faker.person.fullName(),
        role: "USER",
        phone: faker.phone.number(),
        imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=customer-${i}`,
      },
    });
    customerUsers.push(customer);
  }
  console.log(`✅ Created ${customerUsers.length} customer users\n`);

  // ============ CREATE CARS ============
  console.log("🚗 Creating cars...");

  const allCars: any[] = [];
  for (const { org, plan } of createdOrgs) {
    const carCount = faker.number.int({ min: 10, max: 15 });

    for (let i = 0; i < carCount; i++) {
      const car = await prisma.car.create({
        data: generateCar(org.id),
      });
      allCars.push({ car, org });
    }

    console.log(`  ✅ ${org.name}: Created ${carCount} cars`);
  }
  console.log("");

  // ============ CREATE WORKING HOURS ============
  console.log("🕐 Creating working hours...");

  for (const { org } of createdOrgs) {
    const workingHoursData = generateWorkingHours(org.id);

    for (const wh of workingHoursData) {
      await prisma.workingHours.create({ data: wh });
    }

    console.log(`  ✅ ${org.name}: Working hours set`);
  }
  console.log("");

  // ============ CREATE SAVED CARS ============
  console.log("❤️ Creating saved cars (wishlists)...");

  for (const customer of customerUsers) {
    const savedCount = faker.number.int({ min: 0, max: 5 });
    const randomCars = faker.helpers.arrayElements(allCars, savedCount);

    for (const { car } of randomCars) {
      try {
        await prisma.savedCar.create({
          data: {
            userId: customer.id,
            carId: car.id,
          },
        });
      } catch (e) {
        // Ignore duplicates
      }
    }
  }
  console.log(`✅ Created saved cars for customers\n`);

  // ============ CREATE TEST DRIVES ============
  console.log("🚙 Creating test drives...");

  for (const { org } of createdOrgs) {
    const orgCars = allCars.filter(({ org: carOrg }) => carOrg.id === org.id);
    const testDriveCount = faker.number.int({ min: 5, max: 10 });

    for (let i = 0; i < testDriveCount; i++) {
      const customer = faker.helpers.arrayElement(customerUsers);
      const { car } = faker.helpers.arrayElement(orgCars);
      const futureDate = faker.date.future({ years: 0.1 });

      await prisma.testDrive.create({
        data: {
          organizationId: org.id,
          userId: customer.id,
          carId: car.id,
          status: faker.helpers.arrayElement(TEST_DRIVE_STATUSES),
          date: futureDate,
          startTime: faker.helpers.arrayElement([
            "09:00",
            "10:00",
            "11:00",
            "14:00",
            "15:00",
            "16:00",
          ]),
          endTime: faker.helpers.arrayElement([
            "10:00",
            "11:00",
            "12:00",
            "15:00",
            "16:00",
            "17:00",
          ]),
          notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        },
      });
    }

    console.log(`  ✅ ${org.name}: Created ${testDriveCount} test drives`);
  }
  console.log("");

  // ============ CREATE CONVERSATIONS & MESSAGES ============
  console.log("💬 Creating conversations and messages...");

  for (const { org } of createdOrgs) {
    const orgCars = allCars.filter(({ org: carOrg }) => carOrg.id === org.id);
    const conversationCount = faker.number.int({ min: 3, max: 8 });

    // Get org admin
    const orgAdmin = await prisma.user.findFirst({
      where: {
        memberships: {
          some: {
            organizationId: org.id,
            role: "OWNER",
          },
        },
      },
    });

    if (!orgAdmin) continue;

    for (let i = 0; i < conversationCount; i++) {
      const customer = faker.helpers.arrayElement(customerUsers);
      const { car } = faker.helpers.arrayElement(orgCars);

      const conversation = await prisma.conversation.create({
        data: {
          organizationId: org.id,
          carId: car.id,
          participants: {
            connect: [{ id: customer.id }, { id: orgAdmin.id }],
          },
        },
      });

      // Create messages
      const messageCount = faker.number.int({ min: 2, max: 8 });
      for (let j = 0; j < messageCount; j++) {
        const isCustomer = j % 2 === 0;
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: isCustomer ? customer.id : orgAdmin.id,
            content: faker.lorem.sentences({ min: 1, max: 3 }),
            readAt: faker.datatype.boolean() ? new Date() : null,
            createdAt: faker.date.recent({ days: 7 }),
          },
        });
      }
    }

    console.log(`  ✅ ${org.name}: Created ${conversationCount} conversations`);
  }
  console.log("");

  // ============ CREATE AUDIT LOGS ============
  console.log("📝 Creating sample audit logs...");

  for (const { org, plan } of createdOrgs) {
    const retainUntil = getRetainUntilDate(plan.auditLogRetentionDays);

    // Org creation log
    await prisma.auditLog.create({
      data: {
        action: "ORG_CREATED",
        entityType: "ORGANIZATION",
        entityId: org.id,
        organizationId: org.id,
        userId: superAdmin.id,
        userEmail: superAdmin.email,
        newValue: { name: org.name, slug: org.slug },
        retainUntil,
        metadata: {
          ipAddress: "127.0.0.1",
          userAgent: "Seed Script",
        },
      },
    });

    // Some car creation logs
    const orgCars = allCars
      .filter(({ org: carOrg }) => carOrg.id === org.id)
      .slice(0, 3);
    for (const { car } of orgCars) {
      await prisma.auditLog.create({
        data: {
          action: "CAR_CREATED",
          entityType: "CAR",
          entityId: car.id,
          organizationId: org.id,
          userEmail: `admin@${org.slug}.com`,
          newValue: { make: car.make, model: car.model, year: car.year },
          retainUntil,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        },
      });
    }

    console.log(`  ✅ ${org.name}: Created sample audit logs`);
  }
  console.log("");

  // ============ SUMMARY ============
  console.log("🎉 Seed completed successfully!\n");
  console.log("📊 Summary:");
  console.log("   - 3 Plans (Starter, Pro, Enterprise)");
  console.log("   - 1 Super Admin");
  console.log("   - 3 Organizations with subscriptions");
  console.log(`   - ${allCars.length} Cars total`);
  console.log(`   - ${customerUsers.length} Customer users`);
  console.log("   - Test drives, conversations, and audit logs");
  console.log("\n🔗 Access your organizations:");
  console.log("   - http://autome-cairo.localhost:3000");
  console.log("   - http://autome-alex.localhost:3000");
  console.log("   - http://autome-giza.localhost:3000");
  console.log("\n📝 Don't forget to add these to your hosts file:");
  console.log("   127.0.0.1 autome.localhost");
  console.log("   127.0.0.1 autome-cairo.localhost");
  console.log("   127.0.0.1 autome-alex.localhost");
  console.log("   127.0.0.1 autome-giza.localhost");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
