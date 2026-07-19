import { CompleteGirl } from "../../game";
import { BaseUnsafeWindow } from "../baseUnsafeWindow";

export interface UnsafeWindow_LegendaryDays extends BaseUnsafeWindow {
  time_remaining: number;
  current_event: CurrentEvent;
  event_girls: CompleteGirl[];
  extra_rewards_claimed: boolean;
  id_event: string;
  current_event_identifier: string;
  event_data: CurrentEvent;
  can_participate: boolean;
}

interface CurrentEvent {
  event_name: string;
  type: string;
  seconds_until_event_end: number;
  event_duration_seconds: number;
  identifier: string;
  can_participate: boolean;
  participation_info: string;
  progression_href: string;
  girls: CompleteGirl[];
  event_data: [];
  subtype: string;
}
