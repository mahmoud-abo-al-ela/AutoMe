/**
 * Custom fields this app stores on Stream channels.
 *
 * Stream types channel data as a closed shape plus a `CustomChannelData`
 * interface it expects consumers to augment. Without this, every read of
 * `channel.data?.car_data` needs its own cast, and nothing checks that the
 * writer in actions/stream-chat and the readers in components/StreamChat
 * agree on the shape.
 */
import "stream-chat";

declare module "stream-chat" {
  /**
   * Custom user fields. `upsertStreamUser` spreads these flat onto the user
   * object, so they are read flat too — not under a `custom` key. Reading
   * `user.custom.user_role` (as the chat header did) always yielded undefined.
   */
  interface CustomUserData {
    clerk_id?: string;
    user_role?: string | null;
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
