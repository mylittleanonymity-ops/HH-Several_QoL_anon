import { SubModule } from "../../base";
import type {
  DoBattlesTrollsResponse,
  AjaxShardGirlUpdate,
  VillainPreBattle,
  TrackedGirl,
  GirlID,
  GirlRarity,
  GradeSkins,
} from "../../types";
import type { GirlGlobalStorage } from "../../types/storage/GirlGlobalStorage";
import { GirlGlobalStorageHandler, ShardTrackerStorageHandler } from "../../utils/StorageHandler";
import GameHelpers from "../../utils/GameHelpers";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";
import { villainShardTrackerCss } from "../../css/modules";
import html from "../../utils/html";
import AjaxCompleteHook from "../../SingletonModules/AjaxCompleteHook";
import runTimingHandler from "../../runTimingHandler";

type PreBattleGirl = VillainPreBattle["rewards"]["girls_plain"][number];
type PreBattleShard = NonNullable<VillainPreBattle["rewards"]["data"]["shards"]>[number];

type GirlDictionaryPatch = {
  name?: string;
  rarity?: GirlRarity;
  ico?: string;
  poseImage?: string;
  shards?: number;
};

export default class ShardTracker implements SubModule {
  private static readonly EVENT_OPTIONS = [
    "Mythic Days (Revival)",
    "Legendary Days",
    "Classic Event",
    "Orgy Days",
    "Love Raids",
    "Villain Girl",
    "Kinkversary 26",
  ];

  private static readonly TRACKED_BATTLE_ACTIONS = ["do_battles_trolls"];

  static shouldRun_() {
    return (
      location.pathname.includes("/troll-pre-battle.html") ||
      location.pathname.includes("/troll-battle.html")
    );
  }

  private async _injectCSS() {
    GM_addStyle(villainShardTrackerCss);
  }

  private _shouldTrackShards = false;
  // XXX: could be made configurable
  private readonly _trackedRarities: Array<GirlRarity> = ["mythic", "legendary"];

  async run_() {
    if (!ShardTracker.shouldRun_()) {
      return;
    }
    await runTimingHandler.afterGameScriptsRun_();
    if (location.pathname === "/troll-pre-battle.html") {
      this._injectCSS();
      this._makeLogPopup();
      this._handlePreBattlePage();
    } else {
      this._handleBattlePage();
    }
    if (!this._shouldTrackShards) {
      return;
    }
    const currentTrackedGirlIds = ShardTrackerStorageHandler.getCurrentTrackingState_().girlIds;
    if (!currentTrackedGirlIds.length) {
      return;
    }
    console.log("ShardTracker module is running.");
    this._hookTrollAjaxComplete();
  }

  private _hookTrollAjaxComplete() {
    AjaxCompleteHook.getInstance_().addCallback_((_event, xhr, settings) => {
      if (!this._shouldTrackShards || typeof settings?.data !== "string") {
        return;
      }

      const action = this._extractRequestAction(settings.data);
      if (!action || !ShardTracker.TRACKED_BATTLE_ACTIONS.includes(action)) {
        return;
      }

      const response = xhr.responseJSON as DoBattlesTrollsResponse;
      this._processBattleResponse(response, settings.data);
    });
  }

  private _extractRequestAction(requestData: string): string | undefined {
    const actionMatch = requestData.match(/(?:^|&)action=([^&]+)/);
    return actionMatch?.[1];
  }

  private _extractNumberOfBattles(requestData: string): number {
    const battlesMatch = requestData.match(/number_of_battles=(\d+)/);
    return battlesMatch ? parseInt(battlesMatch[1], 10) : 1;
  }

  private _groupDroppedSkinsByGirlId(skins: GradeSkins): Map<GirlID, GradeSkins> {
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

  private _processBattleResponse(
    response: DoBattlesTrollsResponse | undefined,
    requestData: string,
  ): void {
    if (!response?.rewards?.data) {
      return;
    }

    if (location.pathname === "/troll-pre-battle.html") {
      // Avoids double clicks leading to sending and immediatly refreshing leading to lost data
      $("button.battle-action-button").prop("disabled", true);
    }

    console.log("ShardTracker response data:", { response });

    const numberOfBattles = this._extractNumberOfBattles(requestData);
    const rewards = response.rewards.data;
    const shardDrops = (rewards.shards ?? []).filter((shard) =>
      this._trackedRarities.includes(shard.rarity),
    );
    const dropsByGirlId = new Map<GirlID, AjaxShardGirlUpdate>(
      shardDrops.map((shard) => [shard.id_girl, shard]),
    );
    const skinsByGirlId = this._groupDroppedSkinsByGirlId(rewards.grade_skins ?? []);
    const obtainedGirlIds = new Set<GirlID>((rewards.girls ?? []).map((girl) => girl.id_girl));

    const currentTrackingState = ShardTrackerStorageHandler.getCurrentTrackingState_();
    if (!currentTrackingState.girlIds.length) {
      this._shouldTrackShards = false;
      return;
    }

    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    let dictionaryChanged = false;
    dictionaryChanged = this._mergeRewardsIntoGirlDictionary(globalStorage, shardDrops);
    dictionaryChanged =
      this._mergeRewardsIntoGirlDictionary(globalStorage, rewards.girls ?? []) || dictionaryChanged;

    const completedGirlIds: GirlID[] = [];
    currentTrackingState.girlIds.forEach((girlID) => {
      const trackedGirl = ShardTrackerStorageHandler.getTrackedGirl_(girlID);
      if (!trackedGirl) {
        return;
      }

      this._fillTrackedGirlFromDictionary(girlID, trackedGirl, globalStorage);
      trackedGirl.last_fight_time = Date.now();

      this._applyDropUpdate(
        trackedGirl,
        numberOfBattles,
        dropsByGirlId.get(girlID),
        skinsByGirlId.get(girlID) ?? [],
        obtainedGirlIds.has(girlID),
      );
      ShardTrackerStorageHandler.upsertTrackedGirl_(girlID, trackedGirl);

      dictionaryChanged =
        this._upsertGirlDictionaryEntry(globalStorage, girlID, {
          name: trackedGirl.name,
          rarity: trackedGirl.rarity,
          ico: trackedGirl.ico,
          shards: trackedGirl.last_shards_count,
        }) || dictionaryChanged;

      if (this._isTrackingCompleted(trackedGirl)) {
        completedGirlIds.push(girlID);
      }
    });

    if (dictionaryChanged) {
      GirlGlobalStorageHandler.setGirlGlobalStorage_(globalStorage);
    }

    if (completedGirlIds.length) {
      this._removeCompletedGirlsFromTracking(completedGirlIds);
    }
  }

  private _removeCompletedGirlsFromTracking(completedGirlIds: GirlID[]) {
    const currentTrackingState = ShardTrackerStorageHandler.getCurrentTrackingState_();
    const newTrackedGirlIds = currentTrackingState.girlIds.filter(
      (id) => !completedGirlIds.includes(id),
    );
    if (newTrackedGirlIds.length === 0) {
      this._shouldTrackShards = false;
      ShardTrackerStorageHandler.setCurrentTrackingState_(-1);
      return;
    }

    ShardTrackerStorageHandler.setCurrentTrackingState_(
      currentTrackingState.trollID,
      newTrackedGirlIds,
    );
  }

  private _applyDropUpdate(
    trackedGirl: TrackedGirl,
    successfulBattles: number,
    dropInfo: AjaxShardGirlUpdate | undefined,
    skinsDropped: GradeSkins,
    girlWasObtained: boolean,
  ): void {
    if (!dropInfo) {
      this._addFightsToTrackedGirl(trackedGirl, successfulBattles);
      return;
    }

    if (dropInfo.previous_value > 100) {
      alert(
        "ShardTracker: encountered unusable shard payload, this fight was skipped in tracking.\nIF YOU WANT TO REPORT SEND A SCREENSHOT OF THE DROP",
      );
      console.warn("unusable shard drop info:", dropInfo);
      return;
    }

    if (dropInfo.value !== 100 || !trackedGirl.skins?.length) {
      this._applyGirlShardDrop(trackedGirl, dropInfo, successfulBattles);
      return;
    }

    if (girlWasObtained) {
      this._applyGirlAndSkinDrop(trackedGirl, dropInfo, successfulBattles, skinsDropped);
      return;
    }

    if (skinsDropped.length) {
      this._applySkinOnlyDrop(trackedGirl, dropInfo, successfulBattles, skinsDropped);
      return;
    }

    this._applySimpleSkinDrop(trackedGirl, dropInfo, successfulBattles);
  }

  private _addFightsToTrackedGirl(trackedGirl: TrackedGirl, nbFights: number): void {
    if (nbFights <= 0) {
      return;
    }
    if (trackedGirl.last_shards_count === 100) {
      const firstUnownedSkin = trackedGirl.skins?.find((skin) => !skin.is_owned);
      if (firstUnownedSkin) {
        firstUnownedSkin.number_fight += nbFights;
      }
      return;
    }

    trackedGirl.number_fight += nbFights;
  }

  private _applyGirlShardDrop(
    trackedGirl: TrackedGirl,
    dropInfo: AjaxShardGirlUpdate,
    numberOfBattles: number,
  ): void {
    trackedGirl.last_shards_count = Math.min(dropInfo.value, 100);
    trackedGirl.number_fight += numberOfBattles;
    trackedGirl.dropped_shards += Math.max(dropInfo.value - dropInfo.previous_value, 0);
  }

  private _applySimpleSkinDrop(
    trackedGirl: TrackedGirl,
    dropInfo: AjaxShardGirlUpdate,
    numberOfBattles: number,
  ): void {
    const currentTrackedSkin = trackedGirl.skins?.find((skin) => !skin.is_owned);
    if (!currentTrackedSkin) {
      this._addFightsToTrackedGirl(trackedGirl, numberOfBattles);
      return;
    }

    currentTrackedSkin.number_fight += numberOfBattles;
    currentTrackedSkin.dropped_shards += Math.max(dropInfo.value - dropInfo.previous_value, 0);
  }

  private _applyGirlAndSkinDrop(
    trackedGirl: TrackedGirl,
    dropInfo: AjaxShardGirlUpdate,
    numberOfBattles: number,
    skinsDropped: GradeSkins,
  ): void {
    const lastShardCount = this._getGirlLastShardCount(trackedGirl, dropInfo);
    const totalShards =
      Math.max(dropInfo.value - dropInfo.previous_value, 0) +
      this._sumDroppedSkinShards(skinsDropped);
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

    this._applySkinDrops(trackedGirl, numberOfBattles, skinsDropped, skinShardsPool);
  }

  private _applySkinOnlyDrop(
    trackedGirl: TrackedGirl,
    dropInfo: AjaxShardGirlUpdate,
    numberOfBattles: number,
    skinsDropped: GradeSkins,
  ): void {
    const totalSkinShards =
      Math.max(dropInfo.value - dropInfo.previous_value, 0) +
      this._sumDroppedSkinShards(skinsDropped);
    this._applySkinDrops(trackedGirl, numberOfBattles, skinsDropped, totalSkinShards);
  }

  private _sumDroppedSkinShards(skinsDropped: GradeSkins): number {
    return skinsDropped.reduce((sum, skin) => {
      return sum + Math.max(skin.shards_added, 0);
    }, 0);
  }

  private _applySkinDrops(
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

  private _getGirlLastShardCount(trackedGirl: TrackedGirl, dropInfo: AjaxShardGirlUpdate): number {
    if (
      trackedGirl.last_shards_count !== undefined &&
      trackedGirl.last_shards_count >= dropInfo.previous_value
    ) {
      return trackedGirl.last_shards_count;
    }
    return dropInfo.previous_value;
  }

  private _isTrackingCompleted(trackedGirl: TrackedGirl): boolean {
    return (
      trackedGirl.last_shards_count === 100 &&
      (!trackedGirl.skins || trackedGirl.skins.every((skin) => skin.is_owned))
    );
  }

  private _mergeRewardsIntoGirlDictionary(
    globalStorage: GirlGlobalStorage,
    rewards: AjaxShardGirlUpdate[],
  ): boolean {
    let hasChanges = false;
    rewards.forEach((reward) => {
      hasChanges =
        this._upsertGirlDictionaryEntry(globalStorage, reward.id_girl, {
          name: reward.name,
          rarity: reward.rarity,
          ico: reward.ico,
          poseImage: reward.avatar,
          shards: reward.value,
        }) || hasChanges;
    });
    return hasChanges;
  }

  private _fillTrackedGirlFromDictionary(
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

  private _upsertGirlDictionaryEntry(
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

    const icoHash = this._extractHashFromUrlOrHash(patch.ico);
    if (icoHash && !mergedEntry.ico) {
      mergedEntry.ico = icoHash;
      hasChanges = true;
    }

    const poseHash = this._extractHashFromUrlOrHash(patch.poseImage);
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

  private _extractHashFromUrlOrHash(value: string | undefined): string | undefined {
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

  private _handlePreBattlePage() {
    const opponentFighter = unsafeWindow.opponent_fighter as VillainPreBattle;
    if (!opponentFighter || !opponentFighter.rewards.girls_plain) {
      return;
    }
    const trackedGirlsPlain = opponentFighter.rewards.girls_plain.filter((girl) => {
      return (
        this._trackedRarities.includes(girl.rarity) && // check rarity
        (!girl.is_girl_owned || // check if girl is not owned or has unowned skins
          girl.grade_skins?.some((skin) => !skin.is_owned))
      );
    });
    if (!trackedGirlsPlain || trackedGirlsPlain.length === 0) {
      ShardTrackerStorageHandler.setCurrentTrackingState_(-1);
      this._shouldTrackShards = false;
      return;
    }

    this._shouldTrackShards = true;
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    let dictionaryChanged = false;
    const trackedGirlIds: GirlID[] = [];
    trackedGirlsPlain.forEach((girlPlain) => {
      trackedGirlIds.push(girlPlain.id_girl);

      const girlShards = opponentFighter.rewards.data.shards?.find(
        (shard) => shard.id_girl === girlPlain.id_girl,
      );

      dictionaryChanged =
        this._upsertGirlDictionaryFromPreBattle_(globalStorage, girlPlain, girlShards) ||
        dictionaryChanged;

      const existingTrackedGirl = ShardTrackerStorageHandler.getTrackedGirl_(girlPlain.id_girl);
      if (existingTrackedGirl) {
        this._updateExistingTrackedGirl(existingTrackedGirl, girlPlain, girlShards, globalStorage);
        return;
      }

      const trackedGirlRecord = this._createTrackedGirlRecord(
        girlPlain.id_girl,
        girlPlain,
        girlShards,
        globalStorage,
      );
      ShardTrackerStorageHandler.upsertTrackedGirl_(girlPlain.id_girl, trackedGirlRecord);
    });

    if (dictionaryChanged) {
      GirlGlobalStorageHandler.setGirlGlobalStorage_(globalStorage);
    }

    ShardTrackerStorageHandler.setCurrentTrackingState_(
      opponentFighter.player.id_fighter,
      trackedGirlIds,
    );
  }

  private _upsertGirlDictionaryFromPreBattle_(
    globalStorage: GirlGlobalStorage,
    girlPlain: PreBattleGirl,
    girlShards: PreBattleShard | undefined,
  ): boolean {
    return this._upsertGirlDictionaryEntry(globalStorage, girlPlain.id_girl, {
      name: girlShards?.name,
      rarity: girlShards?.rarity ?? girlPlain.rarity,
      ico: girlShards?.ico ?? girlPlain.ico,
      poseImage: girlShards?.avatar,
      shards: girlShards?.is_girl_owned || girlPlain.is_girl_owned ? 100 : undefined,
    });
  }

  private _createTrackedGirlRecord(
    id_girl: GirlID,
    girlPlain: PreBattleGirl,
    girlShards: PreBattleShard | undefined,
    globalStorage: GirlGlobalStorage,
  ): TrackedGirl {
    const globalGirl = globalStorage[id_girl];
    const trackedGirlRecord: TrackedGirl = {
      name: girlShards?.name ?? globalGirl?.name ?? `Girl ${id_girl}`,
      ico:
        girlShards?.ico ??
        GameHelpers.buildGirlIconPathFromHash_(id_girl, globalGirl?.ico, girlPlain.ico),
      rarity: girlShards?.rarity ?? this._rarityFromNumber_(globalGirl?.rarity) ?? girlPlain.rarity,
      number_fight: 0,
      dropped_shards: 0,
      grade: girlShards?.graded2.match(/<g/g)?.length ?? 0,
      last_fight_time: 0,
    };

    if (girlShards?.is_girl_owned || girlPlain.is_girl_owned || globalGirl?.shards === 100) {
      trackedGirlRecord.last_shards_count = 100;
    }

    if (girlPlain.grade_skins) {
      const girlSkins = girlPlain.grade_skins.filter((skin) => !skin.is_owned);
      if (girlSkins.length) {
        trackedGirlRecord.skins = girlSkins.map((skin) => ({
          ico_path: skin.ico_path,
          number_fight: 0,
          is_owned: skin.is_owned, // will be false here
          dropped_shards: 0,
        }));
      }
    }

    this._fillTrackedGirlFromDictionary(id_girl, trackedGirlRecord, globalStorage);
    return trackedGirlRecord;
  }

  private _updateExistingTrackedGirl(
    existingTrackedGirl: TrackedGirl,
    girlPlain: PreBattleGirl,
    girlShards: PreBattleShard | undefined,
    globalStorage: GirlGlobalStorage,
  ) {
    let hasChanges = false;

    const previousName = existingTrackedGirl.name;
    const previousIco = existingTrackedGirl.ico;
    const previousRarity = existingTrackedGirl.rarity;
    this._fillTrackedGirlFromDictionary(girlPlain.id_girl, existingTrackedGirl, globalStorage);
    if (
      previousName !== existingTrackedGirl.name ||
      previousIco !== existingTrackedGirl.ico ||
      previousRarity !== existingTrackedGirl.rarity
    ) {
      hasChanges = true;
    }

    if (girlShards) {
      if (
        (!existingTrackedGirl.name || /^Girl \d+$/.test(existingTrackedGirl.name)) &&
        girlShards.name
      ) {
        existingTrackedGirl.name = girlShards.name;
        hasChanges = true;
      }
      if (
        (!existingTrackedGirl.ico ||
          existingTrackedGirl.ico.indexOf("/pictures/gallery/") === -1) &&
        girlShards.ico
      ) {
        existingTrackedGirl.ico = girlShards.ico;
        hasChanges = true;
      }
      if (
        (existingTrackedGirl.rarity === "common" || existingTrackedGirl.rarity === "starting") &&
        girlShards.rarity
      ) {
        existingTrackedGirl.rarity = girlShards.rarity;
        hasChanges = true;
      }
    }

    if (
      existingTrackedGirl.last_shards_count !== 100 &&
      (girlPlain.is_girl_owned || girlShards?.is_girl_owned)
    ) {
      existingTrackedGirl.last_shards_count = 100;
      hasChanges = true;
    }

    if (girlPlain.grade_skins || existingTrackedGirl.skins?.length) {
      const newSkinsTracked: NonNullable<TrackedGirl["skins"]> = [];
      let skinsChanged = false;

      // First pass: iterate through grade_skins to maintain order
      if (girlPlain.grade_skins?.length) {
        girlPlain.grade_skins.forEach((skin) => {
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
      ShardTrackerStorageHandler.upsertTrackedGirl_(girlPlain.id_girl, existingTrackedGirl);
    }
  }

  private _handleBattlePage() {
    const currentTrackingState = ShardTrackerStorageHandler.getCurrentTrackingState_();
    if (
      location.search.includes(`id_opponent=${currentTrackingState.trollID}`) &&
      currentTrackingState.girlIds.length !== 0
    ) {
      this._shouldTrackShards = true;
    }
  }

  private _createGirlEntry(id_girl: GirlID, girl: TrackedGirl): JQuery<HTMLElement> {
    const globalStorage = GirlGlobalStorageHandler.getGirlGlobalStorage_();
    this._fillTrackedGirlFromDictionary(id_girl, girl, globalStorage);
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
    this._fillTrackedGirlFromDictionary(id_girl, girl, globalStorage);
    const globalGirl = globalStorage[id_girl];
    const poseSrc = GameHelpers.buildGirlPosePathFromHash_(id_girl, globalGirl?.poseImage);
    const $girlDetail = $(
      "#popup-drop-log-several-qol > .container-special-bg > .drop-log > .girl-detail",
    ).empty();

    // Calculate stats
    const girlShards = girl.dropped_shards;
    const girlFights = girl.number_fight;

    // Build skins HTML
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
            <h3>Girl Stats</h3>
            ${this._generateDropDisplay(girlShards, girlFights)}
          </div>
          ${skinsHtml}
          <div class="event-source-section" tooltip="This Will be useful for data crunching later">
            <h3>Assign Event</h3>
            ${this._generateEventPicker(girl.event_source)}
          </div>
          <div class="detail-actions">
            <button class="delete-girl-btn" type="button">Delete Tracked Data</button>
          </div>
        </div>
      </div>
    `;
    $girlDetail.append(girlDetail);

    // Event picker change handler
    $girlDetail.find(".event-picker").on("change", (e) => {
      const selectedEvent = $(e.target).val() as string;
      girl.event_source = selectedEvent || undefined;
      ShardTrackerStorageHandler.upsertTrackedGirl_(id_girl, girl);
    });

    // Highlight the selected girl in the list
    $("#container-drop-log-several-qol div[girl]").removeClass("opened");
    $(`#container-drop-log-several-qol div[girl="${id_girl}"]`).addClass("opened");

    // Delete button handler
    $girlDetail.find(".delete-girl-btn").on("click", () => {
      if (
        confirm(
          `Are you sure you want to delete all tracked data for ${girl.name}? This action cannot be undone.`,
        )
      ) {
        ShardTrackerStorageHandler.removeTrackedGirl_(id_girl);
        $girlDetail.empty();
        // Remove from the girl list
        $(`#container-drop-log-several-qol div[id_girl="${id_girl}"]`).remove();
      }
    });
  }

  private _generateDropDisplay(shards: number, fights: number): string {
    const percent = (fights == 0 ? 0 : (100 * shards) / fights).toFixed(2) + "%";
    return html`
      <div class="drop-display">
        <div class="total-shards">
          <span class="label">${shards}</span>
          <span class="icon shards"></span>
        </div>
        <div class="total-fights">
          <span class="label">${fights}</span>
          <span class="icon fights"></span>
        </div>
        <div class="drop-rate">
          <span class="label">${percent}</span>
        </div>
      </div>
    `;
  }

  private _generateEventPicker(currentEvent?: string): string {
    const options = ShardTracker.EVENT_OPTIONS.map(
      (event) =>
        `<option value="${event}" ${currentEvent === event ? "selected" : ""}>${event}</option>`,
    ).join("");
    return html`
      <select class="event-picker">
        <option value="" ${!currentEvent ? "selected" : ""}>-- Select Event --</option>
        ${options}
      </select>
    `;
  }

  private _createGirlList(): JQuery<HTMLElement> {
    const $girlList = $('<div class="girl-grid hh-scroll"></div>');
    Object.entries(ShardTrackerStorageHandler.getTrackedGirls_())
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
    const title = `Shard Drop Log`;
    const $dropLog = $('<div class="drop-log"></div>');
    $dropLog.append(this._createGirlList());
    $dropLog.append(html`<div class="girl-detail hh-scroll"></div>`);
    HHPlusPlusReplacer.doWhenSelectorAvailable_("#pre-battle .opponent .personal_info", ($opp) => {
      const $showLogButton = $(html`
        <span id="show-drop-log-several-qol">
          <img
            tooltip
            hh_title="show drop log"
            src="https://hh.hh-content.com/design/ic_books_gray.svg"
            alt="show log"
          />
        </span>
      `);
      $opp.append($showLogButton);
      $showLogButton.on("click", function () {
        GameHelpers.createPopup_("common", "drop-log-several-qol", $dropLog, title);
        $("#popup-drop-log-several-qol > .container-special-bg > .drop-log > .girl-grid")
          .children()
          .first()
          .trigger("click");
      });
    });
  }
}
