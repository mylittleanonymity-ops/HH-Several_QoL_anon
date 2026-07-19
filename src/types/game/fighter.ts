import { HeroClass } from "./common";

export interface OpponentFighter {
  player: {
    burn: null;
    chance: number;
    class: HeroClass;
    club: {
      id_club: number;
      name: string;
    } | null;
    current_season_mojo: number;
    damage: number;
    defense: number;
    ico: string;
    id_fighter: number;
    level: number;
    nickname: string;
    percent_remaining_ego: 100; // XXX only true for preFight ?, would need to check during fight
    remaining_ego: number;
    shield: null;
    stun: null;
    //team: Team; // not important for now
  };
}
