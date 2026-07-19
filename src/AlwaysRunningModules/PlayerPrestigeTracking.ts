import { AlwaysRunningModule } from "../base";
import runTimingHandler from "../runTimingHandler";
import { PlayerStorageHandler } from "../utils/StorageHandler";

type prestigeTier = {
  id_prestige_tier: number;
  is_current: boolean;
  max_points: number;
  min_points: number;
  perks: Array<{
    bonus: number;
    is_same_as_previous_tier: boolean;
    text: string;
  }>;
};

export default class PlayerPrestigeTracking extends AlwaysRunningModule {
  static shouldRun_() {
    return location.pathname === "/home.html";
  }
  async run_() {
    if (this._hasRun || !PlayerPrestigeTracking.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();
    console.log("PlayerPrestigeTracking module running");
    this._hookOrHandlePrestige();
  }
  private _hookOrHandlePrestige() {
    if (shared.popup_payment?.payment_products_data?.prestige) {
      const tier = (
        shared.popup_payment?.payment_products_data?.prestige.tiers as Array<prestigeTier>
      ).find((tier) => tier.is_current)!.id_prestige_tier;
      const gemsGainedBonus = this._handleGemsGainedFromPrestige(tier);
      PlayerStorageHandler.setPlayerGemsPrestigeBonus_(gemsGainedBonus);
    } else {
      $(document).ajaxComplete((_event, xhr, settings) => {
        if (typeof settings?.data === "string" && settings.data === "action=load_payment_methods") {
          const response = xhr.responseJSON;
          if (!response || !response.success) {
            return;
          }
          const tier = (response.data.products_data.prestige.tiers as Array<prestigeTier>).find(
            (tier) => tier.is_current,
          )!.id_prestige_tier;
          const gemsGainedBonus = this._handleGemsGainedFromPrestige(tier);
          PlayerStorageHandler.setPlayerGemsPrestigeBonus_(gemsGainedBonus);
        }
      });
    }
  }
  private _handleGemsGainedFromPrestige(currentTier: number) {
    if (currentTier < 9) {
      return 0;
    }
    switch (currentTier) {
      case 9:
        return 4;
      case 10:
        return 4.5;
      case 11:
        return 5;
      case 12:
        return 5.5;
      case 13:
        return 6;
      case 14:
        return 7;
      case 15:
        return 8;
      case 16:
        return 9;
      case 17:
        return 10;
      case 18:
        return 11;
      case 19:
        return 12;
      case 20:
        return 13;
      case 21:
        return 14;
      case 22:
        return 15;
      case 23:
        return 16;
      case 24:
        return 18;
      case 25:
        return 20;
      default:
        return 0;
    }
  }
}
