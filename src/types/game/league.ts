export interface LeagueOpponentIncomplete {
  // XXX  extends OpponentFighter
  // very very incomplete x)
  place: number;
  player: {
    id_fighter: number;
  };
  power: number;
  nickname: string;
  Several_QoL?: {
    // added by the script
    checkExpiresAt: number;
    bestPlace: number;
    timesReached: number;
  };
  match_history: {
    [key: number]: Array<{
      attacker_won: "won" | (string & {});
      match_points: number;
    } | null>;
  };
  sim?: {
    forSim: {
      battleTable: string;
      hasAssumptions: boolean;
      mythicBoosterMultiplier: number;
      opponentTeam: any;
      playerTeam: any;
      result: any;
      boosterResults?: any;
      boosterTable?: any;
      skillResults?: any;
      skillTable?: any;
    };
  };
}
