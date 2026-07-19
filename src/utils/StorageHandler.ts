import type {
  GirlID,
  GirlRarity,
  TrackedGirl,
  TrackedGirlRecords,
  StoredPlayerLeagueRank,
  StoredPlayerSeasonInfo,
  league_player_record,
  StoredPlayerPentaDrillInfo,
  StoredPentaDrillTeam,
  BadgeDataCache,
} from "../types";
import type { GirlGlobalStorage, GirlGlobalStorageEntry } from "../types/storage/GirlGlobalStorage";
import { ReducedLoveRaids } from "../types/storage/love_raids";
import GameHelpers from "./GameHelpers";

type StoredTrackedGirl = Omit<TrackedGirl, "name" | "ico" | "rarity"> &
  Partial<Pick<TrackedGirl, "name" | "ico" | "rarity">>;
type StoredTrackedGirlRecords = Record<GirlID, StoredTrackedGirl>;

export class GlobalStorageHandler {
  static setStoredScriptVersion_(version: string): void {
    GM_setValue("StoredScriptVersion", version);
  }
  static getStoredScriptVersion_(): string {
    return GM_getValue("StoredScriptVersion", "0.0.0");
  }
  static setShowUpdatePopup_(show: boolean): void {
    GM_setValue("ShowUpdatePopup", show);
  }
  static getShowUpdatePopup_(): boolean {
    return GM_getValue("ShowUpdatePopup", true);
  }
  static setBadgeCache_(cache: BadgeDataCache): void {
    GM_setValue("S_QoL_badge_cache", cache);
  }
  static getBadgeCache_(): BadgeDataCache | null {
    return GM_getValue("S_QoL_badge_cache", null);
  }
  static setBetterNsfwCensorEnabled_(enabled: boolean): void {
    GM_setValue("BetterNSFWCensorEnabled", enabled);
  }
  static getBetterNsfwCensorEnabled_(): boolean {
    return GM_getValue("BetterNSFWCensorEnabled", false);
  }
}

export class PlayerStorageHandler {
  static setPlayerLeagueRank_(info: StoredPlayerLeagueRank): void {
    GM_setValue(HH_UNIVERSE + "PlayerLeagueRank", info);
  }
  static getPlayerLeagueRank_(): StoredPlayerLeagueRank {
    return GM_getValue(HH_UNIVERSE + "PlayerLeagueRank", { league: 1, rank: -1 });
  }
  static setPlayerSeasonInfo_(info: StoredPlayerSeasonInfo): void {
    GM_setValue(HH_UNIVERSE + "PlayerSeasonInfo", info);
  }
  static getPlayerSeasonInfo_(): StoredPlayerSeasonInfo | null {
    return GM_getValue(HH_UNIVERSE + "PlayerSeasonInfo", null);
  }
  /**
   * @param bonus percentage bonus for gems gained from prestige
   */
  static setPlayerGemsPrestigeBonus_(bonus: number): void {
    GM_setValue(HH_UNIVERSE + "PlayerGemsPrestigeBonus", bonus);
  }
  /**
   * @returns percentage bonus for gems gained from prestige, 0 if not set
   */
  static getPlayerGemsPrestigeBonus_(): number {
    return GM_getValue(HH_UNIVERSE + "PlayerGemsPrestigeBonus", 0);
  }
  static setPlayerPentaDrillInfo_(info: StoredPlayerPentaDrillInfo): void {
    GM_setValue(HH_UNIVERSE + "PlayerPentaDrillInfo", info);
  }
  static getPlayerPentaDrillInfo_(): StoredPlayerPentaDrillInfo | null {
    return GM_getValue(HH_UNIVERSE + "PlayerPentaDrillInfo", null);
  }
  static setPlayerClubmatesIds_(ids: number[]): void {
    GM_setValue(HH_UNIVERSE + "PlayerClubmatesIds", ids);
  }
  static getPlayerClubmatesIds_(): number[] {
    return GM_getValue(HH_UNIVERSE + "PlayerClubmatesIds", []);
  }
  static setPlayerMissionState_(time_remaining: number | null) {
    GM_setValue(HH_UNIVERSE + "PlayerMissionState", time_remaining);
  }
  static getPlayerMissionState_(): number | null {
    return GM_getValue(HH_UNIVERSE + "PlayerMissionState", null);
  }
  static setPlayerMissionDuration_(duration: number | null) {
    GM_setValue(HH_UNIVERSE + "PlayerMissionDuration", duration);
  }
  static getPlayerMissionDuration_(): number | null {
    return GM_getValue(HH_UNIVERSE + "PlayerMissionDuration", null);
  }
  static setPlayerLabyLockedDifficulty_(difficulty: string | number | null) {
    GM_setValue(HH_UNIVERSE + "PlayerLabyLockedDifficulty", difficulty);
  }
  static getPlayerLabyLockedDifficulty(): string | number | null {
    return GM_getValue(HH_UNIVERSE + "PlayerLabyLockedDifficulty", null);
  }
}

export class LeagueStorageHandler {
  static setLeaguePLayerRecord_(data: league_player_record): void {
    GM_setValue(HH_UNIVERSE + "LeaguePlayerRecord", data);
  }
  static getLeaguePlayerRecord_(): league_player_record {
    return GM_getValue(HH_UNIVERSE + "LeaguePlayerRecord", {});
  }
}

export class EventInfoStorageHandler {
  static setSMShopRefreshTimeComparedToServerTS_(ts: number): void {
    // gives like timeout + server_now_ts
    GM_setValue(HH_UNIVERSE + "SMShopRefreshTime", ts);
  }
  static getSMShopRefreshTimeComparedToServerTS_(): number {
    return GM_getValue(HH_UNIVERSE + "SMShopRefreshTime", 0);
  }
  static setPoVEndTimeComparedToServerTS_(ts: number): void {
    // gives like end_time + server_now_ts
    GM_setValue(HH_UNIVERSE + "PoVEndTime", ts);
  }
  static getPoVEndTimeComparedToServerTS_(): number {
    return GM_getValue(HH_UNIVERSE + "PoVEndTime", 0);
  }
  static setPoGEndTimeComparedToServerTS_(ts: number): void {
    // gives like end_time + server_now_ts
    GM_setValue(HH_UNIVERSE + "PoGEndTime", ts);
  }
  static getPoGEndTimeComparedToServerTS_(): number {
    return GM_getValue(HH_UNIVERSE + "PoGEndTime", 0);
  }
}

export class LabyTeamStorageHandler {
  static setTeamPreset_(data: Record<number, string>): void {
    GM_setValue(HH_UNIVERSE + "LabyTeamPreset", data);
  }
  static getTeamPreset_(): Record<number, string> | undefined {
    return GM_getValue(HH_UNIVERSE + "LabyTeamPreset", undefined);
  }
}
export class WBTTeamStorageHandler {
  static setTeamPreset_(data: Record<number, string>): void {
    GM_setValue(HH_UNIVERSE + "WBTTeamPreset", data);
  }
  static getTeamPreset_(): Record<number, string> | undefined {
    return GM_getValue(HH_UNIVERSE + "WBTTeamPreset", undefined);
  }
  static setWBTId_(id: number): void {
    GM_setValue(HH_UNIVERSE + "WBTId", id);
  }
  static getWBTId_(): number {
    return GM_getValue(HH_UNIVERSE + "WBTId", -1);
  }
}

export class PentaDrillTeamStorageHandler {
  static addPentaDrillTeam_(team: StoredPentaDrillTeam): void {
    const existingTeams = this.getPentaDrillTeams_();
    existingTeams.push(team);
    GM_setValue(HH_UNIVERSE + "PentaDrillTeams", existingTeams);
  }
  static getPentaDrillTeams_(): Array<StoredPentaDrillTeam> {
    return GM_getValue(HH_UNIVERSE + "PentaDrillTeams", []);
  }
  static deletePentaDrillTeam_(index: number): void {
    const existingTeams = this.getPentaDrillTeams_();
    if (index >= 0 && index < existingTeams.length) {
      existingTeams.splice(index, 1);
      GM_setValue(HH_UNIVERSE + "PentaDrillTeams", existingTeams);
    }
  }
}

export class LoveRaidsStorageHandler {
  static setReducedLoveRaids_(data: ReducedLoveRaids): void {
    GM_setValue(HH_UNIVERSE + "ReducedLoveRaids", data);
  }
  static getReducedLoveRaids_(): ReducedLoveRaids {
    return GM_getValue(HH_UNIVERSE + "ReducedLoveRaids", []);
  }
  static setLoveRaidNotifications_(raidNotifs: Array<number>): void {
    GM_setValue(HH_UNIVERSE + "LoveRaidNotifications", raidNotifs);
  }
  static getLoveRaidNotifications_(): Array<number> {
    return GM_getValue(HH_UNIVERSE + "LoveRaidNotifications", []);
  }
  static setShouldHideCompletedRaids_(shouldHide: boolean) {
    GM_setValue("HideCompletedLoveRaids", shouldHide);
  }
  static getShouldHideCompletedRaids_(): boolean {
    return GM_getValue("HideCompletedLoveRaids", true);
  }
  static setHideHiddenRaids_(shouldHide: boolean) {
    GM_setValue(HH_UNIVERSE + "HideHiddenLoveRaids", shouldHide);
  }
  static getHideHiddenRaids_(): boolean {
    return GM_getValue(HH_UNIVERSE + "HideHiddenLoveRaids", false);
  }
}

export class sessionStorageHandler {
  static setSessID_(sessID: string): void {
    GM_setValue(location.hostname + "SessID", sessID);
  }
  static getSessID_(): string {
    return GM_getValue(location.hostname + "SessID", "");
  }
  static clearSessID_(): void {
    GM_deleteValue(location.hostname + "SessID");
  }
}

// XXX: it'll be more like a villain tracker if we start tracking boosters or
//   other bonus stuff too
export class ShardTrackerStorageHandler {
  private static _currentStoredRecords: TrackedGirlRecords | null = null;

  private static _trackedGirlsStorageKey_(): string {
    return HH_UNIVERSE + "VillainShardTrackerTrackedGirls";
  }

  private static _trackingStateKey_(): string {
    return HH_UNIVERSE + "VillainShardTrackerTrackingState";
  }

  static setCurrentTrackingState_(trollID: number, girlIds: GirlID[] = []): void {
    // XXX: we forgot to rename the key
    GM_setValue(this._trackingStateKey_(), {
      trollID,
      girlIds,
    });
  }

  static getCurrentTrackingState_(): { trollID: number; girlIds: GirlID[] } {
    return GM_getValue(this._trackingStateKey_(), {
      trollID: -1,
      girlIds: [],
    }) as { trollID: number; girlIds: GirlID[] };
  }

  static getTrackedGirls_(): TrackedGirlRecords {
    if (this._currentStoredRecords === null) {
      const rawRecords = GM_getValue(
        this._trackedGirlsStorageKey_(),
        {},
      ) as StoredTrackedGirlRecords;
      this._currentStoredRecords = this._hydrateTrackedGirls_(rawRecords);

      // Opportunistically compact old duplicated records when metadata exists in global storage.
      if (this._hasMetadataDuplication_(rawRecords)) {
        GM_setValue(
          this._trackedGirlsStorageKey_(),
          this._compactTrackedGirls_(this._currentStoredRecords),
        );
      }
    }
    return this._currentStoredRecords!;
  }

  static setTrackedGirls_(records: TrackedGirlRecords): void {
    this._currentStoredRecords = records;
    GM_setValue(
      this._trackedGirlsStorageKey_(),
      this._compactTrackedGirls_(this._currentStoredRecords),
    );
  }

  static getTrackedGirl_(id_girl: GirlID): TrackedGirl | undefined {
    const records = this.getTrackedGirls_();
    return records[id_girl];
  }

  static upsertTrackedGirl_(id_girl: GirlID, record: TrackedGirl): void {
    const records = this.getTrackedGirls_();
    this.setTrackedGirls_({ ...records, [id_girl]: record });
  }

  static removeTrackedGirl_(id_girl: GirlID): void {
    const records = this.getTrackedGirls_();
    if (records[id_girl]) {
      const { [id_girl]: _removed, ...rest } = records;
      this.setTrackedGirls_(rest);
    }
  }

  private static _hydrateTrackedGirls_(records: StoredTrackedGirlRecords): TrackedGirlRecords {
    const hydrated: TrackedGirlRecords = {};
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_() as Record<
      string,
      GirlGlobalStorageEntry | undefined
    >;

    for (const girlId in records) {
      if (!Object.prototype.hasOwnProperty.call(records, girlId)) continue;

      const id = Number(girlId) as GirlID;
      const stored = records[id];
      const globalEntry = globalStorage[girlId];
      const hydratedGirl: TrackedGirl = {
        number_fight: stored.number_fight ?? 0,
        grade: stored.grade ?? 0,
        dropped_shards: stored.dropped_shards ?? 0,
        last_fight_time: stored.last_fight_time ?? 0,
        name: stored.name ?? globalEntry?.name ?? `Girl ${girlId}`,
        ico: stored.ico ?? this._buildGirlIcoPath_(id, globalEntry?.ico),
        rarity: stored.rarity ?? this._rarityToString_(globalEntry?.rarity),
      };

      if (stored.last_shards_count !== undefined)
        hydratedGirl.last_shards_count = stored.last_shards_count;
      if (stored.event_source !== undefined) hydratedGirl.event_source = stored.event_source;
      if (stored.skins) hydratedGirl.skins = stored.skins.map((skin) => ({ ...skin }));

      hydrated[id] = hydratedGirl;
    }

    return hydrated;
  }

  private static _compactTrackedGirls_(records: TrackedGirlRecords): StoredTrackedGirlRecords {
    const compacted: StoredTrackedGirlRecords = {};
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_() as Record<
      string,
      GirlGlobalStorageEntry | undefined
    >;

    for (const girlId in records) {
      if (!Object.prototype.hasOwnProperty.call(records, girlId)) continue;

      const id = Number(girlId) as GirlID;
      const tracked = records[id];
      const globalEntry = globalStorage[girlId];
      const compactedGirl: StoredTrackedGirl = {
        number_fight: tracked.number_fight,
        grade: tracked.grade,
        dropped_shards: tracked.dropped_shards,
        last_fight_time: tracked.last_fight_time,
      };
      if (tracked.last_shards_count !== undefined)
        compactedGirl.last_shards_count = tracked.last_shards_count;
      if (tracked.event_source !== undefined) compactedGirl.event_source = tracked.event_source;
      if (tracked.skins) compactedGirl.skins = tracked.skins.map((skin) => ({ ...skin }));

      // Keep fallback metadata only when global storage does not provide it yet.
      if (!globalEntry?.name) compactedGirl.name = tracked.name;
      if (!globalEntry?.ico) compactedGirl.ico = tracked.ico;
      if (globalEntry?.rarity === undefined) compactedGirl.rarity = tracked.rarity;

      compacted[id] = compactedGirl;
    }

    return compacted;
  }

  private static _hasMetadataDuplication_(records: StoredTrackedGirlRecords): boolean {
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_() as Record<
      string,
      GirlGlobalStorageEntry | undefined
    >;

    for (const girlId in records) {
      if (!Object.prototype.hasOwnProperty.call(records, girlId)) continue;

      const stored = records[Number(girlId) as GirlID];
      const globalEntry = globalStorage[girlId];
      if (!globalEntry) continue;

      if (stored.name !== undefined || stored.ico !== undefined || stored.rarity !== undefined) {
        return true;
      }
    }

    return false;
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
    return GameHelpers.buildGirlIconPathFromHash_(id_girl, iconHash);
  }
}

export class SeasonShardTrackerStorageHandler {
  private static _currentStoredRecords: TrackedGirlRecords | null = null;

  private static _trackedGirlsStorageKey_(): string {
    return HH_UNIVERSE + "SeasonShardTrackerTrackedGirls";
  }

  private static _trackingStateKey_(): string {
    return HH_UNIVERSE + "SeasonShardTrackerTrackingState";
  }

  static setCurrentTrackingState_(girlIds: GirlID[] = []): void {
    GM_setValue(this._trackingStateKey_(), {
      girlIds,
    });
  }

  static getCurrentTrackingState_(): { girlIds: GirlID[] } {
    return GM_getValue(this._trackingStateKey_(), {
      girlIds: [],
    }) as { girlIds: GirlID[] };
  }

  static getTrackedGirls_(): TrackedGirlRecords {
    if (this._currentStoredRecords === null) {
      const rawRecords = GM_getValue(
        this._trackedGirlsStorageKey_(),
        {},
      ) as StoredTrackedGirlRecords;
      this._currentStoredRecords = this._hydrateTrackedGirls_(rawRecords);

      if (this._hasMetadataDuplication_(rawRecords)) {
        GM_setValue(
          this._trackedGirlsStorageKey_(),
          this._compactTrackedGirls_(this._currentStoredRecords),
        );
      }
    }
    return this._currentStoredRecords!;
  }

  static setTrackedGirls_(records: TrackedGirlRecords): void {
    this._currentStoredRecords = records;
    GM_setValue(
      this._trackedGirlsStorageKey_(),
      this._compactTrackedGirls_(this._currentStoredRecords),
    );
  }

  static getTrackedGirl_(id_girl: GirlID): TrackedGirl | undefined {
    const records = this.getTrackedGirls_();
    return records[id_girl];
  }

  static upsertTrackedGirl_(id_girl: GirlID, record: TrackedGirl): void {
    const records = this.getTrackedGirls_();
    this.setTrackedGirls_({ ...records, [id_girl]: record });
  }

  static removeTrackedGirl_(id_girl: GirlID): void {
    const records = this.getTrackedGirls_();
    if (records[id_girl]) {
      const { [id_girl]: _removed, ...rest } = records;
      this.setTrackedGirls_(rest);
    }
  }

  private static _hydrateTrackedGirls_(records: StoredTrackedGirlRecords): TrackedGirlRecords {
    const hydrated: TrackedGirlRecords = {};
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_() as Record<
      string,
      GirlGlobalStorageEntry | undefined
    >;

    for (const girlId in records) {
      if (!Object.prototype.hasOwnProperty.call(records, girlId)) continue;

      const id = Number(girlId) as GirlID;
      const stored = records[id];
      const globalEntry = globalStorage[girlId];
      const hydratedGirl: TrackedGirl = {
        number_fight: stored.number_fight ?? 0,
        grade: stored.grade ?? 0,
        dropped_shards: stored.dropped_shards ?? 0,
        last_fight_time: stored.last_fight_time ?? 0,
        name: stored.name ?? globalEntry?.name ?? `Girl ${girlId}`,
        ico: stored.ico ?? this._buildGirlIcoPath_(id, globalEntry?.ico),
        rarity: stored.rarity ?? this._rarityToString_(globalEntry?.rarity),
      };

      if (stored.last_shards_count !== undefined)
        hydratedGirl.last_shards_count = stored.last_shards_count;
      if (stored.event_source !== undefined) hydratedGirl.event_source = stored.event_source;
      if (stored.skins) hydratedGirl.skins = stored.skins.map((skin) => ({ ...skin }));

      hydrated[id] = hydratedGirl;
    }

    return hydrated;
  }

  private static _compactTrackedGirls_(records: TrackedGirlRecords): StoredTrackedGirlRecords {
    const compacted: StoredTrackedGirlRecords = {};
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_() as Record<
      string,
      GirlGlobalStorageEntry | undefined
    >;

    for (const girlId in records) {
      if (!Object.prototype.hasOwnProperty.call(records, girlId)) continue;

      const id = Number(girlId) as GirlID;
      const tracked = records[id];
      const globalEntry = globalStorage[girlId];
      const compactedGirl: StoredTrackedGirl = {
        number_fight: tracked.number_fight,
        grade: tracked.grade,
        dropped_shards: tracked.dropped_shards,
        last_fight_time: tracked.last_fight_time,
      };

      if (tracked.last_shards_count !== undefined)
        compactedGirl.last_shards_count = tracked.last_shards_count;
      if (tracked.event_source !== undefined) compactedGirl.event_source = tracked.event_source;
      if (tracked.skins) compactedGirl.skins = tracked.skins.map((skin) => ({ ...skin }));

      if (!globalEntry?.name) compactedGirl.name = tracked.name;
      if (!globalEntry?.ico) compactedGirl.ico = tracked.ico;
      if (globalEntry?.rarity === undefined) compactedGirl.rarity = tracked.rarity;

      compacted[id] = compactedGirl;
    }

    return compacted;
  }

  private static _hasMetadataDuplication_(records: StoredTrackedGirlRecords): boolean {
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_() as Record<
      string,
      GirlGlobalStorageEntry | undefined
    >;

    for (const girlId in records) {
      if (!Object.prototype.hasOwnProperty.call(records, girlId)) continue;

      const stored = records[Number(girlId) as GirlID];
      const globalEntry = globalStorage[girlId];
      if (!globalEntry) continue;

      if (stored.name !== undefined || stored.ico !== undefined || stored.rarity !== undefined) {
        return true;
      }
    }

    return false;
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
    return GameHelpers.buildGirlIconPathFromHash_(id_girl, iconHash);
  }
}

export class GirlGlobalStorageHandler {
  static setGirlGlobalStorage_(data: GirlGlobalStorage): void {
    GM_setValue(HH_UNIVERSE + "GirlGlobalStorage", data);
  }

  static getGirlGlobalStorage_(): GirlGlobalStorage {
    return GM_getValue(HH_UNIVERSE + "GirlGlobalStorage", {});
  }
}
