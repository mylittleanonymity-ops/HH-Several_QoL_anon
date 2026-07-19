import { AlwaysRunningModule } from "../base";
import runTimingHandler from "../runTimingHandler";
import { penta_drill_data } from "../types";
import { PlayerStorageHandler } from "../utils/StorageHandler";

export default class PlayerDrillTracking extends AlwaysRunningModule {
  static shouldRun_() {
    return location.pathname === "/penta-drill.html";
  }
  async run_() {
    if (this._hasRun || !PlayerDrillTracking.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();
    console.log("PlayerDrillTracking module running");
    const pentaDrillData = unsafeWindow.penta_drill_data as penta_drill_data | undefined;
    if (!pentaDrillData) {
      return;
    }
    const currentTier = pentaDrillData.progression.tier;
    const currentPotions = pentaDrillData.progression.potions;
    const currentTierPathRewards = pentaDrillData.path_rewards.find(
      (pr) => pr.tier === currentTier,
    )!;
    const nextTierPathRewards = pentaDrillData.path_rewards.find(
      (pr) => pr.tier === currentTier + 1,
    );
    PlayerStorageHandler.setPlayerPentaDrillInfo_({
      tier: currentTier,
      potions: currentPotions,
      previousTierThreshold: currentTierPathRewards.potions_required,
      nextTierThreshold: nextTierPathRewards ? nextTierPathRewards.potions_required : undefined,
      endsAt: pentaDrillData.cycle_data.seconds_until_event_end + server_now_ts,
    });
  }
}
