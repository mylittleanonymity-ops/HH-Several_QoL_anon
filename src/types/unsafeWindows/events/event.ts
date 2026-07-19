import { CompleteGirl, gemsItem } from "../../game";
import { BaseUnsafeWindow } from "../baseUnsafeWindow";

export interface UnsafeWindow_Event extends BaseUnsafeWindow {
  current_event_identifier: string;
  time_remaining: number;
  current_event: {
    can_participate: boolean;
    event_data: [];
    event_duration_seconds: number;
    event_name: string;
    extra_chest_rewards: {
      loot: boolean;
      rewards: Array<gemsItem>;
    };
    girls: Array<CompleteGirl>;
    identifier: string; // same as current_event_identifier ?
    participation_info: string; // message when you can't participate
    progression_href: string; // /quest/etc
    seconds_until_event_ends: number;
    subtype: "classic" | "orgy";
    type: "event";
  };
  event_data: UnsafeWindow_Event["current_event"];
  event_girls: Array<CompleteGirl>;
  extra_rewards_claimed: boolean;
  id_event: string; // "181"
  can_participate: boolean;
}
