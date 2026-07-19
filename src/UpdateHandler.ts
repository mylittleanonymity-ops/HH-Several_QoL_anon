import GameHelpers from "./utils/GameHelpers";
import { HHPlusPlusReplacer } from "./utils/HHPlusPlusreplacer";
import {
  GlobalStorageHandler,
  GirlGlobalStorageHandler,
  ShardTrackerStorageHandler,
} from "./utils/StorageHandler";
import updateHandlerCss from "./css/UpdateHandler.css";
import { GirlID, Grade, TrackedGirl, TrackedGirlRecords, GirlRarity } from "./types";
import html from "./utils/html";
import runTimingHandler from "./runTimingHandler";
import AddDummyToHHPlusPlus from "./SingletonModules/AddDummyToHHPlusPlus";

export default class UpdateHandler {
  // needs to test it on real script not a link to local file
  static async run_() {
    const currentVersion = GM_info.script.version;
    const storedVersion = GlobalStorageHandler.getStoredScriptVersion_();
    console.log(
      `HH++ Several QoL: Current version ${currentVersion}, stored version ${storedVersion}`,
    );
    UpdateHandler._addOptionToHHPlusPlusConfig();
    if (storedVersion === currentVersion) {
      return;
    }
    const [storedMajor, storedMinor, storedPatch] = storedVersion.split(".").map(Number);
    //const [currentMajor, currentMinor, currentPatch] = currentVersion
    //  .split(".")
    //  .map(Number);

    if (storedMajor == 2 && storedMinor == 1 && GlobalStorageHandler.getShowUpdatePopup_()) {
      UpdateHandler._injectCSS();
      await runTimingHandler.afterGameScriptsRun_();
      GameHelpers.createCommonPopup_("update-several-qol", (popup, _t) => {
        const $container = popup.$dom_element.find(".container-special-bg");
        $container.append(`<div class="banner">Several QoL - Update to ${currentVersion}</div>`);
        $container.append(html`
          <div class="changelog-content hh-scroll">
            <h2>New SubModule : Season Shard Tracker</h2>
            <p>
              You can now also track drops for season battles, works the same as villain shard tracker.
            </p>
            <h2>New "hidden" module : Laby Locking</h2>
            <p>
              You can now lock a labyrinth difficulty in the entrance, this is to avoid missclicks and make a more streamlined approach.
            </p>
            <h3>Misc</h3>
            <p>
              [VillainShardTracker] Fixed skin drops sometimes counting negative,</br>
              [Better Censor] Added SM which was missing to censor</br>
              [PoP++] When having claimed all PoPs now removes the gift on the tab switcher</br>
              [HH++ BDSM Patch] Villain Fight Selector : Fix girl icon sometimes not showing properly</br>
              [Settings] Stopped some settings appearing multiple times when click multiple times on HH++ settings</br>
            </p>
          </div>
        `);
        const $footer = $(html`
          <div class="footer">
            <span>Thank you for using Several QoL! </span>
            <span style="margin-left:10px" tooltip="Won't be show often only on new features">
              Show this popup:</span
            >
          </div>
        `);
        const $toggleUpdatePopup = $(
          `<input name='severalQoL-show-update-popup' type="checkbox" tooltip="Won't be shown often only on new features" checked>`,
        );
        $toggleUpdatePopup.on("change", () => {
          const show = $toggleUpdatePopup.prop("checked");
          console.log("Setting show update popup to ", show);
          GlobalStorageHandler.setShowUpdatePopup_(show);
        });
        $footer.append($toggleUpdatePopup);
        $container.append($footer);
      });
    } else {
      console.log("No update actions needed");
    }
    // If upgrading from versions older than 2.1.2, migrate any
    // nested `villainShardTracker` payloads from `GirlGlobalStorage`
    // into the dedicated VillainShardTracker storage key.
    try {
      const storedNum = (storedMajor || 0) * 10000 + (storedMinor || 0) * 100 + (storedPatch || 0);
      const threshold = 2 * 10000 + 1 * 100 + 2; // 2.1.2
      if (storedNum < threshold) {
        console.log(
          "Running VillainShardTracker migration from GirlGlobalStorage (version < 2.1.2)",
        );
        await UpdateHandler._migrateVillainTrackerFromGirlGlobalStorage_();
        console.log("VillainShardTracker migration complete");
      }
    } catch (err) {
      console.error("VillainShardTracker migration failed:", err);
    }
    GlobalStorageHandler.setStoredScriptVersion_(currentVersion);
  }

  private static async _migrateVillainTrackerFromGirlGlobalStorage_(): Promise<void> {
    const existingRecords = ShardTrackerStorageHandler.getTrackedGirls_();
    const mergedRecords: TrackedGirlRecords = { ...existingRecords };
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_() as Record<string, any>;
    let hasGlobalTrackerData = false;

    for (const girlId in globalStorage) {
      if (!Object.prototype.hasOwnProperty.call(globalStorage, girlId)) continue;
      const entry = globalStorage[girlId];
      const tracker = entry?.villainShardTracker;
      if (!tracker) continue;

      hasGlobalTrackerData = true;
      const id = Number(girlId) as GirlID;
      const migratedGirl: TrackedGirl = {
        name: entry.name || `Girl ${girlId}`,
        ico: UpdateHandler._buildGirlIcoPath_(id, entry.ico),
        rarity: UpdateHandler._rarityToString_(entry.rarity),
        number_fight: tracker.number_fight ?? 0,
        grade: tracker.grade ?? 0,
        dropped_shards: tracker.dropped_shards ?? 0,
        last_fight_time: tracker.last_fight_time ?? 0,
      } as TrackedGirl;
      if (tracker.last_shards_count !== undefined)
        migratedGirl.last_shards_count = tracker.last_shards_count;
      if (tracker.event_source !== undefined) migratedGirl.event_source = tracker.event_source;
      if (tracker.skins) migratedGirl.skins = tracker.skins.map((skin: any) => ({ ...skin }));

      const existing = mergedRecords[id];
      if (!existing || migratedGirl.last_fight_time >= existing.last_fight_time) {
        mergedRecords[id] = migratedGirl;
      }

      delete entry.villainShardTracker;
    }

    if (hasGlobalTrackerData) {
      GirlGlobalStorageHandler.setGirlGlobalStorage_(globalStorage as any);
      ShardTrackerStorageHandler.setTrackedGirls_(mergedRecords);
      GM_setValue(HH_UNIVERSE + "VillainShardTrackerMigratedFromGirlGlobalStorage", true);
    }
  }

  private static _rarityToString_(rarity: number | undefined): GirlRarity {
    const map: Record<number, GirlRarity> = {
      0: "starting",
      1: "common",
      2: "rare",
      3: "epic",
      4: "legendary",
      5: "mythic",
    };
    return map[rarity ?? 1] ?? "common";
  }

  private static _buildGirlIcoPath_(id_girl: GirlID, iconHash: string | undefined): string {
    if (!iconHash) {
      return `${IMAGES_URL}/pictures/girls/${id_girl}/ava0.png`;
    }

    try {
      const hex = UpdateHandler._base64UrlToHex_(iconHash);
      return `${IMAGES_URL}/pictures/gallery/${id_girl}/ico0/${id_girl}-${hex}.png`;
    } catch (_error) {
      return `${IMAGES_URL}/pictures/girls/${id_girl}/ava0.png`;
    }
  }

  private static _base64UrlToHex_(base64url: string): string {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    let hex = "";
    for (let i = 0; i < binary.length; i++) {
      const hexByte = binary.charCodeAt(i).toString(16);
      hex += hexByte.length === 1 ? "0" + hexByte : hexByte;
    }
    return hex;
  }
  private static async _injectCSS() {
    GM_addStyle(updateHandlerCss);
  }
  private static _addOptionToHHPlusPlusConfig() {
    AddDummyToHHPlusPlus.getInstance_().addDummy_({
      label: `<span tooltip="It will only appear for important update, or new features">Show update Popup</span>`,
      active: GlobalStorageHandler.getShowUpdatePopup_(),
      callback: (newValue) => {
        console.log(`Update popup enabled set to ${newValue}`);
        GlobalStorageHandler.setShowUpdatePopup_(newValue);
      },
    });
  }
}
