import type { HHModule_ConfigSchema } from "./base";
import PopupPlusPlus from "./modules/Popup++";
import People from "./modules/PeopleToWiki";
import LabyTeamPresets from "./modules/LabyTeamPresets";
import WhaleBossTournament from "./modules/WhaleBossTournament";
import PlacesOfPowerPlusPlus from "./modules/PlacesOfPower++";
import NoReloadFromClaimingDailyChests from "./modules/NoReloadFromClaimingDailyChests";
import MERankingInfo from "./modules/MERankingInfo";
import EventInfo from "./modules/EventInfo";
import UpdateHandler from "./UpdateHandler";
import LoveRaids from "./modules/LoveRaids";
import FixSessID from "./modules/FixSessID";
import { sessionStorageHandler } from "./utils/StorageHandler";
import ShardTrackersQoL from "./modules/ShardTrackersQoL";
import PopupMinusMinus from "./modules/Popup--";
import CustomCSS from "./AlwaysRunningModules/customCSS";
import PlayerLeagueTracking from "./AlwaysRunningModules/PlayerLeagueTracking";
import PlayerSeasonTracking from "./AlwaysRunningModules/PlayerSeasonTracking";
import MenuExtensions from "./modules/MenuExtensions";
import LeaguesQoL from "./modules/LeaguesQoL";
import PlayerPrestigeTracking from "./AlwaysRunningModules/PlayerPrestigeTracking";
import ChampionFightsFromMap from "./modules/ChampionFightsFromMap";
import StyleTweak from "./modules/StyleTweak";
import PlayerDrillTracking from "./AlwaysRunningModules/PlayerDrillTracking";
import PlayerClubTracking from "./AlwaysRunningModules/PlayerClubTracking";
import PlayerBadges from "./AlwaysRunningModules/PlayerBadges";
import { Several_QoL_Badges } from "./utils/Several_QoL_Badges";
import HHPlusPlusBdsmPatch from "./modules/HHPlusPlusBdsmPatch";
import MythicGirlEquipmentTracker from "./modules/MythicGirlEquipmentTracker";
import runTimingHandler from "./runTimingHandler";
import AjaxCompleteHook from "./SingletonModules/AjaxCompleteHook";
import PlayerActivitiesTracking from "./AlwaysRunningModules/PlayerActivitiesTracking";
import GirlMonitoring from "./AlwaysRunningModules/GirlMonitoring";
import BetterNSFWCensor from "./AlwaysRunningModules/BetterNSFWCensor";
import LabyLocking from "./AlwaysRunningModules/LabyLocking";

class Userscript {
  constructor() {
    if (location.pathname === "/integrations/") {
      return;
    } // do not run on integrations page otherwise it breaks on phone
    if (location.hostname.startsWith("nutaku")) {
      this._applySessionFix();
      this._allModules.push(FixSessID);
    }
    if (location.pathname === "/") {
      console.log("Running frame page, returning early");
      return;
    }
    this._run();
    this._runModules();
  }

  private _allModules = [
    PopupMinusMinus,
    StyleTweak,
    LeaguesQoL,
    NoReloadFromClaimingDailyChests,
    People,
    PlacesOfPowerPlusPlus,
    LoveRaids,
    MenuExtensions,
    PopupPlusPlus,
    LabyTeamPresets,
    MERankingInfo,
    WhaleBossTournament,
    EventInfo,
    ShardTrackersQoL,
    ChampionFightsFromMap,
    HHPlusPlusBdsmPatch,
    MythicGirlEquipmentTracker,
  ];
  private _alwaysRunningModules = [
    PlayerBadges,
    PlayerLeagueTracking,
    CustomCSS,
    PlayerSeasonTracking,
    PlayerPrestigeTracking,
    PlayerDrillTracking,
    PlayerClubTracking,
    PlayerActivitiesTracking,
    GirlMonitoring,
    BetterNSFWCensor,
    LabyLocking,
  ];
  private _singletonInitModules = [AjaxCompleteHook];

  private async _runModules() {
    const instancesToRegister: InstanceType<(typeof this._allModules)[number]>[] = [];
    if (location.pathname.includes("/home.html")) {
      this._allModules.forEach((module) => {
        const instance = new module();
        instancesToRegister.push(instance);
      });
    } else {
      this._allModules.forEach((module) => {
        if (module.shouldRun_()) {
          const instance = new module();
          instancesToRegister.push(instance);
        }
      });
    }
    const hhPlusPlusLoaded = await runTimingHandler.afterHHPlusPlusRun_();
    if (hhPlusPlusLoaded) {
      console.log("HH++ detected, registering modules through its config");
      this._runWithBDSM(instancesToRegister);
    } else {
      console.log("HH++ not detected, running modules without BDSM");
      this._runWithoutBdsm(instancesToRegister);
    }
  }

  private async _runWithBDSM(
    instancesToRegister: InstanceType<(typeof this._allModules)[number]>[],
  ) {
    unsafeWindow.hhPlusPlusConfig.registerGroup({
      key: "severalQoL",
      name: "<span tooltip='By infarctus'>Several QoL</span>",
    });
    instancesToRegister.forEach(async (instance) => {
      unsafeWindow.hhPlusPlusConfig.registerModule(instance);
    });
    unsafeWindow.hhPlusPlusConfig.loadConfig();
    unsafeWindow.hhPlusPlusConfig.runModules();
  }
  private async _runWithoutBdsm(
    instancesToRegister: InstanceType<(typeof this._allModules)[number]>[],
  ) {
    instancesToRegister.forEach(async (module) => {
      try {
        const schema = module.configSchema as HHModule_ConfigSchema;
        if (schema.default) {
          try {
            if (schema.subSettings) {
              const subSettings = schema.subSettings.reduce(
                (acc, setting) => {
                  acc[setting.key] = setting.default;
                  return acc;
                },
                {} as Record<string, any>,
              );
              await runTimingHandler.afterGameScriptsRun_();
              module.run(subSettings as any);
            } else {
              await runTimingHandler.afterGameScriptsRun_();
              module.run(undefined as any);
            }
          } catch (e) {
            console.error("Error running module with subsettings", module, e);
          }
        }
      } catch (e) {
        console.error("Error running module", module, e);
      }
    });
  }
  private _applySessionFix() {
    if (!location.search.includes("sess=") && sessionStorageHandler.getSessID_() != "") {
      const storedSessID = sessionStorageHandler.getSessID_();
      if (!storedSessID) {
        return;
      }
      const newURL =
        location.href + (location.href.includes("?") ? "&" : "?") + "sess=" + storedSessID;
      console.log("FixSessID: reloading page with stored sessID:", newURL);
      window.location.replace(newURL);
    }
  }
  private _run() {
    UpdateHandler.run_();
    Several_QoL_Badges.ensureCacheIsValid();
    this._singletonInitModules.forEach(async (module) => {
      module.init_();
    });
    this._alwaysRunningModules.forEach(async (module) => {
      if (module.shouldRun_()) {
        new module().run_();
      }
    });
  }
}

new Userscript();
