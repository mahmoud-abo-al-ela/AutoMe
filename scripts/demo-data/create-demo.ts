import type { PrismaClient, DayOfWeek } from "../../lib/generated/prisma";
import { findCity, findGovernorate } from "../../lib/locations/data";
import { questionKey } from "../../lib/utils/question-key";
import { BUYERS, DEALERSHIPS } from "./dealerships";
import { carRow, QUESTIONS, REVIEWS } from "./cars";

const DAY = 86_400_000;
const WEEKDAYS: DayOfWeek[] = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"];

/** A Cairo calendar day `offset` days from now, as the DATE column stores it. */
function cairoDay(now: Date, offset: number): Date {
  const cairo = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date(now.getTime() + offset * DAY));
  return new Date(`${cairo}T00:00:00Z`);
}

/** A half-hour slot inside the opening hours: Friday opens at 14:00. */
function slot(day: Date, hour: number) {
  const start = day.getUTCDay() === 5 ? Math.max(hour, 15) : hour;
  return { date: day, startTime: `${start}:00`, endTime: `${start}:30` };
}

export async function createDemo(db: PrismaClient, now: Date) {
  const plans = await db.plan.findMany({ select: { id: true, type: true } });
  const planId = (type: string) => {
    const plan = plans.find((p) => p.type === type);
    if (!plan) throw new Error(`No ${type} plan in this database; plans are created by migrations or the admin, not by this script.`);
    return plan.id;
  };

  const person = (key: string, name: string) =>
    db.user.create({ data: { clerkId: `demo_${key}`, email: `${key}@example.com`, name, role: "USER" } });
  const buyers = [];
  for (const [i, name] of BUYERS.entries()) buyers.push(await person(`buyer-${i + 1}`, name));

  let carCount = 0;
  const available: { id: string; organizationId: string }[] = [];
  for (const [d, dealer] of DEALERSHIPS.entries()) {
    const city = findCity(dealer.city);
    const governorate = findGovernorate(city?.governorate);
    if (!city || !governorate) throw new Error(`Unknown city ${dealer.city}`);
    // Street, city, governorate — the whole address, as the directions link
    // and the About tab show it; never a city without its governorate.
    const address = {
      en: `${dealer.street.en}, ${city.en}, ${governorate.en}`,
      ar: `${dealer.street.ar}، ${city.ar}، ${governorate.ar}`,
    };
    const owner = await person(dealer.owner.key, dealer.owner.name);
    const staff = dealer.staff ? await person(dealer.staff.key, dealer.staff.name) : null;

    const org = await db.organization.create({
      data: {
        name: dealer.name,
        slug: dealer.slug,
        email: `${dealer.slug}@example.com`,
        address: address.en,
        addressEn: address.en,
        addressAr: address.ar,
        description: dealer.about.en,
        descriptionEn: dealer.about.en,
        descriptionAr: dealer.about.ar,
        city: dealer.city,
        region: city.governorate,
        country: "EG",
        isActive: true,
        ...dealer.terms,
        // Written in English, its Arabic as the profile translation stores it.
        financingNote: dealer.terms.financingNote?.en ?? null,
        financingNoteEn: dealer.terms.financingNote?.en ?? null,
        financingNoteAr: dealer.terms.financingNote?.ar ?? null,
        subscription: {
          create: {
            planId: planId(dealer.plan),
            status: "ACTIVE",
            billingPeriod: "MONTHLY",
            currentPeriodStart: new Date(now.getTime() - 10 * DAY),
            currentPeriodEnd: new Date(now.getTime() + 20 * DAY),
          },
        },
        // One row a day, as the dealer's own settings page writes them.
        workingHours: {
          create: [
            ...WEEKDAYS.map((day) => ({ dayOfWeek: [day], openTime: "10:00", closeTime: "22:00", isOpen: true })),
            { dayOfWeek: ["FRIDAY" as DayOfWeek], openTime: "14:00", closeTime: "22:00", isOpen: true },
          ],
        },
        memberships: {
          create: [
            { userId: owner.id, role: "OWNER", acceptedAt: now },
            ...(staff ? [{ userId: staff.id, role: "MEMBER" as const, invitedById: owner.id, acceptedAt: now }] : []),
          ],
        },
      },
    });

    const cars = [];
    for (const [i, item] of dealer.stock.entries()) {
      cars.push(await db.car.create({ data: { ...carRow(item, d * 10 + i, now), organizationId: org.id } }));
    }
    carCount += cars.length;
    const forSale = cars.filter((c) => c.status === "AVAILABLE");
    available.push(...forSale.map((c) => ({ id: c.id, organizationId: org.id })));

    // Approved reviews from different buyers, and the rating they make.
    const reviews = [0, 1, 2].map((k) => REVIEWS[(d + k) % REVIEWS.length]);
    for (const [k, review] of reviews.entries()) {
      const at = new Date(now.getTime() - (5 + k * 9 + d) * DAY);
      await db.dealershipReview.create({
        data: { organizationId: org.id, userId: buyers[(d + k) % buyers.length].id, ...review, isApproved: true, createdAt: at, updatedAt: at },
      });
    }
    await db.organization.update({
      where: { id: org.id },
      data: {
        totalReviews: reviews.length,
        averageRating: Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10,
      },
    });

    // Questions the assistant left for the dealer: one answered, one waiting.
    for (const k of [0, 1]) {
      const q = QUESTIONS[(d * 2 + k) % QUESTIONS.length];
      const at = new Date(now.getTime() - (k + 1) * 2 * DAY);
      await db.buyerQuestion.create({
        data: {
          organizationId: org.id,
          carId: forSale[k % forSale.length].id,
          question: q.question,
          questionKey: questionKey(q.question),
          locale: q.locale,
          lastAskedAt: at,
          createdAt: at,
          ...(q.answer
            ? { status: "ANSWERED", answer: q.answer, answeredById: owner.id, answeredAt: new Date(at.getTime() + DAY), appliesToAllCars: true }
            : { status: "OPEN" }),
        },
      });
    }

    // Test drives: one done last week, one confirmed, one waiting on the dealer.
    const drives = [
      { status: "COMPLETED" as const, ...slot(cairoDay(now, -6), 11) },
      { status: "CONFIRMED" as const, ...slot(cairoDay(now, 2), 17) },
      { status: "PENDING" as const, ...slot(cairoDay(now, 4), 12) },
    ];
    for (const [k, drive] of drives.entries()) {
      await db.testDrive.create({
        data: { organizationId: org.id, carId: forSale[(k + 2) % forSale.length].id, userId: buyers[(d * 3 + k) % buyers.length].id, ...drive },
      });
    }
  }

  // Each buyer has saved a few cars around the country.
  let saves = 0;
  for (const [i, buyer] of buyers.entries()) {
    for (const k of [0, 7, 19]) {
      const car = available[(i * 5 + k) % available.length];
      await db.savedCar.create({ data: { userId: buyer.id, carId: car.id } }).then(() => saves++, () => undefined);
    }
  }

  return { dealerships: DEALERSHIPS.length, cars: carCount, buyers: buyers.length, saves };
}
