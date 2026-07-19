import { AlwaysRunningModule } from "../base";
import runTimingHandler from "../runTimingHandler";
import AjaxCompleteHook from "../SingletonModules/AjaxCompleteHook";
import { CommonAjaxResponse, CompleteGirl } from "../types";
import { HaremPlusPlusAllGirlsCache_Incomplete } from "../types/Harem++";
import { GirlGlobalStorage } from "../types/storage/GirlGlobalStorage";
import { UnsafeWindow_Activities } from "../types/unsafeWindows/activities";
import { UnsafeWindow_pentaDrill } from "../types/unsafeWindows/pentaDrill";
import { UnsafeWindow_seasonal_SEM } from "../types/unsafeWindows/seasonal";
import { GirlGlobalStorageHandler } from "../utils/StorageHandler";
import { SeasonalMarket_AjaxResponse } from "../types/game/ajax/seasonal_market";
import { see_all_penta_drill_girlsResponse } from "../types/game/ajax/penta_drill";
import { UnsafeWindow_Season } from "../types/unsafeWindows/season";
import { UnsafeWindow_Waifu } from "../types/unsafeWindows/waifu";
import { GetGirlsListResponse } from "../types/game/ajax/get_girls_list";
import { love_raids_type, UnsafeWindow_love_raids } from "../types/unsafeWindows/love_raids";

type GirlEntry = GirlGlobalStorage[string];
type GirlSkin = NonNullable<GirlEntry["skins"]>[number];

export default class GirlMonitoring extends AlwaysRunningModule {
  static shouldRun_() {
    return true;
  }

  async run_() {
    if (this._hasRun) return;
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();

    console.log("PlayerGirlMonitoring module running");
    this._hookAjaxRequests();
    await this._migrateHHPlusPlus();
    await this._migrateHaremPlusPlus();

    if (location.pathname === "/activities.html") {
      this._fromActivitiesPage();
    } else if (location.pathname === "/event.html") {
      this._fromEventPage();
    } else if (location.pathname === "/penta-drill.html") {
      this._fromPentaDrillPage();
    } else if (location.pathname === "/seasonal.html") {
      this._fromSeasonalEventPage();
    } else if (location.pathname === "/season.html") {
      this._fromSeasonEventPage();
    } else if (location.pathname === "/waifu.html") {
      this._fromWaifuPage();
    } else if (location.pathname === "/love-raids.html") {
      this._fromLoveRaidsPage();
    }
  }

  // ── Entry merging ────────────────────────────────────────────────────────────

  /**
   * Merges an incoming girl entry into an existing one.
   * Existing non-null values take priority; shards are kept at max.
   */
  mergeEntry_(existing: GirlEntry | undefined, incoming: GirlEntry): GirlEntry {
    if (!existing) return incoming;

    const existingShards = existing.shards;
    const incomingShards = incoming.shards;
    let mergedShards: number | undefined;
    if (existingShards === undefined) {
      mergedShards = incomingShards;
    } else if (incomingShards === undefined) {
      mergedShards = existingShards;
    } else {
      mergedShards = Math.max(existingShards, incomingShards);
    }

    const merged: GirlEntry = {
      name: existing.name || incoming.name,
      rarity: existing.rarity ?? incoming.rarity,
      shards: mergedShards,
    };

    const ico = incoming.ico ?? existing.ico;
    if (ico != null) merged.ico = ico;

    const poseImage = incoming.poseImage ?? existing.poseImage;
    if (poseImage != null) merged.poseImage = poseImage;

    const skins = this._mergeSkins(existing.skins, incoming.skins);
    if (skins != undefined) merged.skins = skins;

    return merged;
  }

  /** Merges all entries from `incoming` into `base`, applying mergeEntry_ per girl. */
  mergeStorage_(base: GirlGlobalStorage, incoming: GirlGlobalStorage): GirlGlobalStorage {
    const result: GirlGlobalStorage = { ...base };
    for (const [id, entry] of Object.entries(incoming)) {
      result[id] = this.mergeEntry_(result[id], entry);
    }
    return result;
  }

  // ── Page handlers ────────────────────────────────────────────────────────────

  private _hookAjaxRequests() {
    if (
      location.pathname === "/harem.html" ||
      location.pathname === "/waifu.html" ||
      location.pathname.startsWith("/characters/")
    ) {
      console.log("Setting up AJAX hooks for girl data on characters/harem pages");
      AjaxCompleteHook.getInstance_().addCallback_((event, xhr, settings) => {
        if (settings?.data?.includes("action=get_girls_list")) {
          const response = xhr.responseJSON as GetGirlsListResponse;
          if (!response.success) return;
          const stored = GirlGlobalStorageHandler.getGirlGlobalStorage_();
          response.girls_list.forEach((girl) => {
            stored[girl.id_girl] = this.mergeEntry_(
              stored[girl.id_girl],
              this._fromCompleteGirl(girl),
            );
          });
          GirlGlobalStorageHandler.setGirlGlobalStorage_(stored);
        }
      });
    }
    AjaxCompleteHook.getInstance_().addCallback_((event, xhr, settings) => {
      if (xhr.responseJSON?.success) {
        const response = xhr.responseJSON as CommonAjaxResponse;
        if (response.rewards?.data) {
          const stored = GirlGlobalStorageHandler.getGirlGlobalStorage_();
          if (response.rewards.data.shards) {
            response.rewards.data.shards.forEach((shard) => {
              stored[shard.id_girl] = this.mergeEntry_(
                stored[shard.id_girl],
                this._createGirlEntryIcoAva(shard, shard.value),
              );
            });
          }
          if (response.rewards.data.girls) {
            response.rewards.data.girls.forEach((girl) => {
              stored[girl.id_girl] = this.mergeEntry_(
                stored[girl.id_girl],
                this._createGirlEntryIcoAva(girl, girl.value),
              );
            });
          }
          if (response.rewards.data.grade_skins) {
            response.rewards.data.grade_skins.forEach((skin) => {
              const girlEntry = stored[skin.id_girl];
              if (!girlEntry) {
                return;
              }
              girlEntry.skins = this._mergeSkins(girlEntry.skins, [
                {
                  skinIco: this._extractIconHash(skin.ico_path),
                  id_girl_grade_skin: skin.id_girl_grade_skin,
                  shards: skin.shards_count,
                  num_order: skin.num_order,
                },
              ]);
            });
          }
          GirlGlobalStorageHandler.setGirlGlobalStorage_(stored);
        }
      }
    });
  }

  private _fromActivitiesPage() {
    const PoPGirls = (unsafeWindow as UnsafeWindow_Activities).pop_hero_girls;
    if (!PoPGirls) return;

    const stored = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    for (const girlData of Object.values(PoPGirls)) {
      const incoming: GirlEntry = {
        name: girlData.name,
        rarity: this._rarityFromString(girlData.rarity),
        shards: 100,
        ico: this._extractIconHash(girlData.images.ico[0]),
        poseImage: this._extractPoseImageHash(girlData.images.ava[0]),
      };
      stored[girlData.id_girl] = this.mergeEntry_(stored[girlData.id_girl], incoming);
    }
    GirlGlobalStorageHandler.setGirlGlobalStorage_(stored);
  }
  private _fromEventPage() {
    const eventGirls = (unsafeWindow.event_girls ??
      unsafeWindow.event_data?.girls ??
      unsafeWindow.current_event?.girls) as CompleteGirl[] | undefined;
    if (!eventGirls) return;
    const stored = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    eventGirls.forEach((girl) => {
      stored[girl.id_girl] = this.mergeEntry_(stored[girl.id_girl], this._fromCompleteGirl(girl));
      console.log("Merged event girl data for", girl.name, stored[girl.id_girl]);
    });
    GirlGlobalStorageHandler.setGirlGlobalStorage_(stored);
  }

  private _fromPentaDrillPage() {
    const drillGirl = (unsafeWindow as UnsafeWindow_pentaDrill).penta_drill_data.girl_data;
    if (!drillGirl) return;
    const stored = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    stored[drillGirl.id_girl] = this.mergeEntry_(
      stored[drillGirl.id_girl],
      this._fromCompleteGirl(drillGirl),
    );
    console.log("Merged penta drill girl data for", drillGirl.name, stored[drillGirl.id_girl]);
    GirlGlobalStorageHandler.setGirlGlobalStorage_(stored);
    AjaxCompleteHook.getInstance_().addCallback_((event, xhr, settings) => {
      if (settings?.data === "action=see_all_penta_drill_girls") {
        const response = xhr.responseJSON as see_all_penta_drill_girlsResponse;
        if (!response.success) return;
        response.penta_drill_girls.forEach((girl) => {
          stored[girl.id_girl] = this.mergeEntry_(
            stored[girl.id_girl],
            this._fromCompleteGirl(girl),
          );
          console.log("Merged penta drill girl data for", girl.name, stored[girl.id_girl]);
        });
      }
    });
  }
  private _fromSeasonalEventPage() {
    const seasonalEventGirls = (unsafeWindow as UnsafeWindow_seasonal_SEM).girls;
    if (!seasonalEventGirls) return;
    const stored = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    try {
      seasonalEventGirls.forEach((girl) => {
        stored[girl.id_girl] = this.mergeEntry_(
          stored[girl.id_girl],
          this._FromScratch(girl.girl.name, girl.girl.rarity, girl.ico, girl.ava, girl.shards ?? 0),
        );
        console.log("Merged seasonal event girl data for", girl.girl.name, stored[girl.id_girl]);
      });
    } catch (error) {
      console.error("Error merging seasonal event", error);
    }
    GirlGlobalStorageHandler.setGirlGlobalStorage_(stored);
    AjaxCompleteHook.getInstance_().addCallback_((event, xhr, settings) => {
      if (settings?.data === "action=event_market_get_data&feature=seasonal_event") {
        if (!xhr.responseJSON.success) return;
        (xhr.responseJSON as SeasonalMarket_AjaxResponse).inventory.forEach((item) => {
          if (item.shards) {
            item.shards.forEach((girlShards) => {
              stored[girlShards.id_girl] = this.mergeEntry_(
                stored[girlShards.id_girl],
                this._createGirlEntryIcoAva(girlShards, girlShards.value),
              );
              console.log(
                "Updated seasonal market girl data for",
                girlShards.name,
                stored[girlShards.id_girl],
              );
            });
          }
        });
      }
    });
  }
  private _fromSeasonEventPage() {
    const seasonGirls = (unsafeWindow as UnsafeWindow_Season).seasons_girls;
    if (!seasonGirls) return;
    const stored = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    seasonGirls.forEach((girl) => {
      stored[girl.id_girl] = this.mergeEntry_(
        stored[girl.id_girl],
        this._createGirlEntryIcoAva(girl),
      );
    });
    GirlGlobalStorageHandler.setGirlGlobalStorage_(stored);
  }
  private _fromWaifuPage() {
    const waifuGirls = (unsafeWindow as UnsafeWindow_Waifu).girls_data_list;
    if (!waifuGirls) return;
    const stored = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    waifuGirls.forEach((girl) => {
      if (girl.id_girl === 344662796) {
        console.log(girl);
      }
      stored[girl.id_girl] = this.mergeEntry_(stored[girl.id_girl], this._fromCompleteGirl(girl));
      if (girl.id_girl === 344662796) {
        console.log(stored);
      }
    });
    GirlGlobalStorageHandler.setGirlGlobalStorage_(stored);
  }

  private _fromLoveRaidsPage() {
    const key = "__GM_LOVE_RAIDS_" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");
    s.textContent = `(function(){Object.defineProperty(window, '${key}', {configurable: true,get() { try { return typeof love_raids === 'undefined' ? null : love_raids; } finally { delete window['${key}'];}}});})();`;
    document.documentElement.appendChild(s);
    s.remove();
    const loveRaids = unsafeWindow[key] as love_raids_type[] | null;
    if (!loveRaids) return;
    const stored = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    loveRaids.forEach((raid) => {
      const girlID = raid.id_girl;
      if ("images" in raid.girl_data && raid.girl_data.images !== undefined) {
        stored[girlID] = this.mergeEntry_(stored[girlID], this._fromCompleteGirl(raid.girl_data));
      } else {
        if (stored[girlID]) {
          stored[girlID].shards = raid.girl_data.shards;
        }
      }
    });
    GirlGlobalStorageHandler.setGirlGlobalStorage_(stored);
  }

  // ── Migrations ───────────────────────────────────────────────────────────────

  private async _migrateHHPlusPlus() {
    const prefix =
      location.ancestorOrigins && location.ancestorOrigins?.length
        ? location.ancestorOrigins[0]
        : location.hostname;
    const migrationKey = prefix + "_PlayerGirlMonitoringHHPlusPLusDataMigrated";

    if (GM_getValue(migrationKey, false)) {
      console.log("HH++ data migration already completed, skipping");
      return;
    }
    if (!unsafeWindow.HHPlusPlus?.Helpers?.getGirlDictionary) return;

    try {
      const girlDictionary = (await unsafeWindow.HHPlusPlus.Helpers.getGirlDictionary()) as Map<
        string,
        any
      >;
      console.log("HH++ girlDictionary:", girlDictionary);

      const incoming: GirlGlobalStorage = {};
      girlDictionary.forEach((data, id) => {
        incoming[id] = this._fromHHPlusPlus(data);
      });

      const merged = this.mergeStorage_(GirlGlobalStorageHandler.getGirlGlobalStorage_(), incoming);
      GirlGlobalStorageHandler.setGirlGlobalStorage_(merged);
      GM_setValue(migrationKey, true);
      console.log(`HH++ migration done: ${Object.keys(incoming).length} girls`);
    } catch (error) {
      console.error("Failed to migrate HH++ data:", error);
    }
  }

  private async _migrateHaremPlusPlus() {
    const prefix =
      location.ancestorOrigins && location.ancestorOrigins?.length
        ? location.ancestorOrigins[0]
        : location.hostname;
    const migrationKey = prefix + "_PlayerGirlMonitoringHaremPlusPlusDataMigrated";

    if (GM_getValue(migrationKey, false)) return;

    try {
      const DATA_CACHE = "harem-cache-0.10.0";
      const HAREM_DATA_REQUEST = "/quickHaremData2.json";

      if (!(await caches.has(DATA_CACHE))) {
        GM_setValue(migrationKey, true);
        return;
      }
      const cache = await caches.open(DATA_CACHE);
      const response = await cache.match(new Request(HAREM_DATA_REQUEST));
      if (!response) {
        GM_setValue(migrationKey, true);
        return;
      }
      const haremData = (await response.json()).allGirls as HaremPlusPlusAllGirlsCache_Incomplete[];
      console.log("Harem++ haremData:", haremData);

      const incoming: GirlGlobalStorage = {};
      haremData.forEach((data: HaremPlusPlusAllGirlsCache_Incomplete) => {
        incoming[data.id] = this._fromHaremPlusPlus(data);
      });

      const merged = this.mergeStorage_(GirlGlobalStorageHandler.getGirlGlobalStorage_(), incoming);
      GirlGlobalStorageHandler.setGirlGlobalStorage_(merged);
      GM_setValue(migrationKey, true);
      console.log(`Harem++ migration done: ${Object.keys(incoming).length} girls`);
    } catch (error) {
      console.error("Failed to migrate Harem++ data:", error);
    }
  }

  // ── Transforms ───────────────────────────────────────────────────────────────

  private _fromHHPlusPlus(girlData: any): GirlEntry {
    const entry: GirlEntry = {
      name: girlData.name,
      rarity: this._rarityFromString(girlData.rarity),
      shards: girlData.shards,
    };
    if (girlData.skins?.length > 0) {
      entry.skins = girlData.skins.map(
        (skin: any): GirlSkin => ({
          skinIco: this._extractIconHash(skin.ico_path),
          id_girl_grade_skin: skin.id_girl_grade_skin,
          shards: skin.shards_count ?? 0,
          num_order: skin.num_order,
        }),
      );
    }
    return entry;
  }

  private _fromHaremPlusPlus(girlData: HaremPlusPlusAllGirlsCache_Incomplete): GirlEntry {
    const entry: GirlEntry = {
      name: girlData.name,
      rarity: girlData.rarity,
      shards: girlData.shards,
    };
    const ico = this._extractIconHash(girlData.icon0);
    if (ico != null) entry.ico = ico;
    const poseImage = this._extractPoseImageHash(girlData.poseImage0);
    if (poseImage != null) entry.poseImage = poseImage;
    if (girlData.gradeSkins?.length > 0) {
      entry.skins = girlData.gradeSkins.map(
        (skin): GirlSkin => ({
          skinIco: this._extractIconHash(skin.ico_path),
          id_girl_grade_skin: skin.id_girl_grade_skin,
          shards: 0,
          num_order: skin.num_order,
          skinPose: this._extractPoseImageHash(skin.image_path),
        }),
      );
    }
    return entry;
  }

  private _fromCompleteGirl<
    T extends {
      name: string;
      rarity: string;
      shards?: number;
      images: { ico: string[]; ava: string[] };
      preview?: {
        grade_skins_data?: Array<{
          ico_path?: string;
          id_girl_grade_skin: number;
          image_path?: string;
          num_order: number;
        }>;
      };
    },
  >(girlData: T, forcedShardsAmount?: number): GirlEntry {
    return this._createGirlEntryIcoAva({
      name: girlData.name,
      rarity: girlData.rarity,
      shards: forcedShardsAmount ?? girlData.shards,
      ico: girlData.images.ico[0],
      avatar: girlData.images.ava[0],
      skins: girlData.preview?.grade_skins_data,
    });
  }

  private _createGirlEntryIcoAva(
    options: {
      name: string;
      rarity: string;
      shards?: number;
      ico: string;
      avatar: string;
      skins?: Array<{
        ico_path?: string;
        id_girl_grade_skin: number;
        image_path?: string;
        num_order: number;
      }>;
    },
    shardsAmount?: number,
  ): GirlEntry {
    const entry: GirlEntry = {
      name: options.name,
      rarity: this._rarityFromString(options.rarity),
      shards: shardsAmount ?? options.shards,
    };
    const ico = this._extractIconHash(options.ico ?? "");
    if (ico != null) entry.ico = ico;
    const poseImage = this._extractPoseImageHash(options.avatar ?? "");
    if (poseImage != null) entry.poseImage = poseImage;
    if ((options.skins?.length ?? 0) > 0) {
      entry.skins = options.skins!.map((skin) => ({
        skinIco: this._extractIconHash(skin.ico_path ?? ""),
        id_girl_grade_skin: skin.id_girl_grade_skin,
        shards: 0,
        num_order: skin.num_order,
        skinPose: this._extractPoseImageHash(skin.image_path ?? ""),
      }));
    }
    return entry;
  }

  private _FromScratch(
    name: string,
    rarity: string,
    ico: string,
    poseImageUrl: string,
    shards?: number,
  ): GirlEntry {
    return this._createGirlEntryIcoAva({
      name,
      rarity,
      shards,
      ico,
      avatar: poseImageUrl,
    });
  }

  // ── Skin merging ─────────────────────────────────────────────────────────────

  private _mergeSkins(
    existing: GirlSkin[] | undefined,
    incoming: GirlSkin[] | undefined,
  ): GirlSkin[] | undefined {
    if (!existing) return incoming;
    if (!incoming) return existing;

    const skinMap = new Map<number, GirlSkin>(existing.map((s) => [s.id_girl_grade_skin, s]));
    for (const newSkin of incoming) {
      const prev = skinMap.get(newSkin.id_girl_grade_skin);
      skinMap.set(
        newSkin.id_girl_grade_skin,
        prev
          ? {
              ...prev,
              skinIco: prev.skinIco ?? newSkin.skinIco,
              skinPose: prev.skinPose ?? newSkin.skinPose,
              shards: Math.max(prev.shards, newSkin.shards),
            }
          : { ...newSkin },
      );
    }
    return Array.from(skinMap.values());
  }

  // ── Utilities ────────────────────────────────────────────────────────────────

  private _rarityFromString(rarity: string): number {
    const map: Record<string, number> = {
      starting: 0,
      common: 1,
      rare: 2,
      epic: 3,
      legendary: 4,
      mythic: 5,
    };
    return map[rarity] ?? 1;
  }

  private _extractPoseImageHash(url: string): string | undefined {
    if (!url) return undefined;
    if (url.includes("/avb0") || url.includes("/grade_skins")) return undefined;
    const match = url.match(/\/pictures\/gallery\/\d+\/[^/]+\/\d+-(.+?)\.png/);
    if (!match) {
      console.warn("Failed to extract pose image hash from URL:", url);
      return undefined;
    }
    return this._hexToBase64Url(match[1]);
  }

  private _extractIconHash(url: string | undefined): string | undefined {
    if (!url) return undefined;
    const match = url.match(/\/pictures\/gallery\/\d+\/[^/]+\/\d+-(.+?)\.png/);
    if (!match) return undefined;
    return this._hexToBase64Url(match[1]);
  }

  // ── Minification / unminification ────────────────────────────────────────────

  /** Converts a stored base64url hash back to a lowercase hex string. */
  unminifyHash_(hash: string): string {
    return this._base64UrlToHex(hash);
  }

  /** Converts a stored ico hash back to a lowercase hex string. */
  unminifyIconHash_(hash: string): string {
    return this._base64UrlToHex(hash);
  }

  /** Converts a stored poseImage hash back to a lowercase hex string. */
  unminifyPoseImageHash_(hash: string): string {
    return this._base64UrlToHex(hash);
  }

  private _hexToBase64Url(hex: string): string {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  private _base64UrlToHex(base64url: string): string {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    let hex = "";
    for (let i = 0; i < binary.length; i++) {
      hex += binary.charCodeAt(i).toString(16).padStart(2, "0");
    }
    return hex;
  }
}
