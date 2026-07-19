import { HeroClass } from "./common";

export type membersList = Array<{
  avatar: number;
  class: HeroClass;
  contribution_points: number;
  count_girls: number;
  country: string;
  ico: string; //"https://cdn1-images.nutaku.com/images/members/137/square.jpg";
  id_member: number;
  is_co_leader: 0 | 1;
  is_leader: 0 | 1;
  last_activity_difference: number;
  last_connect: string; //"2026-02-02 11:19:06";
  level: number;
  mojo: number;
  nickname: string;
  questing_step: number;
}>;
