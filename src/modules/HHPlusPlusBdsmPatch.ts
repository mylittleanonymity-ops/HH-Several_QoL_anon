import { HHModule, HHModule_ConfigSchema, SubSettingsType } from "../base";
import { temporaryPoPBarCss } from "../css/modules";
import runTimingHandler from "../runTimingHandler";
import { TooltipHook } from "../SingletonModules/TooltipHook";
import { UnsafeWindow_Activities } from "../types/unsafeWindows/activities";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";
import { GirlGlobalStorageHandler, PlayerStorageHandler } from "../utils/StorageHandler";
import html from "../utils/html";
import GameHelpers from "../utils/GameHelpers";
import {
  DoBattlesTrollsResponse,
  gemsItem,
  HeroChangesCurrencyUpdate,
  VillainPreBattle,
} from "../types";
import AjaxCompleteHook from "../SingletonModules/AjaxCompleteHook";

type HHPlusPlusBdsmPatch_configSchema = {
  baseKey: "hhPlusPlusBdsmPatch";
  label: "<span tooltip='Add some things BDSM may add at some point'>HH++ BDSM Patch (Temporary fix/addons)</span>";
  default: true;
  subSettings: [
    {
      key: "temporaryPoPBar";
      label: "PoP/Mission Bar";
      default: true;
    },
    {
      key: "fixVillainFightSelectorGirlIcon";
      label: "Fix villain fight selector icon for new girls";
      default: true;
    },
  ];
};

type ActivityBarDisplayType = "pop" | "activity";

export default class HHPlusPlusBdsmPatch extends HHModule {
  readonly configSchema: HHModule_ConfigSchema = {
    baseKey: "hhPlusPlusBdsmPatch",
    label:
      "<span tooltip='Add some things BDSM may add at some point'>HH++ BDSM Patch (Temporary fix/addons)</span>",
    default: true,
    subSettings: [
      {
        key: "temporaryPoPBar",
        label: "PoP/Mission Bar",
        default: true,
      },
      {
        key: "fixVillainFightSelectorGirlIcon",
        label: "Fix villain fight selector icon for new girls",
        default: true,
      },
      /* {
        key: "fixSandalwoodTracking",
        label: "Fix Sandalwood for skins & for non mythics",
        default: true,
      }, */
    ],
  };
  static shouldRun_() {
    return true;
  }
  async run(subSettings: SubSettingsType<HHPlusPlusBdsmPatch_configSchema>) {
    if (this._hasRun || !HHPlusPlusBdsmPatch.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();
    if (subSettings.temporaryPoPBar) {
      this._addPoPBar();
    }
    if (subSettings.fixVillainFightSelectorGirlIcon) {
      this._fixVillainFightSelectorGirlIcon();
    }
  }
  private _getActivityBarDisplayType(
    popRemainingTimeSec: number,
    missionEndTime: number | null,
    missionRemainingTimeSec: number,
  ): ActivityBarDisplayType {
    if (popRemainingTimeSec <= 0 || missionEndTime === null) {
      return "pop";
    }
    return missionRemainingTimeSec < popRemainingTimeSec ? "activity" : "pop";
  }
  private _addPoPBar() {
    let popRemainingTimeSec = 0,
      popDurationTimeSec = 1;
    let activityRemainingTimeSec = 0,
      activityDurationTimeSec = 1;

    // Get PoP data
    if (location.pathname !== "/activities.html") {
      const hhTrackedTimes = JSON.parse(localStorage.getItem("HHPlusPlusTrackedTimes") || "{}");
      if (hhTrackedTimes.pop && hhTrackedTimes.popDuration) {
        popRemainingTimeSec = Math.max(0, hhTrackedTimes.pop - server_now_ts);
        popDurationTimeSec = hhTrackedTimes.popDuration || 1;
      }
    } else {
      let currWindow = unsafeWindow as UnsafeWindow_Activities;
      if (currWindow.pop_data) {
        let popDatas = Object.values(currWindow.pop_data).filter((data) => data.remaining_time);
        if (popDatas.length > 0) {
          const soonestPop = popDatas.reduce((soonest, data) => {
            return data.remaining_time! < soonest.remaining_time! ? data : soonest;
          });
          popRemainingTimeSec = soonestPop.remaining_time;
          popDurationTimeSec = soonestPop.duration || 1;
        }
      }
    }

    // Get Activity data
    const missionEndTime = PlayerStorageHandler.getPlayerMissionState_();
    const missionDuration = PlayerStorageHandler.getPlayerMissionDuration_();
    if (missionEndTime !== null && missionDuration !== null) {
      activityRemainingTimeSec = Math.max(0, missionEndTime - Math.floor(Date.now() / 1000));
      activityDurationTimeSec = missionDuration;
    }

    // Always show at least the PoP bar - don't return early

    const displayType = this._getActivityBarDisplayType(
      popRemainingTimeSec,
      missionEndTime,
      activityRemainingTimeSec,
    );
    let displayRemainingTimeSec, displayDurationTimeSec;
    let currentHref: string;

    if (displayType === "activity") {
      displayRemainingTimeSec = activityRemainingTimeSec;
      displayDurationTimeSec = activityDurationTimeSec;
      currentHref = shared.general.getDocumentHref("/activities.html?tab=missions");
    } else {
      displayRemainingTimeSec = popRemainingTimeSec;
      displayDurationTimeSec = popDurationTimeSec;
      currentHref = shared.general.getDocumentHref("/activities.html?tab=pop");
    }

    const DateNowInit = Date.now();

    // Clamp progress between 0 and 1
    const elapsed = displayDurationTimeSec - displayRemainingTimeSec;
    const progress = Math.max(0, Math.min(1, elapsed / displayDurationTimeSec));

    // SVG circular progress ring parameters
    const size = 36;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    const isFinished = progress >= 1;
    const containerClass = isFinished
      ? "sqol-activity-bar-container sqol-activity-bar-finished"
      : "sqol-activity-bar-container";

    const missionIconSrc = "https://nutaku.haremheroes.com/images/design/menu/missions.svg";
    const popIconSrc =
      "https://hh.hh-content.com/pictures/gallery/18/200x/379e7b87f856f75d6016f0242415d028.webp";
    const iconSrc = displayType === "pop" ? popIconSrc : missionIconSrc;
    const altText = displayType === "pop" ? "PoP" : "Mission";

    const $activityBar = $(html`
      <a
        href="${currentHref}"
        class="${containerClass}"
        tooltip="<div class='activity-tooltip-template'><div class='activity-tooltip-item'>PoP : <br/>50m 50s</div><div class='activity-tooltip-item'>Activity: <br/>50m 50s</div></div>"
        tooltip_extra_classes="QoL-custom-tooltip activity-tooltip"
        timeToFinish="${displayRemainingTimeSec}"
        popTimeToFinish="${popRemainingTimeSec}"
        activityTimeToFinish="${activityRemainingTimeSec}"
        hasMission="${missionEndTime !== null}"
        displayType="${displayType}"
      >
        <svg class="sqol-activity-bar-ring" viewBox="0 0 ${size} ${size}">
          <circle
            class="sqol-activity-bar-ring-bg"
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            stroke-width="${strokeWidth}"
          />
          <circle
            class="sqol-activity-bar-ring-progress"
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${dashOffset}"
          />
        </svg>
        <img class="sqol-activity-bar-icon" src="${iconSrc}" alt="${altText}" />
      </a>
    `);

    GM_addStyle(temporaryPoPBarCss);

    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      "#contains_all header>.script-booster-status",
      ($scriptBoostStatus) => {
        $scriptBoostStatus.after($activityBar);

        const updateActivityBar = () => {
          const hhTrackedTimesUpdated = JSON.parse(
            localStorage.getItem("HHPlusPlusTrackedTimes") || "{}",
          );
          const missionEndTimeUpdated = PlayerStorageHandler.getPlayerMissionState_();
          const missionDurationUpdated = PlayerStorageHandler.getPlayerMissionDuration_();

          let popTimeRemaining = 0;
          let activityTimeRemaining = 0;

          if (hhTrackedTimesUpdated.pop && hhTrackedTimesUpdated.popDuration) {
            popTimeRemaining = Math.max(
              0,
              hhTrackedTimesUpdated.pop - server_now_ts + (DateNowInit - Date.now()) / 1000,
            );
          }

          if (missionEndTimeUpdated !== null && missionDurationUpdated !== null) {
            activityTimeRemaining = Math.max(
              0,
              missionEndTimeUpdated - Math.floor(Date.now() / 1000),
            );
          }

          const currentDisplayType = this._getActivityBarDisplayType(
            popTimeRemaining,
            missionEndTimeUpdated,
            activityTimeRemaining,
          );
          const newHref = shared.general.getDocumentHref(
            currentDisplayType === "activity"
              ? "/activities.html?tab=missions"
              : "/activities.html?tab=pop",
          );

          // Update href if it changed
          $activityBar.attr("href", newHref);

          // Update display type and icon if needed
          const prevDisplayType = $activityBar.attr("displayType") as "pop" | "activity";
          if (prevDisplayType !== currentDisplayType) {
            if (currentDisplayType === "pop") {
              $activityBar.find("img").attr("src", popIconSrc).attr("alt", "PoP");
            } else {
              $activityBar.find("img").attr("src", missionIconSrc).attr("alt", "Mission");
            }
            $activityBar.attr("displayType", currentDisplayType);
          }

          $activityBar.attr("popTimeToFinish", popTimeRemaining);
          $activityBar.attr("activityTimeToFinish", activityTimeRemaining);
          $activityBar.attr("hasMission", String(missionEndTimeUpdated !== null));
          $activityBar.attr(
            "timeToFinish",
            currentDisplayType === "pop" ? popTimeRemaining : activityTimeRemaining,
          );

          // Update SVG progress ring
          let popDurationUpdated = 0;
          const hhTrackedTimesForDuration = JSON.parse(
            localStorage.getItem("HHPlusPlusTrackedTimes") || "{}",
          );
          if (hhTrackedTimesForDuration.popDuration) {
            popDurationUpdated = hhTrackedTimesForDuration.popDuration;
          }

          let displayDurationForRing = 1;
          if (currentDisplayType === "pop" && popDurationUpdated > 0) {
            displayDurationForRing = popDurationUpdated;
          } else if (currentDisplayType === "activity" && missionDurationUpdated) {
            displayDurationForRing = missionDurationUpdated;
          }

          const elapsedForRing =
            displayDurationForRing -
            (currentDisplayType === "pop" ? popTimeRemaining : activityTimeRemaining);
          const progressForRing = Math.max(0, Math.min(1, elapsedForRing / displayDurationForRing));
          const dashOffsetForRing = circumference * (1 - progressForRing);

          $activityBar
            .find(".sqol-activity-bar-ring-progress")
            .attr("stroke-dashoffset", dashOffsetForRing);

          // Update flashing class if progress is complete
          if (progressForRing >= 1) {
            if (!$activityBar.hasClass("sqol-activity-bar-finished")) {
              $activityBar.addClass("sqol-activity-bar-finished");
            }
          } else {
            if ($activityBar.hasClass("sqol-activity-bar-finished")) {
              $activityBar.removeClass("sqol-activity-bar-finished");
            }
          }
        };

        updateActivityBar();
        setInterval(updateActivityBar, 1000);
      },
    );
    TooltipHook.getInstance_().addTooltipOverride_(
      "[tooltip].sqol-activity-bar-container",
      ".activity-tooltip",
      (currentTarget, tooltipElement) => {
        const popTime = Number($(currentTarget).attr("popTimeToFinish") || "0");
        const activityTime = Number($(currentTarget).attr("activityTimeToFinish") || "0");
        const hasMission = $(currentTarget).attr("hasMission") === "true";

        const content: string[] = [];

        if (popTime > 0) {
          const timer = shared.timer.buildTimer(popTime, "", "pop-timer");
          content.push(`<div class="activity-tooltip-item">PoP: ${timer}</div>`);
        }

        if (hasMission && activityTime > 0) {
          const timer = shared.timer.buildTimer(activityTime, "", "mission-timer");
          content.push(`<div class="activity-tooltip-item">Mission: ${timer}</div>`);
        } else if (hasMission) {
          content.push(`<div class="activity-tooltip-item">Mission: Ready</div>`);
        }

        if (content.length === 0) {
          $(tooltipElement).empty().append(`All activities are ready !`);
        } else {
          $(tooltipElement)
            .empty()
            .append(`<div class="activity-tooltip-content">${content.join("")}</div>`);
          shared.timer.activateTimers("pop-timer", () => {});
          shared.timer.activateTimers("mission-timer", () => {});
        }
      },
    );
  }
  private _fixVillainFightSelectorGirlIcon() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(".energy_counter[type='fight']", ($el) => {
      $el.one("click", () => {
        HHPlusPlusReplacer.doWhenSelectorAvailable_(
          ".script-fight-a-villain-menu .menu-villain-bottom .girl_ico>img",
          ($icos) => {
            let storedGirls = GirlGlobalStorageHandler.getGirlGlobalStorage_();
            $icos.each((_, ico) => {
              const img = ico as HTMLImageElement;
              const srcAttr = img.getAttribute("src");
              if (srcAttr?.includes("ico0-300x")) {
                const id = srcAttr.match(/\/pictures\/girls\/(\d+)\/ico0-300x/)?.[1];
                if (!id) return;
                const storedGirl = storedGirls[id];
                if (!storedGirl) return;

                const newSrc = GameHelpers.buildGirlIconPathFromHash_(
                  Number(id),
                  storedGirl.ico,
                  srcAttr,
                );

                const onError = function onError() {
                  img.removeEventListener("error", onError);
                  if (img.getAttribute("src") !== newSrc) {
                    img.setAttribute("src", newSrc);
                  }
                };

                img.addEventListener("error", onError);

                // If image already failed to load, trigger replacement immediately
                if (img.complete && img.naturalWidth === 0) {
                  onError();
                }
              }
            });
          },
        );
      });
    });
  }
  /* private _fixSandalwoodTracking() {
    if (
      location.pathname !== "/troll-pre-battle.html" &&
      location.pathname !== "/troll-battle.html"
    ) {
      return;
    }
    let Sandalwood = JSON.parse(
        localStorage.getItem("HHPlusPlusBoosterStatus") ?? "{}",
      ).mythic.find((a: any) => a.item.identifier == "MB1");
    if (PlayerStorageHandler.getShouldApplyStoredSandalwood()) {
      let newSandalwood = PlayerStorageHandler.getPlayerSandalwood();
      if(newSandalwood == null) { // case where HH++ didn't correctly 
        if(Sandalwood){

        }
      }
    }
    if (location.pathname === "/troll-battle.html") {
      if (PlayerStorageHandler.getShouldApplyStoredSandalwood()) {
      }
      
      PlayerStorageHandler.setPlayerSandalwood(Sandalwood);
    }
    let currentSandalwood = PlayerStorageHandler.getPlayerSandalwood();
    if (currentSandalwood) {
      AjaxCompleteHook.getInstance_().addCallback_((event, xhr, settings) => {
        if (
          typeof settings?.data === "string" &&
          settings.data.includes("action=do_battles_trolls")
        ) {
          const response = xhr.responseJSON as DoBattlesTrollsResponse;
          const battlesMatch = settings.data.match(/number_of_battles=(\d+)/);
          const number_of_battles = battlesMatch ? parseInt(battlesMatch[1], 10) : 1;
          let nbFightsThatDroppedShards = this._calculateNumberOfFightsThatDroppedShards(
            response,
            number_of_battles,
          );

          if (nbFightsThatDroppedShards !== 0) {
            PlayerStorageHandler.setShouldApplyStoredSandalwood(true);
            if (currentSandalwood.usages_remaining < nbFightsThatDroppedShards) {
              PlayerStorageHandler.setPlayerSandalwood(null);
            } else {
              currentSandalwood.usages_remaining -= nbFightsThatDroppedShards;
              PlayerStorageHandler.setPlayerSandalwood(currentSandalwood);
            }
          }
        }
      }, true);
    }
  } */

  private _calculateNumberOfFightsThatDroppedShards(
    response: DoBattlesTrollsResponse,
    nbFights: number,
  ): number {
    if (!response.rewards) {
      return 0;
    }
    const rewardsData = response.rewards.data;
    if (nbFights === 1) {
      return rewardsData.shards || rewardsData.girls || rewardsData.grade_skins ? 1 : 0;
    }
    if (!rewardsData.rewards) {
      return nbFights;
    }
    let accountedFights = 0;
    const opponentFighter = unsafeWindow.opponent_fighter as VillainPreBattle;
    for (const reward of rewardsData.rewards) {
      if (reward.type === "gems") {
        // Only way this breaks, is with gem boosters (mythic booster) and it runs out halfway through the drops
        const gainedGems = reward.value; // This includes prestige boost, but villain shown gem doesn't account for it
        const gemVilain = opponentFighter!.rewards.data.rewards.find(
          (r) => "gem_type" in r && r.gem_type === reward.gem_type,
        )! as gemsItem;
        const gemPrestigeBoost = PlayerStorageHandler.getPlayerGemsPrestigeBonus_();
        accountedFights += Math.round(gainedGems / (1 + gemPrestigeBoost) / gemVilain.value);
      } else if (reward.type === "soft_currency") {
        const newSoftCurrency = (response.rewards.heroChangesUpdate as HeroChangesCurrencyUpdate)
          .currency!.soft_currency!;
        const oldSoftCurrency = shared.Hero.currencies.soft_currency;
        const currencyDiff = newSoftCurrency - oldSoftCurrency;
        const villainCurrencyAmount = GameHelpers.convertShownMoneyToNumber(
          opponentFighter!.rewards.data.rewards.find((r) => r.type === "soft_currency")!.value,
        );
        accountedFights += Math.round(currencyDiff / villainCurrencyAmount);
      } else if (reward.type === "lively_scene") {
        accountedFights += 1;
      } else if (reward.type === "item") {
        accountedFights += reward.value.quantity;
      } else if (reward.type === "energy_quest") {
        const EnergyQuestVilain = opponentFighter!.rewards.data.rewards.find(
          (r) => r.type === "energy_quest",
        )!;
        accountedFights += Math.round(Number(reward.value) / Number(EnergyQuestVilain.value));
      } else if (typeof reward.value === "number") {
        accountedFights += reward.value;
      } else if (typeof reward.value === "string" && !isNaN(Number(reward.value))) {
        accountedFights += Number(reward.value);
      } else {
        console.warn("Unknown reward type encountered in shard tracker:", reward);
        if ((reward as any).value && !isNaN(Number((reward as any).value))) {
          accountedFights += Number((reward as any).value);
        }
      }
    }
    return nbFights - accountedFights;
  }
}
