import { AlwaysRunningModule } from "../base";
import runTimingHandler from "../runTimingHandler";
import { LeagueOpponentIncomplete } from "../types";
import { PlayerStorageHandler } from "../utils/StorageHandler";

export default class PlayerLeagueTracking extends AlwaysRunningModule {
  static shouldRun_() {
    return location.pathname === "/leagues.html";
  }
  async run_() {
    if (this._hasRun || !PlayerLeagueTracking.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();
    console.log("PlayerLeagueTracking module running");
    this._syncPlayerLeagueRank();
  }
  private _syncPlayerLeagueRank() {
    const currentLeagueTier = unsafeWindow.current_tier_number as number | undefined;
    if (currentLeagueTier === undefined) {
      return;
    }
    const opponentsList = unsafeWindow.opponents_list as
      | Array<LeagueOpponentIncomplete>
      | undefined;
    if (!opponentsList) return;
    //opponents_list.find((a) => a.match_history_sorting === -1)
    const player = opponentsList.find((a) => a.player.id_fighter === shared.Hero.infos.id);
    if (!player) {
      return;
    }
    PlayerStorageHandler.setPlayerLeagueRank_({
      league: currentLeagueTier,
      rank: player.place,
    });
  }
}
