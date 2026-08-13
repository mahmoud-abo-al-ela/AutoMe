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

// ============ REAL CAR DATABASE ============
// Each model has accurate body type, fuel type, transmission, seats, and price range (in USD cents)
// Images are real Unsplash photos matching the actual make/model

interface CarModelSpec {
  model: string;
  bodyType: string;
  fuelTypes: string[];
  transmissions: string[];
  seats: number;
  priceMin: number; // USD dollars
  priceMax: number;
  images: string[];
  features: string[];
  description: string;
}

interface CarMakeSpec {
  make: string;
  models: CarModelSpec[];
}

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

const CAR_MAKES: CarMakeSpec[] = [
  {
    make: "Toyota",
    models: [
      {
        model: "Camry",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 26000,
        priceMax: 38000,
        images: [U("1547444866-b54ca0a611b9"), U("1494976388531-d1058494cdd8"), U("1503376780353-7e6692767b70")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Adaptive Cruise Control", "Lane Departure Warning", "Keyless Entry", "Push Button Start", "Heated Seats"],
        description: "The Toyota Camry is a reliable midsize sedan known for its comfort, fuel efficiency, and longevity. Perfect for daily commuting and family use.",
      },
      {
        model: "Corolla",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic", "Manual"],
        seats: 5,
        priceMin: 21000,
        priceMax: 28000,
        images: [U("1529266868593-483214d9d63c"), U("1492144534655-ae79c964c9d7"), U("1583121274602-3e2820c69888")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Lane Departure Warning", "Keyless Entry", "Push Button Start"],
        description: "The Toyota Corolla is one of the best-selling compact sedans worldwide, offering excellent fuel economy, safety features, and proven reliability.",
      },
      {
        model: "RAV4",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 28000,
        priceMax: 42000,
        images: [U("1706509234538-9831b1b33d66"), U("1542362567-b07e54358753"), U("1605559424843-9e4c228bf1c2")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Parking Sensors"],
        description: "The Toyota RAV4 is a versatile compact SUV with available hybrid and plug-in hybrid powertrains, ideal for both city driving and outdoor adventures.",
      },
      {
        model: "Highlander",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic"],
        seats: 7,
        priceMin: 36000,
        priceMax: 52000,
        images: [U("1544636331-e26879cd4d9b"), U("1605559424843-9e4c228bf1c2"), U("1552519507-da3b142c6e3d")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Ventilated Seats", "360 Camera"],
        description: "The Toyota Highlander is a three-row midsize SUV offering spacious seating for up to 8, premium comfort, and available hybrid efficiency.",
      },
      {
        model: "Prius",
        bodyType: "Hatchback",
        fuelTypes: ["Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 27000,
        priceMax: 36000,
        images: [U("1494976388531-d1058494cdd8"), U("1503376780353-7e6692767b70"), U("1583121274602-3e2820c69888")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Apple CarPlay", "Android Auto", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Wireless Charging", "Parking Sensors"],
        description: "The Toyota Prius is the iconic hybrid hatchback, delivering exceptional fuel economy and low emissions with advanced safety technology.",
      },
    ],
  },
  {
    make: "Honda",
    models: [
      {
        model: "Civic",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic", "Manual"],
        seats: 5,
        priceMin: 23000,
        priceMax: 30000,
        images: [U("1751601396135-db2dbe684b9e"), U("1492144534655-ae79c964c9d7"), U("1583121274602-3e2820c69888")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats"],
        description: "The Honda Civic is a sporty compact sedan with responsive handling, a refined interior, and excellent fuel economy.",
      },
      {
        model: "Accord",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic", "Manual"],
        seats: 5,
        priceMin: 27000,
        priceMax: 38000,
        images: [U("1751601396135-db2dbe684b9e"), U("1503376780353-7e6692767b70"), U("1542362567-b07e54358753")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Wireless Charging"],
        description: "The Honda Accord is a midsize sedan that blends performance, comfort, and efficiency with a spacious interior and advanced technology.",
      },
      {
        model: "CR-V",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 29000,
        priceMax: 40000,
        images: [U("1617133194430-40248f844575"), U("1544636331-e26879cd4d9b"), U("1605559424843-9e4c228bf1c2")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Parking Sensors", "Wireless Charging"],
        description: "The Honda CR-V is a compact SUV with excellent cargo space, comfortable ride, and available hybrid powertrain for everyday family use.",
      },
      {
        model: "Pilot",
        bodyType: "SUV",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic"],
        seats: 8,
        priceMin: 38000,
        priceMax: 52000,
        images: [U("1617133194430-40248f844575"), U("1605559424843-9e4c228bf1c2"), U("1552519507-da3b142c6e3d")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "360 Camera", "Ventilated Seats", "Rear Entertainment"],
        description: "The Honda Pilot is a three-row midsize SUV with seating for up to 8, offering robust performance and family-friendly features.",
      },
      {
        model: "HR-V",
        bodyType: "SUV",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 24000,
        priceMax: 30000,
        images: [U("1617133194430-40248f844575"), U("1542362567-b07e54358753"), U("1580273916550-e323be2ae537")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Lane Departure Warning", "Keyless Entry", "Push Button Start"],
        description: "The Honda HR-V is a subcompact SUV with a versatile interior, good fuel economy, and practical features for urban driving.",
      },
    ],
  },
  {
    make: "BMW",
    models: [
      {
        model: "3 Series",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic", "Manual"],
        seats: 5,
        priceMin: 43000,
        priceMax: 62000,
        images: [U("1759428174389-f1741ded6ac6"), U("1605906457463-5eb60f753738"), U("1552519507-da3b142c6e3d")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Head-Up Display", "Memory Seats"],
        description: "The BMW 3 Series is the benchmark sport sedan, delivering dynamic driving, luxurious interior, and cutting-edge technology.",
      },
      {
        model: "5 Series",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 54000,
        priceMax: 75000,
        images: [U("1759428174389-f1741ded6ac6"), U("1605906457463-5eb60f753738"), U("1544636331-e26879cd4d9b")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Head-Up Display", "Memory Seats", "Ventilated Seats", "Wireless Charging"],
        description: "The BMW 5 Series is a luxury midsize sedan combining executive comfort, advanced technology, and refined performance.",
      },
      {
        model: "X3",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 46000,
        priceMax: 62000,
        images: [U("1605906457463-5eb60f753738"), U("1635990215241-4d2805d729bb"), U("1617133194430-40248f844575")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Head-Up Display", "Parking Sensors", "360 Camera"],
        description: "The BMW X3 is a luxury compact SUV with sporty handling, premium interior, and versatile cargo space.",
      },
      {
        model: "X5",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid", "Diesel"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 61000,
        priceMax: 90000,
        images: [U("1635990215241-4d2805d729bb"), U("1605906457463-5eb60f753738"), U("1618843479313-40f8afb4b4d8")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Panoramic Sunroof", "Heated Seats", "Ventilated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Head-Up Display", "Memory Seats", "360 Camera", "Wireless Charging", "Massage Seats"],
        description: "The BMW X5 is a luxury midsize SUV offering powerful engine options, opulent interior, and advanced driving assistance systems.",
      },
      {
        model: "M4",
        bodyType: "Coupe",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic", "Manual"],
        seats: 4,
        priceMin: 72000,
        priceMax: 95000,
        images: [U("1605906457463-5eb60f753738"), U("1552519507-da3b142c6e3d"), U("1544636331-e26879cd4d9b")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Head-Up Display", "Memory Seats", "Carbon Fiber Trim", "Sport Differential"],
        description: "The BMW M4 is a high-performance coupe with track-ready dynamics, a powerful inline-six engine, and aggressive styling.",
      },
    ],
  },
  {
    make: "Mercedes-Benz",
    models: [
      {
        model: "C-Class",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 44000,
        priceMax: 60000,
        images: [U("1779025313068-b4a11d86bf0d"), U("1764089859662-7b4773dff85b"), U("1552519507-da3b142c6e3d")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Head-Up Display", "Memory Seats"],
        description: "The Mercedes-Benz C-Class is a luxury compact sedan with elegant design, refined ride quality, and advanced technology.",
      },
      {
        model: "E-Class",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 56000,
        priceMax: 78000,
        images: [U("1779025313068-b4a11d86bf0d"), U("1764089859662-7b4773dff85b"), U("1544636331-e26879cd4d9b")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Panoramic Sunroof", "Heated Seats", "Ventilated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Head-Up Display", "Memory Seats", "Wireless Charging", "Air Suspension"],
        description: "The Mercedes-Benz E-Class is a luxury midsize sedan offering executive comfort, sophisticated styling, and cutting-edge safety features.",
      },
      {
        model: "GLC",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 47000,
        priceMax: 65000,
        images: [U("1764089859662-7b4773dff85b"), U("1617133194430-40248f844575"), U("1605559424843-9e4c228bf1c2")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Head-Up Display", "Parking Sensors", "360 Camera"],
        description: "The Mercedes-Benz GLC is a luxury compact SUV with refined interior, smooth ride, and advanced driver assistance systems.",
      },
      {
        model: "GLE",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid", "Diesel"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 57000,
        priceMax: 85000,
        images: [U("1764089859662-7b4773dff85b"), U("1605559424843-9e4c228bf1c2"), U("1618843479313-40f8afb4b4d8")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Panoramic Sunroof", "Heated Seats", "Ventilated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Head-Up Display", "Memory Seats", "360 Camera", "Air Suspension", "Massage Seats"],
        description: "The Mercedes-Benz GLE is a luxury midsize SUV with powerful engine options, opulent cabin, and state-of-the-art technology.",
      },
      {
        model: "A-Class",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 35000,
        priceMax: 45000,
        images: [U("1779025313068-b4a11d86bf0d"), U("1552519507-da3b142c6e3d"), U("1542362567-b07e54358753")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Keyless Entry", "Push Button Start", "Premium Sound System"],
        description: "The Mercedes-Benz A-Class is the entry-level luxury sedan with modern design, advanced MBUX infotainment, and premium materials.",
      },
    ],
  },
  {
    make: "Ford",
    models: [
      {
        model: "F-150",
        bodyType: "Pickup",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 34000,
        priceMax: 70000,
        images: [U("1564440354048-2c20d2dbad68"), U("1544636331-e26879cd4d9b"), U("1605559424843-9e4c228bf1c2")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Premium Sound System", "360 Camera", "Tow Package", "Bed Liner", "Pro Power Onboard"],
        description: "The Ford F-150 is America's best-selling pickup truck, offering powerful engine options, best-in-class towing, and innovative features.",
      },
      {
        model: "Mustang",
        bodyType: "Coupe",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic", "Manual"],
        seats: 4,
        priceMin: 30000,
        priceMax: 58000,
        images: [U("1523998172836-07d4ac80b873"), U("1762093470225-a87a068ad9c5"), U("1552519507-da3b142c6e3d")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Sport Mode", "Performance Package", "Launch Control"],
        description: "The Ford Mustang is an iconic American muscle car with thrilling performance, bold styling, and a rich heritage.",
      },
      {
        model: "Explorer",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic"],
        seats: 7,
        priceMin: 36000,
        priceMax: 55000,
        images: [U("1605559424843-9e4c228bf1c2"), U("1617133194430-40248f844575"), U("1544636331-e26879cd4d9b")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "360 Camera", "Rear Entertainment"],
        description: "The Ford Explorer is a three-row midsize SUV with powerful engine options, spacious interior, and advanced technology for family adventures.",
      },
      {
        model: "Escape",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 28000,
        priceMax: 40000,
        images: [U("1617133194430-40248f844575"), U("1542362567-b07e54358753"), U("1580273916550-e323be2ae537")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Wireless Charging"],
        description: "The Ford Escape is a compact SUV with efficient engine options, comfortable ride, and smart technology for everyday driving.",
      },
      {
        model: "Bronco",
        bodyType: "SUV",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic", "Manual"],
        seats: 5,
        priceMin: 34000,
        priceMax: 60000,
        images: [U("1564440354048-2c20d2dbad68"), U("1605559424843-9e4c228bf1c2"), U("1544636331-e26879cd4d9b")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Keyless Entry", "Push Button Start", "Heated Seats", "Off-Road Package", "Removable Roof", "Trail Control", "360 Camera"],
        description: "The Ford Bronco is a rugged off-road SUV with trail-ready capability, removable roof and doors, and iconic retro styling.",
      },
    ],
  },
  {
    make: "Chevrolet",
    models: [
      {
        model: "Silverado",
        bodyType: "Pickup",
        fuelTypes: ["Gasoline", "Diesel"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 36000,
        priceMax: 65000,
        images: [U("1577639423567-d57c0884a010"), U("1564440354048-2c20d2dbad68"), U("1605559424843-9e4c228bf1c2")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Premium Sound System", "360 Camera", "Tow Package", "Bed Liner", "MultiPro Tailgate"],
        description: "The Chevrolet Silverado is a full-size pickup truck with robust towing capacity, durable construction, and advanced technology.",
      },
      {
        model: "Malibu",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 25000,
        priceMax: 33000,
        images: [U("1492144534655-ae79c964c9d7"), U("1583121274602-3e2820c69888"), U("1503376780353-7e6692767b70")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats"],
        description: "The Chevrolet Malibu is a midsize sedan with comfortable ride, modern styling, and efficient performance.",
      },
      {
        model: "Equinox",
        bodyType: "SUV",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 27000,
        priceMax: 35000,
        images: [U("1617133194430-40248f844575"), U("1542362567-b07e54358753"), U("1580273916550-e323be2ae537")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Wireless Charging"],
        description: "The Chevrolet Equinox is a compact SUV with practical features, comfortable interior, and good fuel economy for daily driving.",
      },
      {
        model: "Tahoe",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Diesel"],
        transmissions: ["Automatic"],
        seats: 8,
        priceMin: 54000,
        priceMax: 78000,
        images: [U("1564422426545-8a43cd6598ff"), U("1605559424843-9e4c228bf1c2"), U("1618843479313-40f8afb4b4d8")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Ventilated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "360 Camera", "Rear Entertainment", "Air Suspension", "Tow Package"],
        description: "The Chevrolet Tahoe is a full-size SUV with seating for up to 8, powerful V8 engine, and impressive towing capacity.",
      },
      {
        model: "Camaro",
        bodyType: "Coupe",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic", "Manual"],
        seats: 4,
        priceMin: 27000,
        priceMax: 70000,
        images: [U("1594567096598-d64301ebfe4f"), U("1552519507-da3b142c6e3d"), U("1544636331-e26879cd4d9b")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Keyless Entry", "Push Button Start", "Premium Sound System", "Sport Mode", "Performance Package", "Launch Control", "Brembo Brakes"],
        description: "The Chevrolet Camaro is an American performance coupe with aggressive styling, powerful engine options, and track-ready dynamics.",
      },
    ],
  },
  {
    make: "Audi",
    models: [
      {
        model: "A4",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic", "Manual"],
        seats: 5,
        priceMin: 40000,
        priceMax: 52000,
        images: [U("1599477973508-0da833cc0f5b"), U("1760161339250-75522a0b833c"), U("1552519507-da3b142c6e3d")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Virtual Cockpit", "Head-Up Display"],
        description: "The Audi A4 is a luxury compact sedan with sophisticated design, Quattro all-wheel drive, and advanced virtual cockpit.",
      },
      {
        model: "A6",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 56000,
        priceMax: 72000,
        images: [U("1599477973508-0da833cc0f5b"), U("1760161339250-75522a0b833c"), U("1544636331-e26879cd4d9b")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Panoramic Sunroof", "Heated Seats", "Ventilated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Virtual Cockpit", "Head-Up Display", "Memory Seats", "Wireless Charging", "Air Suspension"],
        description: "The Audi A6 is a luxury midsize sedan with elegant styling, advanced technology, and refined Quattro all-wheel drive.",
      },
      {
        model: "Q5",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 44000,
        priceMax: 60000,
        images: [U("1532974143451-8162d38a1257"), U("1599477973508-0da833cc0f5b"), U("1617133194430-40248f844575")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Virtual Cockpit", "Head-Up Display", "Parking Sensors", "360 Camera"],
        description: "The Audi Q5 is a luxury compact SUV with Quattro all-wheel drive, premium interior, and versatile performance.",
      },
      {
        model: "Q7",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid", "Diesel"],
        transmissions: ["Automatic"],
        seats: 7,
        priceMin: 60000,
        priceMax: 80000,
        images: [U("1532974143451-8162d38a1257"), U("1605559424843-9e4c228bf1c2"), U("1618843479313-40f8afb4b4d8")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Panoramic Sunroof", "Heated Seats", "Ventilated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Virtual Cockpit", "Head-Up Display", "Memory Seats", "360 Camera", "Air Suspension", "Rear Entertainment"],
        description: "The Audi Q7 is a luxury three-row SUV with Quattro all-wheel drive, spacious interior, and advanced technology.",
      },
      {
        model: "e-tron",
        bodyType: "SUV",
        fuelTypes: ["Electric"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 65000,
        priceMax: 90000,
        images: [U("1532974143451-8162d38a1257"), U("1605559424843-9e4c228bf1c2"), U("1618843479313-40f8afb4b4d8")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Panoramic Sunroof", "Heated Seats", "Ventilated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Virtual Cockpit", "Head-Up Display", "Memory Seats", "360 Camera", "Air Suspension", "Matrix LED Headlights", "Fast Charging"],
        description: "The Audi e-tron is a luxury electric SUV with Quattro all-wheel drive, long range, and cutting-edge EV technology.",
      },
    ],
  },
  {
    make: "Nissan",
    models: [
      {
        model: "Altima",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 25000,
        priceMax: 33000,
        images: [U("1575501707067-0e4c7db2a950"), U("1492144534655-ae79c964c9d7"), U("1583121274602-3e2820c69888")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats"],
        description: "The Nissan Altima is a midsize sedan with available all-wheel drive, comfortable interior, and advanced safety features.",
      },
      {
        model: "Sentra",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic", "Manual"],
        seats: 5,
        priceMin: 20000,
        priceMax: 25000,
        images: [U("1575501707067-0e4c7db2a950"), U("1492144534655-ae79c964c9d7"), U("1583121274602-3e2820c69888")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Lane Departure Warning", "Keyless Entry", "Push Button Start"],
        description: "The Nissan Sentra is a compact sedan with modern styling, good fuel economy, and practical features for daily commuting.",
      },
      {
        model: "Rogue",
        bodyType: "SUV",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 28000,
        priceMax: 38000,
        images: [U("1587856657352-a12a4849af5b"), U("1617133194430-40248f844575"), U("1542362567-b07e54358753")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Premium Sound System", "360 Camera", "ProPILOT Assist"],
        description: "The Nissan Rogue is a compact SUV with family-friendly interior, advanced safety technology, and efficient performance.",
      },
      {
        model: "Pathfinder",
        bodyType: "SUV",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic"],
        seats: 8,
        priceMin: 36000,
        priceMax: 50000,
        images: [U("1587856657352-a12a4849af5b"), U("1605559424843-9e4c228bf1c2"), U("1618843479313-40f8afb4b4d8")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "360 Camera", "Rear Entertainment", "ProPILOT Assist"],
        description: "The Nissan Pathfinder is a three-row midsize SUV with seating for up to 8, versatile cargo space, and family-focused features.",
      },
      {
        model: "Leaf",
        bodyType: "Hatchback",
        fuelTypes: ["Electric"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 28000,
        priceMax: 38000,
        images: [U("1587856657352-a12a4849af5b"), U("1494976388531-d1058494cdd8"), U("1503376780353-7e6692767b70")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Apple CarPlay", "Android Auto", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Wireless Charging", "ProPILOT Assist", "Fast Charging", "e-Pedal"],
        description: "The Nissan Leaf is an affordable electric hatchback with zero emissions, practical range, and innovative e-Pedal technology.",
      },
    ],
  },
  {
    make: "Hyundai",
    models: [
      {
        model: "Elantra",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic", "Manual"],
        seats: 5,
        priceMin: 21000,
        priceMax: 28000,
        images: [U("1769500152152-e8be7458316c"), U("1744813384813-693036ef9dd3"), U("1492144534655-ae79c964c9d7")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Wireless Charging"],
        description: "The Hyundai Elantra is a bold compact sedan with striking design, efficient powertrains, and comprehensive safety features.",
      },
      {
        model: "Sonata",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 26000,
        priceMax: 36000,
        images: [U("1744813384813-693036ef9dd3"), U("1769500152152-e8be7458316c"), U("1503376780353-7e6692767b70")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Wireless Charging", "Digital Key"],
        description: "The Hyundai Sonata is a midsize sedan with coupe-like styling, advanced technology, and efficient hybrid option.",
      },
      {
        model: "Tucson",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 28000,
        priceMax: 42000,
        images: [U("1744813384813-693036ef9dd3"), U("1617133194430-40248f844575"), U("1542362567-b07e54358753")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Premium Sound System", "360 Camera", "Wireless Charging", "Highway Driving Assist"],
        description: "The Hyundai Tucson is a compact SUV with bold design, available hybrid and plug-in hybrid, and advanced safety technology.",
      },
      {
        model: "Santa Fe",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 7,
        priceMin: 33000,
        priceMax: 48000,
        images: [U("1744813384813-693036ef9dd3"), U("1605559424843-9e4c228bf1c2"), U("1618843479313-40f8afb4b4d8")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Ventilated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "360 Camera", "Rear Entertainment", "Wireless Charging", "Highway Driving Assist"],
        description: "The Hyundai Santa Fe is a midsize SUV with three-row seating, premium interior, and available hybrid powertrain.",
      },
      {
        model: "Ioniq",
        bodyType: "Hatchback",
        fuelTypes: ["Electric", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 30000,
        priceMax: 45000,
        images: [U("1744813384813-693036ef9dd3"), U("1743740390083-e8a07cb48284"), U("1494976388531-d1058494cdd8")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Premium Sound System", "Wireless Charging", "Highway Driving Assist", "Fast Charging", "Vehicle-to-Load"],
        description: "The Hyundai Ioniq is an eco-friendly vehicle available in hybrid, plug-in hybrid, and full electric variants with advanced technology.",
      },
    ],
  },
  {
    make: "Kia",
    models: [
      {
        model: "Optima",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 24000,
        priceMax: 32000,
        images: [U("1743740390083-e8a07cb48284"), U("1769500152152-e8be7458316c"), U("1492144534655-ae79c964c9d7")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Wireless Charging"],
        description: "The Kia Optima is a midsize sedan with sporty styling, comfortable interior, and available hybrid powertrain.",
      },
      {
        model: "Forte",
        bodyType: "Sedan",
        fuelTypes: ["Gasoline"],
        transmissions: ["Automatic", "Manual"],
        seats: 5,
        priceMin: 19000,
        priceMax: 25000,
        images: [U("1743740390083-e8a07cb48284"), U("1769500152152-e8be7458316c"), U("1583121274602-3e2820c69888")],
        features: ["Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto", "Lane Departure Warning", "Keyless Entry", "Push Button Start"],
        description: "The Kia Forte is a value-packed compact sedan with modern features, good fuel economy, and an attractive design.",
      },
      {
        model: "Sportage",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 27000,
        priceMax: 40000,
        images: [U("1743740390083-e8a07cb48284"), U("1617133194430-40248f844575"), U("1542362567-b07e54358753")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Heated Seats", "Premium Sound System", "360 Camera", "Wireless Charging", "Highway Driving Assist"],
        description: "The Kia Sportage is a compact SUV with distinctive design, spacious interior, and advanced technology features.",
      },
      {
        model: "Sorento",
        bodyType: "SUV",
        fuelTypes: ["Gasoline", "Hybrid", "Plug-in Hybrid"],
        transmissions: ["Automatic"],
        seats: 7,
        priceMin: 31000,
        priceMax: 45000,
        images: [U("1743740390083-e8a07cb48284"), U("1605559424843-9e4c228bf1c2"), U("1618843479313-40f8afb4b4d8")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Sunroof", "Heated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "360 Camera", "Rear Entertainment", "Wireless Charging"],
        description: "The Kia Sorento is a midsize SUV with three-row seating, available hybrid powertrain, and premium features.",
      },
      {
        model: "EV6",
        bodyType: "SUV",
        fuelTypes: ["Electric"],
        transmissions: ["Automatic"],
        seats: 5,
        priceMin: 42000,
        priceMax: 62000,
        images: [U("1743740390083-e8a07cb48284"), U("1605559424843-9e4c228bf1c2"), U("1618843479313-40f8afb4b4d8")],
        features: ["Bluetooth", "Backup Camera", "Navigation System", "Leather Seats", "Panoramic Sunroof", "Heated Seats", "Ventilated Seats", "Apple CarPlay", "Android Auto", "Blind Spot Monitor", "Lane Departure Warning", "Adaptive Cruise Control", "Keyless Entry", "Push Button Start", "Premium Sound System", "Head-Up Display", "360 Camera", "Fast Charging", "Vehicle-to-Load", "Highway Driving Assist"],
        description: "The Kia EV6 is a sleek electric crossover with ultra-fast charging, long range, and cutting-edge technology.",
      },
    ],
  },
];

// ============ REALISTIC DEALERSHIP NAMES ============

const DEMO_ORGANIZATIONS = [
  {
    name: "Cairo Auto Gallery",
    slug: "cairo-auto-gallery",
    email: "sales@cairoautogallery.com",
    phone: "+201001234567",
    address: "Autostrad Road, Nasr City, Cairo, Egypt",
    city: "Cairo",
    region: "Greater Cairo",
    country: "EG",
    description: "Cairo's premier luxury and mainstream car dealership. Family-owned since 2005, offering new and certified pre-owned vehicles with in-house financing.",
  },
  {
    name: "Alexandria Motors",
    slug: "alexandria-motors",
    email: "info@alexandriamotors.com",
    phone: "+201122345678",
    address: "Corniche Road, Stanley, Alexandria, Egypt",
    city: "Alexandria",
    region: "Alexandria Governorate",
    country: "EG",
    description: "Trusted dealership serving Alexandria and the North Coast. Specializing in Toyota, Honda, and Hyundai with a dedicated service center.",
  },
  {
    name: "Giza Premium Cars",
    slug: "giza-premium-cars",
    email: "contact@gizapremium.com",
    phone: "+201233456789",
    address: "Sheikh Zayed City, 6th of October, Giza, Egypt",
    city: "Giza",
    region: "Greater Cairo",
    country: "EG",
    description: "West Cairo's destination for BMW, Mercedes-Benz, and Audi. State-of-the-art showroom with certified technicians and premium customer service.",
  },
  {
    name: "Delta Wheels",
    slug: "delta-wheels",
    email: "sales@deltawheels.com",
    phone: "+201044567890",
    address: "El Geish Street, Mansoura, Egypt",
    city: "Mansoura",
    region: "Dakahlia",
    country: "EG",
    description: "The Delta region's largest multi-brand dealership. From budget-friendly sedans to heavy-duty trucks, we have something for every driver.",
  },
  {
    name: "Tanta Auto Center",
    slug: "tanta-auto-center",
    email: "info@tantaautocenter.com",
    phone: "+201055678901",
    address: "El Bahr Street, Tanta, Egypt",
    city: "Tanta",
    region: "Gharbia",
    country: "EG",
    description: "Serving the heart of Egypt with quality new and used vehicles. Competitive pricing, flexible financing, and a 12-month warranty on every car.",
  },
  {
    name: "Upper Egypt Auto",
    slug: "upper-egypt-auto",
    email: "sales@upperegyptauto.com",
    phone: "+201066789012",
    address: "Corniche El Nile, Luxor, Egypt",
    city: "Luxor",
    region: "Upper Egypt",
    country: "EG",
    description: "Upper Egypt's trusted automotive partner. Bringing quality vehicles and professional service to Luxor and surrounding areas since 2010.",
  },
  {
    name: "Aswan Car Mart",
    slug: "aswan-car-mart",
    email: "info@aswancarmart.com",
    phone: "+201077890123",
    address: "Saad Zaghloul Street, Aswan, Egypt",
    city: "Aswan",
    region: "Upper Egypt",
    country: "EG",
    description: "Southern Egypt's finest car dealership. Personalized service, honest pricing, and a wide selection of vehicles for every budget.",
  },
  {
    name: "Port Said Automotive",
    slug: "portsaid-automotive",
    email: "sales@portsaidauto.com",
    phone: "+201088901234",
    address: "El Gomhoria Street, Port Said, Egypt",
    city: "Port Said",
    region: "Canal Zone",
    country: "EG",
    description: "Canal Zone's top dealer for imported and local vehicles. Specializing in American and Japanese brands with port-side delivery options.",
  },
  {
    name: "Ismailia Car Gallery",
    slug: "ismailia-car-gallery",
    email: "info@ismailiacargallery.com",
    phone: "+201099012345",
    address: "Sultan Hussein Street, Ismailia, Egypt",
    city: "Ismailia",
    region: "Canal Zone",
    country: "EG",
    description: "Your gateway to premium cars in Ismailia. New models, certified pre-owned, and professional after-sales service all under one roof.",
  },
  {
    name: "Red Sea Motors",
    slug: "red-sea-motors",
    email: "sales@redseamotors.com",
    phone: "+201011123456",
    address: "Sheraton Road, Hurghada, Egypt",
    city: "Hurghada",
    region: "Red Sea",
    country: "EG",
    description: "Red Sea coast's leading dealership. From beach-ready SUVs to luxury sedans, drive your dream car by the beautiful Red Sea.",
  },
];

// ============ REALISTIC REVIEW TEMPLATES ============

const REVIEW_TEMPLATES = [
  {
    rating: 5,
    titles: ["Exceptional experience from start to finish", "Best car buying experience I've had", "Highly recommend this dealership", "Outstanding service and fair prices", "Smooth and transparent process"],
    comments: [
      "I was nervous about buying a car, but the team made everything so easy. No pressure, no hidden fees, and they answered every question patiently. The car was exactly as described. I'll definitely come back for my next purchase.",
      "From the moment I walked in, I felt valued as a customer. The salesperson took the time to understand my needs and budget, and never tried to upsell me. The financing process was quick and transparent. Highly recommended!",
      "I've bought three cars from this dealership over the years, and the experience keeps getting better. The staff is knowledgeable, the showroom is clean and modern, and the after-sales service is excellent. They genuinely care about customer satisfaction.",
      "Found exactly the car I was looking for at a fair price. The test drive was arranged immediately, and the paperwork was handled efficiently. They even threw in free floor mats and a full tank of gas. Great experience overall!",
    ],
  },
  {
    rating: 4,
    titles: ["Great service, minor delays", "Good experience overall", "Solid dealership with room for improvement", "Happy with my purchase", "Professional team, fair pricing"],
    comments: [
      "The staff was friendly and knowledgeable. I got a good deal on my car, though the financing process took a bit longer than expected. Overall, I'm satisfied and would recommend them to friends and family.",
      "Good selection of vehicles and the salesperson was helpful. The only issue was that I had to wait about 30 minutes for someone to assist me initially. Once things got moving, everything went smoothly. The car is great!",
      "Purchased a used car here last month. The vehicle was in excellent condition and the price was fair. The only reason I'm giving 4 stars instead of 5 is that the follow-up call about registration took a few days longer than promised.",
      "Professional and straightforward. They didn't play games with pricing like other dealerships I've visited. The car was clean and ready for test drive. Would have been 5 stars if the waiting area was a bit more comfortable.",
    ],
  },
  {
    rating: 3,
    titles: ["Decent experience but could be better", "Average service", "Mixed feelings about my visit", "Okay dealership, nothing special"],
    comments: [
      "The car I bought is fine, but the buying process was more stressful than it needed to be. There was some back-and-forth on the price, and I felt a bit rushed toward the end. The car itself is great though.",
      "Average experience. The staff was polite but seemed busy and a bit distracted. The car selection was decent. I ended up buying, but I wasn't blown away by the service. Maybe it was just a busy day.",
      "The car is good value for money, but communication could have been better. I had to call multiple times to get updates on my paperwork. The salesperson was nice enough, but the overall process felt disorganized.",
    ],
  },
  {
    rating: 2,
    titles: ["Disappointing experience", "Expected better service", "Issues with after-sales support"],
    comments: [
      "The initial buying experience was okay, but after-sales support has been lacking. I've been trying to get a minor issue fixed under warranty for weeks and keep getting passed around. The car itself is fine.",
      "Prices seemed inflated compared to other dealers. The salesperson was pushy and kept trying to sell me add-ons I didn't want. I ended up buying elsewhere. The showroom was nice though.",
    ],
  },
];

// ============ HELPER FUNCTIONS ============

const COLORS = [
  "Black", "White", "Silver", "Gray", "Red", "Blue",
  "Green", "Brown", "Beige", "Pearl White", "Metallic Gray",
  "Midnight Blue", "Crystal Black", "Storm Silver",
];

function generateCar(organizationId: string) {
  const makeData = faker.helpers.arrayElement(CAR_MAKES);
  const modelData = faker.helpers.arrayElement(makeData.models);
  const year = faker.number.int({ min: 2019, max: 2025 });
  const isNewer = year >= 2023;
  const mileage = isNewer
    ? faker.number.int({ min: 0, max: 15000 })
    : faker.number.int({ min: 15000, max: 120000 });

  // Price based on year and model's real price range
  const yearFactor = (year - 2019) / 6; // 0 to 1
  const basePrice = modelData.priceMin + (modelData.priceMax - modelData.priceMin) * yearFactor;
  const mileageDepreciation = (mileage / 120000) * 0.25; // up to 25% off for high mileage
  const price = Math.round(basePrice * (1 - mileageDepreciation) * 100); // in cents

  // Pick 3-8 features from the model's real feature list
  const features = faker.helpers.arrayElements(modelData.features, {
    min: Math.min(3, modelData.features.length),
    max: Math.min(8, modelData.features.length),
  });

  // Pick 2-5 images from the model's real image list
  const imageCount = Math.min(modelData.images.length, faker.number.int({ min: 2, max: 5 }));
  const images = faker.helpers.arrayElements(modelData.images, imageCount);

  return {
    organizationId,
    make: makeData.make,
    model: modelData.model,
    year,
    price,
    mileage,
    fuelType: faker.helpers.arrayElement(modelData.fuelTypes),
    transmission: faker.helpers.arrayElement(modelData.transmissions),
    color: faker.helpers.arrayElement(COLORS),
    bodyType: modelData.bodyType,
    seats: modelData.seats,
    status: faker.helpers.weightedArrayElement([
      { value: "AVAILABLE" as const, weight: 7 },
      { value: "UNAVAILABLE" as const, weight: 2 },
      { value: "SOLD" as const, weight: 1 },
    ]),
    featured: faker.datatype.boolean({ probability: 0.2 }),
    images,
    title: `${year} ${makeData.make} ${modelData.model}`,
    description: modelData.description,
    location: faker.helpers.arrayElement([
      "Cairo, Egypt", "Alexandria, Egypt", "Giza, Egypt",
      "Mansoura, Egypt", "Tanta, Egypt", "Luxor, Egypt",
      "Aswan, Egypt", "Port Said, Egypt", "Ismailia, Egypt", "Hurghada, Egypt",
    ]),
    features,
  };
}

function generateWorkingHours(organizationId: string) {
  const days = [
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
    "FRIDAY", "SATURDAY", "SUNDAY",
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

function generateReview() {
  // Weighted: mostly positive
  const template = faker.helpers.weightedArrayElement([
    { value: REVIEW_TEMPLATES[0], weight: 5 }, // 5-star
    { value: REVIEW_TEMPLATES[1], weight: 3 }, // 4-star
    { value: REVIEW_TEMPLATES[2], weight: 1.5 }, // 3-star
    { value: REVIEW_TEMPLATES[3], weight: 0.5 }, // 2-star
  ]);

  return {
    rating: template.rating,
    title: faker.helpers.arrayElement(template.titles),
    comment: faker.helpers.arrayElement(template.comments),
  };
}

// ============ MAIN SEED FUNCTION ============

async function main() {
  console.log("🌱 Starting seed...\n");

  // Clean existing data (order matters for FK constraints)
  console.log("🧹 Cleaning existing data...");
  await prisma.dealershipReview.deleteMany();
  await prisma.onboardingSession.deleteMany();
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
      // EGP, minor units (piastres). PLACEHOLDER — confirm before running
      // `pnpm db:sync-plans` against live Stripe. These are round local prices,
      // not a conversion of the old $49/$470.
      monthlyPrice: 250000, // 2,500.00 EGP
      yearlyPrice: 2500000, // 25,000.00 EGP (save 2 months)
      maxCars: 100,
      maxMembers: 10,
      maxImagesPerCar: 15,
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
      // EGP, minor units (piastres). PLACEHOLDER — see the Pro plan above.
      monthlyPrice: 990000, // 9,900.00 EGP
      yearlyPrice: 9900000, // 99,000.00 EGP (save 2+ months)
      maxCars: -1, // Unlimited
      maxMembers: -1, // Unlimited
      maxImagesPerCar: 30,
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

  const allPlans = [enterprisePlan, proPlan, starterPlan];
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

  const createdOrgs: { org: any; plan: any }[] = [];

  for (let i = 0; i < DEMO_ORGANIZATIONS.length; i++) {
    const orgData = DEMO_ORGANIZATIONS[i];
    // Cycle through plans: first 2 get Enterprise, next 3 get Pro, rest get Starter
    const plan = i < 2 ? enterprisePlan : i < 5 ? proPlan : starterPlan;

    const org = await prisma.organization.create({
      data: {
        name: orgData.name,
        slug: orgData.slug,
        email: orgData.email,
        phone: orgData.phone,
        address: orgData.address,
        city: orgData.city,
        region: orgData.region,
        country: orgData.country,
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
    const memberCount = Math.min(
      plan.maxMembers === -1 ? 3 : plan.maxMembers - 1,
      3
    );
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
  for (let i = 0; i < 15; i++) {
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
  for (const { org } of createdOrgs) {
    const carCount = faker.number.int({ min: 8, max: 15 });

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
    if (orgCars.length === 0) continue;

    const testDriveCount = faker.number.int({ min: 3, max: 8 });

    for (let i = 0; i < testDriveCount; i++) {
      const customer = faker.helpers.arrayElement(customerUsers);
      const { car } = faker.helpers.arrayElement(orgCars);
      const futureDate = faker.date.future({ years: 0.1 });

      await prisma.testDrive.create({
        data: {
          organizationId: org.id,
          userId: customer.id,
          carId: car.id,
          status: faker.helpers.arrayElement([
            "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED",
          ] as const),
          date: futureDate,
          startTime: faker.helpers.arrayElement([
            "09:00", "10:00", "11:00", "14:00", "15:00", "16:00",
          ]),
          endTime: faker.helpers.arrayElement([
            "10:00", "11:00", "12:00", "15:00", "16:00", "17:00",
          ]),
          notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        },
      });
    }

    console.log(`  ✅ ${org.name}: Created ${testDriveCount} test drives`);
  }
  console.log("");

  // ============ CREATE DEALERSHIP REVIEWS ============
  console.log("⭐ Creating dealership reviews...");

  for (const { org } of createdOrgs) {
    const reviewCount = faker.number.int({ min: 2, max: 6 });
    const reviewers = faker.helpers.arrayElements(customerUsers, reviewCount);

    for (const reviewer of reviewers) {
      const review = generateReview();

      try {
        await prisma.dealershipReview.create({
          data: {
            organizationId: org.id,
            userId: reviewer.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            isApproved: faker.datatype.boolean({ probability: 0.8 }),
          },
        });
      } catch (e) {
        // Ignore duplicate user+org reviews
      }
    }

    // Update org's denormalized rating
    const reviews = await prisma.dealershipReview.findMany({
      where: { organizationId: org.id, isApproved: true },
    });

    if (reviews.length > 0) {
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: reviews.length,
        },
      });
    }

    console.log(`  ✅ ${org.name}: Created reviews`);
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
  console.log(`   - ${createdOrgs.length} Organizations with subscriptions`);
  console.log(`   - ${allCars.length} Cars total (real specs & images)`);
  console.log(`   - ${customerUsers.length} Customer users`);
  console.log("   - Test drives, reviews, and audit logs");
  console.log("\n🔗 Access your organizations:");
  for (const { org } of createdOrgs) {
    console.log(`   - http://${org.slug}.localhost:3000`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
