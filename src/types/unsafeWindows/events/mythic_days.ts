import { CompleteGirl, GirlID } from "../../game";
import { BaseUnsafeWindow } from "../baseUnsafeWindow";

export interface UnsafeWindow_MythicDays extends BaseUnsafeWindow {
  current_event_identifier: string; // 'mythic_event_XXX'
  time_remaining: number;
  current_event: {
    can_participate: boolean;
    event_data: {
      lively_scenes_data?: Array<{
        0: "lively_scene_text";
        anchor: {
          disabled: boolean; // should always be false ?
          label: string; // "After rescuing Matrix Jenet defeat Edwarda to get a chance to unlock the video!"
          url: string; // troll url WITHOUT sess
        };
        content: {
          image: null | string; // string when it's dropped
          image_censored: string;
          video: null | string; // string when it's dropped
          video_censored: string;
        };
        id_girl: GirlID;
        id_lively_scene: number;
        is_unlocked: boolean;
        name: string; // "C" ????
        order_num: number; // 2. No idea
        release_date: string; // "2026-03-03"
      }>;
      next_tranche_available: boolean;
      next_tranche_in: number;
      next_tranche_shards: number;
      shards_available: number;
      shards_given: number;
      shards_remaining: number;
      shards_total: number;
      tranche_count: number;
      tranche_current: number;
      tranche_duration: number;
      traches: Array<{
        current: boolean;
        end: number;
        shards_total: number;
        start: number;
      }>;
    };
    event_duration_seconds: number;
    event_name: string; // "Mythic Days";
    girls: Array<CompleteGirl>;
    identifier: string; // same as current_event_identifier ?
    participation_info: string; // message when you can't participate
    progression_href: string; // /quest/etc
    seconds_until_event_ends: number;
    subtype: "mythic";
    type: "mythic_event";
  };
  event_data: UnsafeWindow_MythicDays["current_event"];
  event_girls: Array<CompleteGirl>;
  extra_rewards_claimed: boolean;
  id_event: string; // "488"
  can_participate: boolean;
}
