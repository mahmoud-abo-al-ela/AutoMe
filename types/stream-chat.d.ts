import "stream-chat";

declare module "stream-chat" {
  interface CustomUserData {
    clerk_id?: string;
    user_role?: string | null;
  }

  interface CustomMessageData {
    translations?: Partial<Record<"ar" | "en", { text: string; source: string }>>;
    safety_flag?: { category: "scam" | "spam" | "abuse"; source: string };
  }

  interface CustomChannelData {
    organization_id?: string;
    car_id?: string;
    car_data?: {
      id?: string;
      title?: string | null;
      year?: number;
      make?: string;
      model?: string;
      price?: number | string;
      image?: string;
      images?: string[];
    };
    organization_data?: {
      id?: string;
      name?: string;
      slug?: string;
      logo?: string | null;
    };
  }
}
