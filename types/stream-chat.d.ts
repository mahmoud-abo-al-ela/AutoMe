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
