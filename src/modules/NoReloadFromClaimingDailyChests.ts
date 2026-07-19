import { HHModule, HHModule_ConfigSchema, SubSettingsType } from "../base";
import runTimingHandler from "../runTimingHandler";
import RequestQueueHandler from "../SingletonModules/RequestQueueHandler";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";

declare let daily_goals_member_progression: {
  tier: number;
  potions_amount: number;
  taken_rewards_array: Array<string>;
  date_for: string; //"2025-10-06",
  next_rewards_in: number;
};

type configSchema = {
  baseKey: "noReloadFromClaimingDailyChests";
  label: "Activities : No reload from claiming daily chests";
  default: true;
  subSettings: [
    {
      key: "popupEnabled";
      default: true;
      label: "Show reward popup on claiming";
    },
  ];
};

export default class NoReloadFromClaimingDailyChests extends HHModule {
  readonly configSchema: HHModule_ConfigSchema = {
    baseKey: "noReloadFromClaimingDailyChests",
    label: "Activities : No reload from claiming daily chests",
    default: true,
    subSettings: [
      {
        key: "popupEnabled",
        default: true,
        label: "Show reward popup on claiming",
      },
    ],
  };
  static shouldRun_() {
    return true;
  }
  run(subSettings: SubSettingsType<configSchema>) {
    if (this._hasRun || !NoReloadFromClaimingDailyChests.shouldRun_()) {
      return location.pathname.includes("/activities.html");
    }
    this._hasRun = true;
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      ".switch-tab[data-tab='daily_goals']",
      ($DailyGoals) => {
        $DailyGoals.on("click", () => {
          console.log("Clicked daily goals");
          HHPlusPlusReplacer.doWhenSelectorAvailable_(".progress-bar-claim-reward", () => {
            this._applyNoReloadFix(subSettings.popupEnabled);
          });
        });
      },
    );
  }
  private _applyNoReloadFix(popupEnabled: boolean) {
    const self = this;
    $(".progress-bar-claim-reward")
      .off("click")
      .on("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        // OG function modified
        $(this).prop("disabled", true);
        const tier = $(this).attr("tier");
        if (!tier) {
          return;
        }
        const t = {
          action: "claim_daily_goal_tier_reward",
          tier: tier,
        };
        daily_goals_member_progression.taken_rewards_array.push(tier);
        shared.animations.loadingAnimation.start();
        RequestQueueHandler.getInstance_().addAjaxRequest_(t, (t: any) => {
          if (popupEnabled) {
            const n = t.rewards;
            shared.reward_popup.Reward.handlePopup(n);
          } else {
            shared.Hero.updates(t.rewards.heroChangesUpdate, false);
          }
          self._checkIfAllChestsClaimed();
          shared.animations.loadingAnimation.stop();
        });
      });
    $(".progress-bar-claim-reward").attr(
      "tooltip",
      `Several QoL: Claim without reload${popupEnabled ? "" : " & without popup"}`,
    );
  }

  private _checkIfAllChestsClaimed() {
    if (
      daily_goals_member_progression.taken_rewards_array.length >=
      Math.min(Math.floor(daily_goals_member_progression.potions_amount / 20), 5)
    ) {
      $(`[data-tab="daily_goals"] > .collect_notif`).remove();
    }
  }
}
