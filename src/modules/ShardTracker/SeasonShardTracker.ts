import { SubModule } from "../../base";
import type {
  AjaxShardGirlUpdate,
  DoBattlesTrollsResponse,
  GirlID,
  GirlRarity,
  GradeSkins,
  Shard,
  TrackedGirl,
} from "../../types";
import type { GirlGlobalStorage } from "../../types/storage/GirlGlobalStorage";
import type { UnsafeWindow_Season } from "../../types/unsafeWindows/season";
import {
  GirlGlobalStorageHandler,
  SeasonShardTrackerStorageHandler,
} from "../../utils/StorageHandler";
import GameHelpers from "../../utils/GameHelpers";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";
import { villainShardTrackerCss } from "../../css/modules";
import html from "../../utils/html";
import AjaxCompleteHook from "../../SingletonModules/AjaxCompleteHook";
import runTimingHandler from "../../runTimingHandler";

type GirlDictionaryPatch = {
  name?: string;
  rarity?: GirlRarity;
  ico?: string;
  poseImage?: string;
  shards?: number;
};

type SeasonShardLike = {
  id_girl: GirlID;
  rarity: GirlRarity;
  name?: string;
  ico?: string;
  avatar?: string;
  graded2?: string;
  is_girl_owned?: boolean;
  value?: number;
  previous_value?: number;
  grade_skins?: Array<{
    ico_path: string;
    is_owned: boolean;
  }>;
};

type SeasonOpponent = {
  player?: {
    id_fighter?: number;
  };
  rewards?: {
    shards?: Array<Shard>;
    grade_skins?: GradeSkins;
    data?: {
      shards?: Array<any>;
    };
  };
};

export default class SeasonShardTracker implements SubModule {
  private static readonly TRACKED_BATTLE_ACTION = "do_battles_seasons";

  private _shouldTrackShards = false;
  private readonly _trackedRarities: Array<GirlRarity> = ["mythic", "legendary"];

  static shouldRun_() {
    return (
      location.pathname.includes("/season-arena.html") ||
      location.pathname.includes("/season-battle.html")
    );
  }

  private async _injectCSS() {
    GM_addStyle(villainShardTrackerCss);
  }

  async run_() {
    if (!SeasonShardTracker.shouldRun_()) {
      return;
    }
    await runTimingHandler.afterGameScriptsRun_();

    if (location.pathname === "/season-arena.html") {
      this._injectCSS();
      this._makeLogPopup();
      this._handleArenaPage();
    } else {
      this._handleBattlePage();
    }

    if (!this._shouldTrackShards) {
      return;
    }

    if (!SeasonShardTrackerStorageHandler.getCurrentTrackingState_().girlIds.length) {
      return;
    }

    console.log("SeasonShardTracker module is running.");
    this._hookSeasonAjaxComplete();
  }

  private _hookSeasonAjaxComplete() {
    AjaxCompleteHook.getInstance_().addCallback_((_event, xhr, settings) => {
      if (!this._shouldTrackShards || typeof settings?.data !== "string") {
        return;
      }

      const action = this._extractRequestAction_(settings.data);
      if (action !== SeasonShardTracker.TRACKED_BATTLE_ACTION) {
        return;
      }

      const response = xhr.responseJSON as DoBattlesTrollsResponse;
      this._processBattleResponse_(response, settings.data);
    });
  }

  private _extractRequestAction_(requestData: string): string | undefined {
    const actionMatch = requestData.match(/(?:^|&)action=([^&]+)/);
    return actionMatch?.[1];
  }

  private _extractNumberOfBattles_(requestData: string): number {
    const battlesMatch = requestData.match(/number_of_battles=(\d+)/);
    return battlesMatch ? parseInt(battlesMatch[1], 10) : 1;
  }

  private _groupDroppedSkinsByGirlId_(skins: GradeSkins): Map<GirlID, GradeSkins> {
    const skinsByGirlId = new Map<GirlID, GradeSkins>();
    skins.forEach((skin) => {
      const trackedSkins = skinsByGirlId.get(skin.id_girl);
      if (trackedSkins) {
        trackedSkins.push(skin);
      } else {
        skinsByGirlId.set(skin.id_girl, [skin]);
      }
    });
    return skinsByGirlId;
  }

  private _normalizeSeasonSkinList_(rawSkins: unknown):
    | Array<{
        ico_path: string;
        is_owned: boolean;
      }>
    | undefined {
    if (!Array.isArray(rawSkins) || !rawSkins.length) {
      return undefined;
    }

    const normalized = rawSkins
      .map((skin) => {
        if (!skin || typeof skin !== "object") {
          return undefined;
        }
        const maybeSkin = skin as { ico_path?: unknown; is_owned?: unknown };
        if (typeof maybeSkin.ico_path !== "string" || !maybeSkin.ico_path) {
          return undefined;
        }
        return {
          ico_path: maybeSkin.ico_path,
          is_owned: Boolean(maybeSkin.is_owned),
        };
      })
      .filter((skin): skin is { ico_path: string; is_owned: boolean } => skin !== undefined);

    return normalized.length ? normalized : undefined;
  }

  private _mergeSeasonSkinLists_(
    previousSkins:
      | Array<{
          ico_path: string;
          is_owned: boolean;
        }>
      | undefined,
    incomingSkins:
      | Array<{
          ico_path: string;
          is_owned: boolean;
        }>
      | undefined,
  ):
    | Array<{
        ico_path: string;
        is_owned: boolean;
      }>
    | undefined {
    if (!previousSkins?.length) {
      return incomingSkins?.length ? [...incomingSkins] : undefined;
    }
    if (!incomingSkins?.length) {
      return [...previousSkins];
    }

    const merged = [...previousSkins.map((skin) => ({ ...skin }))];
    incomingSkins.forEach((incomingSkin) => {
      const trackedSkin = merged.find((skin) => skin.ico_path === incomingSkin.ico_path);
      if (trackedSkin) {
        trackedSkin.is_owned = trackedSkin.is_owned || incomingSkin.is_owned;
      } else {
        merged.push({ ...incomingSkin });
      }
    });
    return merged;
  }

  private _toNumberOrUndefined_(value: unknown): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private _normalizeAjaxShardDrop_(rawShard: any): AjaxShardGirlUpdate | undefined {
    const id_girl = this._toNumberOrUndefined_(rawShard?.id_girl);
    const value = this._toNumberOrUndefined_(rawShard?.value);
    const previous_value = this._toNumberOrUndefined_(rawShard?.previous_value);
    const rarity = rawShard?.rarity as GirlRarity | undefined;

    if (
      id_girl === undefined ||
      value === undefined ||
      previous_value === undefined ||
      !rarity ||
      !this._trackedRarities.includes(rarity)
    ) {
      return undefined;
    }

    return {
      ...rawShard,
      id_girl: id_girl as GirlID,
      value,
      previous_value,
      rarity,
    } as AjaxShardGirlUpdate;
  }

  private _processBattleResponse_(
    response: DoBattlesTrollsResponse | undefined,
    requestData: string,
  ): void {
    if (!response?.rewards?.data) {
      return;
    }

    const numberOfBattles = this._extractNumberOfBattles_(requestData);
    const rewards = response.rewards.data;

    const successfulBattles =
      numberOfBattles -
      (rewards.rewards?.find((reward) => reward.type === "battle_lost")?.value ?? 0);
    if (successfulBattles <= 0) {
      return;
    }

    const shardDrops = (rewards.shards ?? [])
      .map((rawShard) => this._normalizeAjaxShardDrop_(rawShard))
      .filter((shard): shard is AjaxShardGirlUpdate => shard !== undefined);
    const dropsByGirlId = new Map<GirlID, AjaxShardGirlUpdate>(
      shardDrops.map((shard) => [shard.id_girl, shard]),
    );
    const skinsByGirlId = this._groupDroppedSkinsByGirlId_(rewards.grade_skins ?? []);
    const obtainedGirlIds = new Set<GirlID>((rewards.girls ?? []).map((girl) => girl.id_girl));

    const currentTrackingState = SeasonShardTrackerStorageHandler.getCurrentTrackingState_();
    if (!currentTrackingState.girlIds.length) {
      this._shouldTrackShards = false;
      return;
    }

    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    let dictionaryChanged = this._mergeRewardsIntoGirlDictionary_(globalStorage, shardDrops);
    dictionaryChanged =
      this._mergeRewardsIntoGirlDictionary_(globalStorage, rewards.girls ?? []) ||
      dictionaryChanged;

    const completedGirlIds: GirlID[] = [];
    currentTrackingState.girlIds.forEach((girlID) => {
      const trackedGirl = SeasonShardTrackerStorageHandler.getTrackedGirl_(girlID);
      if (!trackedGirl) {
        return;
      }

      this._fillTrackedGirlFromDictionary_(girlID, trackedGirl, globalStorage);
      trackedGirl.last_fight_time = Date.now();

      this._applyDropUpdate_(
        trackedGirl,
        successfulBattles,
        dropsByGirlId.get(girlID),
        skinsByGirlId.get(girlID) ?? [],
        obtainedGirlIds.has(girlID),
      );
      SeasonShardTrackerStorageHandler.upsertTrackedGirl_(girlID, trackedGirl);

      dictionaryChanged =
        this._upsertGirlDictionaryEntry_(globalStorage, girlID, {
          name: trackedGirl.name,
          rarity: trackedGirl.rarity,
          ico: trackedGirl.ico,
          shards: trackedGirl.last_shards_count,
        }) || dictionaryChanged;

      if (this._isTrackingCompleted_(trackedGirl)) {
        completedGirlIds.push(girlID);
      }
    });

    if (dictionaryChanged) {
      GirlGlobalStorageHandler.setGirlGlobalStorage_(globalStorage);
    }

    if (completedGirlIds.length) {
      this._removeCompletedGirlsFromTracking_(completedGirlIds);
    }
  }

  private _removeCompletedGirlsFromTracking_(completedGirlIds: GirlID[]) {
    const currentTrackingState = SeasonShardTrackerStorageHandler.getCurrentTrackingState_();
    const newTrackedGirlIds = currentTrackingState.girlIds.filter(
      (id) => !completedGirlIds.includes(id),
    );

    if (newTrackedGirlIds.length === 0) {
      this._shouldTrackShards = false;
      SeasonShardTrackerStorageHandler.setCurrentTrackingState_([]);
      return;
    }

    SeasonShardTrackerStorageHandler.setCurrentTrackingState_(newTrackedGirlIds);
  }

  private _applyDropUpdate_(
    trackedGirl: TrackedGirl,
    successfulBattles: number,
    dropInfo: AjaxShardGirlUpdate | undefined,
    skinsDropped: GradeSkins,
    girlWasObtained: boolean,
  ): void {
    if (!dropInfo) {
      this._addFightsToTrackedGirl_(trackedGirl, successfulBattles);
      return;
    }

    if (dropInfo.previous_value > 100) {
      alert(
        "SeasonShardTracker: encountered unusable shard payload, this fight was skipped in tracking.\nIF YOU WANT TO REPORT SEND A SCREENSHOT OF THE DROP",
      );
      console.warn("SeasonShardTracker unusable shard drop info:", dropInfo);
      return;
    }

    if (dropInfo.value !== 100) {
      this._applyGirlShardDrop_(trackedGirl, dropInfo, successfulBattles);
      return;
    }

    if (girlWasObtained) {
      this._applyGirlAndSkinDrop_(trackedGirl, dropInfo, successfulBattles, skinsDropped);
      return;
    }

    if (skinsDropped.length) {
      this._applySkinOnlyDrop_(trackedGirl, dropInfo, successfulBattles, skinsDropped);
      return;
    }

    if (trackedGirl.skins?.length) {
      this._applySimpleSkinDrop_(trackedGirl, dropInfo, successfulBattles);
      return;
    }

    this._addFightsToTrackedGirl_(trackedGirl, successfulBattles);
  }

  private _addFightsToTrackedGirl_(trackedGirl: TrackedGirl, nbFights: number): void {
    if (nbFights <= 0) {
      return;
    }

    if (trackedGirl.last_shards_count === 100) {
      const firstUnownedSkin = trackedGirl.skins?.find((skin) => !skin.is_owned);
      if (firstUnownedSkin) {
        firstUnownedSkin.number_fight += nbFights;
        return;
      }
    }

    trackedGirl.number_fight += nbFights;
  }

  private _applyGirlShardDrop_(
    trackedGirl: TrackedGirl,
    dropInfo: AjaxShardGirlUpdate,
    successfulBattles: number,
  ): void {
    trackedGirl.last_shards_count = Math.min(dropInfo.value, 100);
    trackedGirl.number_fight += Math.max(successfulBattles, 0);
    trackedGirl.dropped_shards += Math.max(dropInfo.value - dropInfo.previous_value, 0);
  }

  private _applySimpleSkinDrop_(
    trackedGirl: TrackedGirl,
    dropInfo: AjaxShardGirlUpdate,
    numberOfBattles: number,
  ): void {
    const currentTrackedSkin = trackedGirl.skins?.find((skin) => !skin.is_owned);
    if (!currentTrackedSkin) {
      this._addFightsToTrackedGirl_(trackedGirl, numberOfBattles);
      return;
    }

    currentTrackedSkin.number_fight += numberOfBattles;
    currentTrackedSkin.dropped_shards += Math.max(dropInfo.value - dropInfo.previous_value, 0);
  }

  private _applyGirlAndSkinDrop_(
    trackedGirl: TrackedGirl,
    dropInfo: AjaxShardGirlUpdate,
    numberOfBattles: number,
    skinsDropped: GradeSkins,
  ): void {
    const lastShardCount = this._getGirlLastShardCount_(trackedGirl, dropInfo);
    const totalShards =
      Math.max(dropInfo.value - dropInfo.previous_value, 0) +
      this._sumDroppedSkinShards_(skinsDropped);
    const gainedGirlShards =
      numberOfBattles === 1
        ? totalShards
        : Math.min(Math.max(100 - lastShardCount, 0), totalShards);
    const skinShardsPool = Math.max(totalShards - gainedGirlShards, 0);

    trackedGirl.dropped_shards += gainedGirlShards;
    trackedGirl.last_shards_count = 100;

    const fightsGirl =
      numberOfBattles === 1
        ? 1
        : totalShards === 0
          ? 0
          : Math.round((numberOfBattles * gainedGirlShards) / totalShards);
    trackedGirl.number_fight += fightsGirl;

    this._applySkinDrops_(trackedGirl, numberOfBattles, skinsDropped, skinShardsPool);
  }

  private _applySkinOnlyDrop_(
    trackedGirl: TrackedGirl,
    dropInfo: AjaxShardGirlUpdate,
    numberOfBattles: number,
    skinsDropped: GradeSkins,
  ): void {
    const totalSkinShards =
      Math.max(dropInfo.value - dropInfo.previous_value, 0) +
      this._sumDroppedSkinShards_(skinsDropped);
    this._applySkinDrops_(trackedGirl, numberOfBattles, skinsDropped, totalSkinShards);
  }

  private _sumDroppedSkinShards_(skinsDropped: GradeSkins): number {
    return skinsDropped.reduce((sum, skin) => {
      return sum + Math.max(skin.shards_added, 0);
    }, 0);
  }

  private _applySkinDrops_(
    trackedGirl: TrackedGirl,
    numberOfBattles: number,
    skinsDropped: GradeSkins,
    totalSkinShards: number,
  ): void {
    if (totalSkinShards <= 0) {
      return;
    }

    if (!trackedGirl.skins) {
      trackedGirl.skins = [];
    }

    const totalSkinShardsDropped = totalSkinShards;
    let skinShardsPool = totalSkinShards;

    skinsDropped.forEach((skinDrop) => {
      const droppedShardsForThisSkin = Math.max(skinDrop.shards_added, 0);
      if (droppedShardsForThisSkin === 0) {
        return;
      }

      const nbFightsForThisSkin =
        totalSkinShardsDropped === 0
          ? 0
          : Math.round(numberOfBattles * (droppedShardsForThisSkin / totalSkinShardsDropped));
      skinShardsPool -= droppedShardsForThisSkin;

      const currentTrackedSkin = trackedGirl.skins!.find(
        (skin) => skin.ico_path === skinDrop.ico_path,
      );
      if (!currentTrackedSkin) {
        trackedGirl.skins!.push({
          ico_path: skinDrop.ico_path,
          number_fight: nbFightsForThisSkin,
          is_owned: skinDrop.is_owned,
          dropped_shards: droppedShardsForThisSkin,
        });
        return;
      }

      currentTrackedSkin.number_fight += nbFightsForThisSkin;
      currentTrackedSkin.dropped_shards += droppedShardsForThisSkin;
      currentTrackedSkin.is_owned = skinDrop.is_owned;
    });

    if (skinShardsPool <= 0) {
      return;
    }

    const currentTrackedSkin = trackedGirl.skins.find((skin) => !skin.is_owned);
    if (!currentTrackedSkin) {
      return;
    }

    const remainingShardsCapacity = Math.max(33 - (currentTrackedSkin.dropped_shards ?? 0), 0);
    const shardsToAdd = Math.min(remainingShardsCapacity, skinShardsPool);
    if (shardsToAdd <= 0) {
      return;
    }

    currentTrackedSkin.dropped_shards += shardsToAdd;
    const fightsToAdd =
      totalSkinShardsDropped === 0
        ? 0
        : Math.round(numberOfBattles * (shardsToAdd / totalSkinShardsDropped));
    currentTrackedSkin.number_fight += fightsToAdd;
  }

  private _getGirlLastShardCount_(trackedGirl: TrackedGirl, dropInfo: AjaxShardGirlUpdate): number {
    if (
      trackedGirl.last_shards_count !== undefined &&
      trackedGirl.last_shards_count >= dropInfo.previous_value
    ) {
      return trackedGirl.last_shards_count;
    }
    return dropInfo.previous_value;
  }

  private _isTrackingCompleted_(trackedGirl: TrackedGirl): boolean {
    return (
      trackedGirl.last_shards_count === 100 &&
      (!trackedGirl.skins || trackedGirl.skins.every((skin) => skin.is_owned))
    );
  }

  private _mergeRewardsIntoGirlDictionary_(
    globalStorage: GirlGlobalStorage,
    rewards: AjaxShardGirlUpdate[],
  ): boolean {
    let hasChanges = false;
    rewards.forEach((reward) => {
      hasChanges =
        this._upsertGirlDictionaryEntry_(globalStorage, reward.id_girl, {
          name: reward.name,
          rarity: reward.rarity,
          ico: reward.ico,
          poseImage: reward.avatar,
          shards: reward.value,
        }) || hasChanges;
    });
    return hasChanges;
  }

  private _fillTrackedGirlFromDictionary_(
    id_girl: GirlID,
    trackedGirl: TrackedGirl,
    globalStorage: GirlGlobalStorage,
  ): void {
    const globalGirl = globalStorage[id_girl];
    if (!globalGirl) {
      return;
    }

    if ((!trackedGirl.name || /^Girl \d+$/.test(trackedGirl.name)) && globalGirl.name) {
      trackedGirl.name = globalGirl.name;
    }

    if (
      globalGirl.ico &&
      (!trackedGirl.ico || trackedGirl.ico.indexOf("/pictures/gallery/") === -1)
    ) {
      trackedGirl.ico = GameHelpers.buildGirlIconPathFromHash_(
        id_girl,
        globalGirl.ico,
        trackedGirl.ico,
      );
    }

    const globalRarity = this._rarityFromNumber_(globalGirl.rarity);
    if (globalRarity && (trackedGirl.rarity === "common" || trackedGirl.rarity === "starting")) {
      trackedGirl.rarity = globalRarity;
    }
  }

  private _upsertGirlDictionaryEntry_(
    globalStorage: GirlGlobalStorage,
    id_girl: GirlID,
    patch: GirlDictionaryPatch,
  ): boolean {
    const key = String(id_girl);
    const existingEntry = globalStorage[key];
    const mergedEntry = existingEntry
      ? { ...existingEntry }
      : {
          name: patch.name ?? `Girl ${id_girl}`,
          rarity: patch.rarity !== undefined ? this._rarityToNumber_(patch.rarity) : 1,
        };

    let hasChanges = !existingEntry;
    if (patch.name && (!mergedEntry.name || /^Girl \d+$/.test(mergedEntry.name))) {
      mergedEntry.name = patch.name;
      hasChanges = true;
    }

    if (patch.rarity !== undefined) {
      const rarity = this._rarityToNumber_(patch.rarity);
      if (mergedEntry.rarity === undefined || rarity > mergedEntry.rarity) {
        mergedEntry.rarity = rarity;
        hasChanges = true;
      }
    }

    const icoHash = this._extractHashFromUrlOrHash_(patch.ico);
    if (icoHash && !mergedEntry.ico) {
      mergedEntry.ico = icoHash;
      hasChanges = true;
    }

    const poseHash = this._extractHashFromUrlOrHash_(patch.poseImage);
    if (poseHash && !mergedEntry.poseImage) {
      mergedEntry.poseImage = poseHash;
      hasChanges = true;
    }

    if (patch.shards !== undefined) {
      const normalizedShards = Math.min(Math.max(patch.shards, 0), 100);
      if (mergedEntry.shards === undefined || normalizedShards > mergedEntry.shards) {
        mergedEntry.shards = normalizedShards;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      globalStorage[key] = mergedEntry;
    }

    return hasChanges;
  }

  private _extractHashFromUrlOrHash_(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }
    if (!value.includes("/")) {
      return value;
    }
    const match = value.match(/\/pictures\/gallery\/\d+\/[^/]+\/\d+-([a-fA-F0-9]+)\.png/);
    if (!match) {
      return undefined;
    }
    return match[1].toLowerCase();
  }

  private _rarityToNumber_(rarity: GirlRarity): number {
    const map: Record<GirlRarity, number> = {
      starting: 0,
      common: 1,
      rare: 2,
      epic: 3,
      legendary: 4,
      mythic: 5,
    };
    return map[rarity] ?? 1;
  }

  private _rarityFromNumber_(rarity: number | undefined): GirlRarity | undefined {
    const map: Record<number, GirlRarity> = {
      0: "starting",
      1: "common",
      2: "rare",
      3: "epic",
      4: "legendary",
      5: "mythic",
    };
    if (rarity === undefined) {
      return undefined;
    }
    return map[rarity];
  }

  private _normalizeSeasonShardLike_(rawShard: any): SeasonShardLike | undefined {
    const id_girl = this._toNumberOrUndefined_(rawShard?.id_girl);
    const rarity = rawShard?.rarity as GirlRarity | undefined;
    if (id_girl === undefined || !rarity || !this._trackedRarities.includes(rarity)) {
      return undefined;
    }

    return {
      id_girl: id_girl as GirlID,
      rarity,
      name: rawShard?.name,
      ico: rawShard?.ico,
      avatar: rawShard?.avatar,
      graded2: rawShard?.graded2,
      is_girl_owned: Boolean(rawShard?.is_girl_owned),
      value: this._toNumberOrUndefined_(rawShard?.value),
      previous_value: this._toNumberOrUndefined_(rawShard?.previous_value),
      grade_skins: this._normalizeSeasonSkinList_(rawShard?.grade_skins),
    };
  }

  private _collectGirlsFromOpponents_(): SeasonShardLike[] {
    const opponents = (unsafeWindow as { opponents?: SeasonOpponent[] }).opponents;
    if (!Array.isArray(opponents) || !opponents.length) {
      return [];
    }

    const result: SeasonShardLike[] = [];
    opponents.forEach((opponent) => {
      const opponentSkinsByGirlId = this._groupDroppedSkinsByGirlId_(
        opponent.rewards?.grade_skins ?? [],
      );
      const shardRows = [
        ...(Array.isArray(opponent.rewards?.shards) ? opponent.rewards!.shards! : []),
        ...(Array.isArray(opponent.rewards?.data?.shards) ? opponent.rewards!.data!.shards! : []),
      ];
      shardRows.forEach((rawShard) => {
        const normalizedShard = this._normalizeSeasonShardLike_(rawShard);
        if (normalizedShard) {
          normalizedShard.grade_skins = this._mergeSeasonSkinLists_(
            normalizedShard.grade_skins,
            this._normalizeSeasonSkinList_(opponentSkinsByGirlId.get(normalizedShard.id_girl)),
          );
          result.push(normalizedShard);
        }
      });
    });

    return result;
  }

  private _collectGirlsFromSeasonWindow_(): SeasonShardLike[] {
    const seasonsGirls = (unsafeWindow as Partial<UnsafeWindow_Season>).seasons_girls;
    if (!Array.isArray(seasonsGirls)) {
      return [];
    }

    const result: SeasonShardLike[] = [];
    seasonsGirls.forEach((seasonGirl) => {
      const normalized: SeasonShardLike = {
        id_girl: seasonGirl.id_girl as GirlID,
        rarity: seasonGirl.rarity as GirlRarity,
        name: seasonGirl.name,
        ico: seasonGirl.ico,
        avatar: seasonGirl.avatar,
        graded2: seasonGirl.graded2,
        is_girl_owned: seasonGirl.is_girl_owned,
        value: this._toNumberOrUndefined_(seasonGirl.value),
        previous_value: this._toNumberOrUndefined_(seasonGirl.previous_value),
        grade_skins: this._normalizeSeasonSkinList_(seasonGirl.preview?.grade_skins_data),
      };
      if (this._trackedRarities.includes(normalized.rarity)) {
        result.push(normalized);
      }
    });

    return result;
  }

  private _mergeSeasonGirls_(girls: SeasonShardLike[]): SeasonShardLike[] {
    const merged = new Map<GirlID, SeasonShardLike>();

    girls.forEach((girl) => {
      const previous = merged.get(girl.id_girl);
      if (!previous) {
        merged.set(girl.id_girl, { ...girl });
        return;
      }

      merged.set(girl.id_girl, {
        ...previous,
        ...girl,
        rarity: girl.rarity ?? previous.rarity,
        is_girl_owned: Boolean(previous.is_girl_owned || girl.is_girl_owned),
        value:
          girl.value !== undefined ? Math.max(girl.value, previous.value ?? 0) : previous.value,
        previous_value:
          girl.previous_value !== undefined
            ? Math.max(girl.previous_value, previous.previous_value ?? 0)
            : previous.previous_value,
        grade_skins: this._mergeSeasonSkinLists_(previous.grade_skins, girl.grade_skins),
      });
    });

    return Array.from(merged.values());
  }

  private _handleArenaPage() {
    const opponentGirls = this._mergeSeasonGirls_(this._collectGirlsFromOpponents_());
    const fallbackGirls = this._mergeSeasonGirls_(this._collectGirlsFromSeasonWindow_());
    const girlsToTrackSource = opponentGirls.length ? opponentGirls : fallbackGirls;
    const candidateGirls = girlsToTrackSource.filter((girl) => {
      return (
        !girl.is_girl_owned ||
        (girl.value ?? 0) < 100 ||
        Boolean(girl.grade_skins?.some((skin) => !skin.is_owned))
      );
    });

    if (!candidateGirls.length) {
      SeasonShardTrackerStorageHandler.setCurrentTrackingState_([]);
      this._shouldTrackShards = false;
      return;
    }

    this._shouldTrackShards = true;
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    let dictionaryChanged = false;
    const trackedGirlIds: GirlID[] = [];

    candidateGirls.forEach((seasonGirl) => {
      trackedGirlIds.push(seasonGirl.id_girl);
      dictionaryChanged =
        this._upsertGirlDictionaryFromSeasonSource_(globalStorage, seasonGirl) || dictionaryChanged;

      const existingTrackedGirl = SeasonShardTrackerStorageHandler.getTrackedGirl_(
        seasonGirl.id_girl,
      );
      if (existingTrackedGirl) {
        this._updateExistingTrackedGirl_(existingTrackedGirl, seasonGirl, globalStorage);
        return;
      }

      const trackedGirlRecord = this._createTrackedGirlRecord_(seasonGirl, globalStorage);
      SeasonShardTrackerStorageHandler.upsertTrackedGirl_(seasonGirl.id_girl, trackedGirlRecord);
    });

    if (dictionaryChanged) {
      GirlGlobalStorageHandler.setGirlGlobalStorage_(globalStorage);
    }

    SeasonShardTrackerStorageHandler.setCurrentTrackingState_(trackedGirlIds);
  }

  private _upsertGirlDictionaryFromSeasonSource_(
    globalStorage: GirlGlobalStorage,
    seasonGirl: SeasonShardLike,
  ): boolean {
    return this._upsertGirlDictionaryEntry_(globalStorage, seasonGirl.id_girl, {
      name: seasonGirl.name,
      rarity: seasonGirl.rarity,
      ico: seasonGirl.ico,
      poseImage: seasonGirl.avatar,
      shards: seasonGirl.is_girl_owned ? 100 : seasonGirl.value,
    });
  }

  private _createTrackedGirlRecord_(
    seasonGirl: SeasonShardLike,
    globalStorage: GirlGlobalStorage,
  ): TrackedGirl {
    const globalGirl = globalStorage[seasonGirl.id_girl];
    const trackedGirlRecord: TrackedGirl = {
      name: seasonGirl.name ?? globalGirl?.name ?? `Girl ${seasonGirl.id_girl}`,
      ico:
        seasonGirl.ico ??
        GameHelpers.buildGirlIconPathFromHash_(seasonGirl.id_girl, globalGirl?.ico, seasonGirl.ico),
      rarity: seasonGirl.rarity ?? this._rarityFromNumber_(globalGirl?.rarity) ?? "common",
      number_fight: 0,
      dropped_shards: 0,
      grade: seasonGirl.graded2?.match(/<g/g)?.length ?? 0,
      last_fight_time: 0,
    };

    if (seasonGirl.grade_skins?.length) {
      const unownedSkins = seasonGirl.grade_skins.filter((skin) => !skin.is_owned);
      if (unownedSkins.length) {
        trackedGirlRecord.skins = unownedSkins.map((skin) => ({
          ico_path: skin.ico_path,
          number_fight: 0,
          is_owned: skin.is_owned,
          dropped_shards: 0,
        }));
      }
    }

    if (seasonGirl.is_girl_owned || (seasonGirl.value ?? 0) >= 100 || globalGirl?.shards === 100) {
      trackedGirlRecord.last_shards_count = 100;
    }

    this._fillTrackedGirlFromDictionary_(seasonGirl.id_girl, trackedGirlRecord, globalStorage);
    return trackedGirlRecord;
  }

  private _updateExistingTrackedGirl_(
    existingTrackedGirl: TrackedGirl,
    seasonGirl: SeasonShardLike,
    globalStorage: GirlGlobalStorage,
  ): void {
    let hasChanges = false;

    const previousName = existingTrackedGirl.name;
    const previousIco = existingTrackedGirl.ico;
    const previousRarity = existingTrackedGirl.rarity;
    this._fillTrackedGirlFromDictionary_(seasonGirl.id_girl, existingTrackedGirl, globalStorage);
    if (
      previousName !== existingTrackedGirl.name ||
      previousIco !== existingTrackedGirl.ico ||
      previousRarity !== existingTrackedGirl.rarity
    ) {
      hasChanges = true;
    }

    if (seasonGirl.name && /^Girl \d+$/.test(existingTrackedGirl.name)) {
      existingTrackedGirl.name = seasonGirl.name;
      hasChanges = true;
    }

    if (
      seasonGirl.ico &&
      (!existingTrackedGirl.ico || existingTrackedGirl.ico.indexOf("/pictures/gallery/") === -1)
    ) {
      existingTrackedGirl.ico = seasonGirl.ico;
      hasChanges = true;
    }

    if (
      seasonGirl.rarity &&
      (existingTrackedGirl.rarity === "common" || existingTrackedGirl.rarity === "starting")
    ) {
      existingTrackedGirl.rarity = seasonGirl.rarity;
      hasChanges = true;
    }

    if (
      existingTrackedGirl.last_shards_count !== 100 &&
      (seasonGirl.is_girl_owned || (seasonGirl.value ?? 0) >= 100)
    ) {
      existingTrackedGirl.last_shards_count = 100;
      hasChanges = true;
    }

    if (seasonGirl.grade_skins?.length || existingTrackedGirl.skins?.length) {
      const newSkinsTracked: NonNullable<TrackedGirl["skins"]> = [];
      let skinsChanged = false;

      // First pass: iterate through grade_skins to maintain order
      if (seasonGirl.grade_skins?.length) {
        seasonGirl.grade_skins.forEach((skin) => {
          const skinTracked = existingTrackedGirl.skins?.find(
            (trackedSkin) => trackedSkin.ico_path === skin.ico_path,
          );

          if (skinTracked) {
            // Preserve tracked data, update ownership if changed
            if (skinTracked.is_owned !== skin.is_owned) {
              skinTracked.is_owned = skin.is_owned;
              skinsChanged = true;
            }
            newSkinsTracked.push(skinTracked);
          } else if (!skin.is_owned) {
            // New unowned skin
            newSkinsTracked.push({
              ico_path: skin.ico_path,
              number_fight: 0,
              is_owned: skin.is_owned,
              dropped_shards: 0,
            });
            skinsChanged = true;
          }
        });
      }

      // Second pass: add any existing tracked skins not in current grade_skins
      if (existingTrackedGirl.skins?.length) {
        existingTrackedGirl.skins.forEach((trackedSkin) => {
          const alreadyAdded = newSkinsTracked.some(
            (skin) => skin.ico_path === trackedSkin.ico_path,
          );
          if (!alreadyAdded) {
            newSkinsTracked.push(trackedSkin);
            skinsChanged = true;
          }
        });
      }

      if (skinsChanged) {
        existingTrackedGirl.skins = newSkinsTracked.length ? newSkinsTracked : undefined;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      SeasonShardTrackerStorageHandler.upsertTrackedGirl_(seasonGirl.id_girl, existingTrackedGirl);
    }
  }

  private _handleBattlePage() {
    const currentTrackingState = SeasonShardTrackerStorageHandler.getCurrentTrackingState_();
    if (currentTrackingState.girlIds.length) {
      this._shouldTrackShards = true;
    }
  }

  private _createGirlEntry(id_girl: GirlID, girl: TrackedGirl): JQuery<HTMLElement> {
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    this._fillTrackedGirlFromDictionary_(id_girl, girl, globalStorage);
    const globalGirl = globalStorage[id_girl];
    const iconSrc = GameHelpers.buildGirlIconPathFromHash_(id_girl, globalGirl?.ico, girl.ico);
    const shards =
      girl.dropped_shards +
      (girl.skins ?? []).reduce((sum, skin) => {
        return sum + (skin.dropped_shards ?? 0);
      }, 0);
    const fights =
      girl.number_fight +
      (girl.skins ?? []).reduce((sum, skin) => {
        return sum + skin.number_fight;
      }, 0);

    const girlDiv = $(html`
      <div id_girl="${id_girl}">
        <div girl="${id_girl}" class="harem-girl">
          <div class="left">
            <img class="${girl.rarity}" src="${iconSrc}" alt="" />
          </div>
          <div class="right">
            <h4>${girl.name}</h4>
            <div class="g_infos">
              <div class="graded">${"<g></g>".repeat(girl.grade)}</div>
            </div>
            ${this._generateDropDisplay(shards, fights)}
          </div>
        </div>
      </div>
    `);

    girlDiv.on("click", () => {
      this._generateGirlDetail(id_girl, girl);
    });

    return girlDiv;
  }

  private _generateGirlDetail(id_girl: GirlID, girl: TrackedGirl) {
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    this._fillTrackedGirlFromDictionary_(id_girl, girl, globalStorage);
    const globalGirl = globalStorage[id_girl];
    const poseSrc = GameHelpers.buildGirlPosePathFromHash_(id_girl, globalGirl?.poseImage);
    const $girlDetail = $(
      "#popup-drop-log-several-qol > .container-special-bg > .drop-log > .girl-detail",
    ).empty();

    let skinsHtml = "";
    if (girl.skins && girl.skins.length > 0) {
      skinsHtml = `<div class="skins-section">
        <h3>Skins</h3>
        <div class="skins-list">
          ${girl.skins
            .map((skin, index) => {
              return `<div class="skin-entry">
              <div class="skin-ico"><img src="${skin.ico_path}" alt="Skin ${index + 1}" /></div>
              ${this._generateDropDisplay(skin.dropped_shards ?? 0, skin.number_fight)}
            </div>`;
            })
            .join("")}
        </div>
      </div>`;
    }

    const girlDetail = html`
      <div class="girl-detail-container">
        <img src="${poseSrc}" class="background-pose" alt="${girl.name}" />
        <div class="girl-detail-content">
          <h2>${girl.name}</h2>
          <div class="graded-detail">${"<g></g>".repeat(girl.grade)}</div>
          <div class="detail-stats">
            <h3>Season Stats</h3>
            ${this._generateDropDisplay(girl.dropped_shards, girl.number_fight)}
          </div>
          ${skinsHtml}
          <div class="detail-actions">
            <button class="delete-girl-btn" type="button">Delete Tracked Data</button>
          </div>
        </div>
      </div>
    `;
    $girlDetail.append(girlDetail);

    $("#container-drop-log-several-qol div[girl]").removeClass("opened");
    $(`#container-drop-log-several-qol div[girl="${id_girl}"]`).addClass("opened");

    $girlDetail.find(".delete-girl-btn").on("click", () => {
      if (
        confirm(
          `Are you sure you want to delete all tracked data for ${girl.name}? This action cannot be undone.`,
        )
      ) {
        SeasonShardTrackerStorageHandler.removeTrackedGirl_(id_girl);
        $girlDetail.empty();
        $(`#container-drop-log-several-qol div[id_girl="${id_girl}"]`).remove();
      }
    });
  }

  private _generateDropDisplay(shards: number, fights: number): string {
    const percent = (fights === 0 ? 0 : (100 * shards) / fights).toFixed(2) + "%";
    return html`
      <div class="drop-display">
        <div class="total-shards">
          <span class="label">${shards}</span>
          <span class="icon shards"></span>
        </div>
        <div class="total-fights">
          <span class="label">${fights}</span>
          <span class="icon kiss"></span>
        </div>
        <div class="drop-rate">
          <span class="label">${percent}</span>
        </div>
      </div>
    `;
  }

  private _createGirlList(): JQuery<HTMLElement> {
    const $girlList = $('<div class="girl-grid hh-scroll"></div>');
    Object.entries(SeasonShardTrackerStorageHandler.getTrackedGirls_())
      .filter(
        ([_, girl]) =>
          girl.number_fight + (girl.skins ?? []).reduce((sum, skin) => sum + skin.number_fight, 0) >
          0,
      )
      .sort(([_, a], [__, b]) => b.last_fight_time - a.last_fight_time)
      .map(([id, girl]) => this._createGirlEntry(+id, girl))
      .forEach(($girlEntry) => {
        $girlList.append($girlEntry);
      });
    return $girlList;
  }

  private _makeLogPopup() {
    const title = "Season Shard Drop Log";
    const $dropLog = $('<div class="drop-log"></div>');
    $dropLog.append(this._createGirlList());
    $dropLog.append(html`<div class="girl-detail hh-scroll"></div>`);

    HHPlusPlusReplacer.doWhenSelectorAvailable_("#season-arena > .player_team_block", ($host) => {
      if ($("#show-drop-log-season-several-qol").length) {
        return;
      }

      $host.css("position", "relative");
      const $showLogButton = $(html`
        <span id="show-drop-log-season-several-qol">
          <img
            tooltip
            hh_title="show season drop log"
            src="https://hh.hh-content.com/design/ic_books_gray.svg"
            alt="show season log"
          />
        </span>
      `);

      $host.append($showLogButton);
      $showLogButton.on("click", () => {
        GameHelpers.createPopup_("common", "drop-log-several-qol", $dropLog, title);
        $("#popup-drop-log-several-qol > .container-special-bg > .drop-log > .girl-grid")
          .children()
          .first()
          .trigger("click");
      });
    });
  }
}
