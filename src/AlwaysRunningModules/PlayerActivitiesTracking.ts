import { AlwaysRunningModule } from "../base";
import runTimingHandler from "../runTimingHandler";
import AjaxCompleteHook from "../SingletonModules/AjaxCompleteHook";
import { UnsafeWindow_Activities } from "../types/unsafeWindows/activities";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";
import { PlayerStorageHandler } from "../utils/StorageHandler";

export default class PlayerActivitiesTracking extends AlwaysRunningModule {
  static shouldRun_() {
    return location.pathname === "/activities.html";
  }
  async run_() {
    if (this._hasRun || !PlayerActivitiesTracking.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();
    this._trackPlayerMissions();
    this._refreshMissionStateAfterClaim();
  }
  private _trackPlayerMissions() {
    const currWindow = unsafeWindow as UnsafeWindow_Activities;
    if (!currWindow.player_missions?.length) {
      this._clearMissionState();
      return;
    }
    const pendingMission = currWindow.player_missions.find(
      (mission) => mission.state === "pending",
    );
    if (!pendingMission) {
      this._markMissionsReady();
    } else {
      PlayerStorageHandler.setPlayerMissionState_(
        Math.floor(Date.now() / 1000) + pendingMission.remaining_time,
      );
      PlayerStorageHandler.setPlayerMissionDuration_(pendingMission.duration);
    }
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      "[id^='mission-'] [rel='mission_start']",
      ($mission_starts) => {
        $mission_starts.on("click.S_QoL", (event) => {
          const target = event.currentTarget as HTMLElement;
          const duration = JSON.parse(
            target.closest("[id^='mission-']")?.getAttribute("data-d") || "{}",
          ).duration;
          if (!duration) {
            console.error("Could not find mission duration, not updating mission state");
            return;
          }
          PlayerStorageHandler.setPlayerMissionState_(Math.floor(Date.now() / 1000) + duration);
          PlayerStorageHandler.setPlayerMissionDuration_(duration);
        });
      },
    );
  }

  private _refreshMissionStateAfterClaim() {
    AjaxCompleteHook.getInstance_().addCallback_((_event, xhr, settings) => {
      if (
        typeof settings.data !== "string" ||
        !settings.data.includes("action=missions_claim_reward") ||
        !xhr.responseJSON?.success
      ) {
        return;
      }

      if (document.querySelector("[id^='mission-']")) {
        this._markMissionsReady();
      } else {
        this._clearMissionState();
      }
    });
  }

  private _markMissionsReady() {
    PlayerStorageHandler.setPlayerMissionState_(Math.floor(Date.now() / 1000));
    PlayerStorageHandler.setPlayerMissionDuration_(
      PlayerStorageHandler.getPlayerMissionDuration_() || 1,
    );
  }

  private _clearMissionState() {
    PlayerStorageHandler.setPlayerMissionState_(null);
    PlayerStorageHandler.setPlayerMissionDuration_(null);
  }
}
