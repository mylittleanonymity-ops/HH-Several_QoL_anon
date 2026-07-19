import { AlwaysRunningModule } from "../base";
import runTimingHandler from "../runTimingHandler";
import { SeasonTiers } from "../types/game/season";
import { PlayerStorageHandler } from "../utils/StorageHandler";

export default class PlayerSeasonTracking extends AlwaysRunningModule {
  static shouldRun_() {
    return location.pathname === "/season.html" || location.pathname === "/season-arena.html";
  }
  async run_() {
    if (this._hasRun || !PlayerSeasonTracking.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();
    console.log("PlayerSeasonTracking module running");
    this._syncPlayerSeasonInfo();
  }
  private _syncPlayerSeasonInfo() {
    const seasonMojo = unsafeWindow.season_mojo_s as number | undefined;
    if (seasonMojo === undefined) {
      return;
    }
    const season_tiers = unsafeWindow.season_tiers as SeasonTiers | undefined;
    if (!season_tiers) {
      return;
    }
    const currentTier = unsafeWindow.season_tier as number | undefined;
    if (currentTier === undefined) {
      return;
    }
    const nextTier = season_tiers.find((tier) => {
      return Number(tier.tier) === currentTier + 1;
    });
    const currentTierInfo = season_tiers.find((tier) => {
      return Number(tier.tier) === currentTier;
    })!;
    const previousTierThreshold = Number(currentTierInfo.mojo_required);
    const nextTierThreshold = nextTier ? Number(nextTier.mojo_required) : undefined;
    const storedSeasonName = PlayerStorageHandler.getPlayerSeasonInfo_()?.name;
    PlayerStorageHandler.setPlayerSeasonInfo_({
      previousTierThreshold,
      nextTierThreshold,
      mojo: seasonMojo,
      name: $("#seasons_tab_title").contents()[0]?.textContent?.trim() || storedSeasonName,
      tier: currentTier,
      endsAt: (unsafeWindow.season_sec_untill_event_end as number) + server_now_ts || undefined,
    });
  }
}
