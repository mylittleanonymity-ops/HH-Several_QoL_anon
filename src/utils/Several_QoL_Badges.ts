import { BadgeDataCache, BadgeEntry } from "../types";
import { GlobalStorageHandler } from "./StorageHandler";

export interface BadgeConfig {
  type: string;
  tooltip: string;
  cssClass: string;
  userIds: string[];
}

export class Several_QoL_Badges {
  private static readonly _BADGE_DATA_URL =
    "https://raw.githubusercontent.com/infarcactus-HH/HH-Several_QoL/main/badge-data.json";
  private static _badgeCache: BadgeDataCache | null = null;

  /**
   * Computes the next 12:00 UTC boundary from the current time.
   */
  private static _computeNextRefresh(): number {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const msPerHour = 60 * 60 * 1000;
    const todayStartUTC = Math.floor(now / msPerDay) * msPerDay;
    const todayNoonUTC = todayStartUTC + 12 * msPerHour;
    return now < todayNoonUTC ? todayNoonUTC : todayNoonUTC + msPerDay;
  }

  private static _shouldInvalidateCache(): boolean {
    if (!this._badgeCache) return true;
    return Date.now() >= this._badgeCache.nextRefreshAt;
  }

  private static _initializeCache(): void {
    const cached = GlobalStorageHandler.getBadgeCache_();
    if (cached) {
      this._badgeCache = cached;
    }
  }

  /**
   * Strips `name` fields from badge entries (used only as comments in the JSON).
   */
  private static _stripNames(
    data: Record<string, Record<string, BadgeEntry[]>>,
  ): Record<string, Record<string, BadgeEntry[]>> {
    const cleaned: Record<string, Record<string, BadgeEntry[]>> = {};
    for (const universe of Object.keys(data)) {
      cleaned[universe] = {};
      for (const badgeType of Object.keys(data[universe])) {
        cleaned[universe][badgeType] = data[universe][badgeType].map((entry) => {
          if (typeof entry === "string") return entry;
          const { name, ...rest } = entry;
          // If only `id` remains (no `until`), flatten to plain string
          return rest.until !== undefined ? rest : rest.id;
        });
      }
    }
    return cleaned;
  }

  private static _fetchBadgeDataFromGitHub(): void {
    GM_xmlhttpRequest({
      method: "GET",
      url: this._BADGE_DATA_URL,
      onload: (response: GM_XMLHttpRequestResponse) => {
        if (response.status === 200) {
          try {
            const rawData = JSON.parse(response.responseText);
            this._badgeCache = {
              data: this._stripNames(rawData),
              nextRefreshAt: this._computeNextRefresh(),
            };
            GlobalStorageHandler.setBadgeCache_(this._badgeCache);
          } catch (error) {
            console.error("[Several_QoL] Failed to parse badge data:", error);
          }
        }
      },
      onerror: (error: any) => {
        console.error("[Several_QoL] Failed to fetch badge data:", error);
      },
    });
  }

  /**
   * Resolves badge entries into active user IDs.
   * Entries can be plain strings (permanent) or objects with an `until` timestamp.
   * Expired entries (Date.now() > until) are filtered out.
   */
  private static _resolveEntries(entries: BadgeEntry[]): string[] {
    const now = Date.now();
    return entries
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry.until === undefined || now <= entry.until) return entry.id;
        return null;
      })
      .filter((id): id is string => id !== null);
  }

  private static _getBadgeDataForGame(badgeType: string): string[] {
    // Initialize cache from GM storage if not already loaded
    if (this._badgeCache === null) {
      this._initializeCache();
    }

    // Check if a 12:00 UTC boundary has been crossed since last fetch
    if (this._shouldInvalidateCache()) {
      this._fetchBadgeDataFromGitHub();
    }

    // Return cached data (with expired entries filtered) or empty array
    const entries = this._badgeCache?.data[HH_UNIVERSE]?.[badgeType];
    if (entries) {
      return this._resolveEntries(entries);
    }
    return [];
  }

  static getBadgeConfigurations_(): BadgeConfig[] {
    const configs: BadgeConfig[] = [];

    // Major Script Contributors
    const majorContributors = this._getMajorContributorsForGame();
    if (majorContributors.length > 0) {
      configs.push({
        type: "major-contributor",
        tooltip: "Major Script Contributor",
        cssClass: "S_QoL-major-contributor",
        userIds: majorContributors,
      });
    }

    // Small Script Contributors
    const smallContributors = this._getSmallContributorsForGame();
    if (smallContributors.length > 0) {
      configs.push({
        type: "small-contributor",
        tooltip: "Script Contributor",
        cssClass: "S_QoL-small-contributor",
        userIds: smallContributors,
      });
    }

    // Patreon Gold Supporters
    const patreonGoldSupporters = this._getPatreonGoldForGame();
    if (patreonGoldSupporters.length > 0) {
      configs.push({
        type: "patreon-gold",
        tooltip: "Patreon Gold Supporter",
        cssClass: "S_QoL-patreon-gold",
        userIds: patreonGoldSupporters,
      });
    }

    // Patreon Silver Supporters
    const patreonSilverSupporters = this._getPatreonSilverForGame();
    if (patreonSilverSupporters.length > 0) {
      configs.push({
        type: "patreon-silver",
        tooltip: "Patreon Silver Supporter",
        cssClass: "S_QoL-patreon-silver",
        userIds: patreonSilverSupporters,
      });
    }

    // Patreon Bronze Supporters
    const patreonBronzeSupporters = this._getPatreonBronzeForGame();
    if (patreonBronzeSupporters.length > 0) {
      configs.push({
        type: "patreon-bronze",
        tooltip: "Patreon Bronze Supporter",
        cssClass: "S_QoL-patreon-bronze",
        userIds: patreonBronzeSupporters,
      });
    }

    return configs;
  }

  /**
   * Public method to ensure badge cache is initialized and refreshed if needed.
   * Call this on script startup to check for outdated badges.
   */
  static ensureCacheIsValid(): void {
    if (this._badgeCache === null) {
      this._initializeCache();
    }
    if (this._shouldInvalidateCache()) {
      this._fetchBadgeDataFromGitHub();
    }
  }

  private static _getMajorContributorsForGame(): string[] {
    return this._getBadgeDataForGame("major-contributor");
  }

  private static _getSmallContributorsForGame(): string[] {
    return this._getBadgeDataForGame("small-contributor");
  }

  private static _getPatreonSilverForGame(): string[] {
    return this._getBadgeDataForGame("patreon-silver");
  }

  private static _getPatreonBronzeForGame(): string[] {
    return this._getBadgeDataForGame("patreon-bronze");
  }

  private static _getPatreonGoldForGame(): string[] {
    return this._getBadgeDataForGame("patreon-gold");
  }
}
