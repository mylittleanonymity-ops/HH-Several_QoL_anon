import { HHModule } from "../base";
import type { MERankingHeroData, MERankingLeaderboardEntryIncomplete } from "../types";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";
import { meRankingInfoCss } from "../css/modules";
import AjaxCompleteHook from "../SingletonModules/AjaxCompleteHook";
import runTimingHandler from "../runTimingHandler";

export default class MERankingInfo extends HHModule {
  readonly configSchema = {
    baseKey: "meRankingInfo",
    label: "ME : Adds info about rankings in seasonal event",
    default: true,
  };
  heroData: MERankingHeroData | null = null;
  leaderboardData: Array<MERankingLeaderboardEntryIncomplete> | null = null;
  static shouldRun_() {
    return location.pathname.includes("seasonal.html");
  }
  run() {
    if (this._hasRun || !MERankingInfo.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    this._injectCSS();
    this._hookAjaxRequest();
  }
  private async _injectCSS() {
    GM_addStyle(meRankingInfoCss);
  }
  private _hookAjaxRequest() {
    AjaxCompleteHook.getInstance_().addCallback_((_event, xhr, settings) => {
      if (settings?.data === "action=leaderboard&feature=seasonal_event_top") {
        this.heroData = xhr.responseJSON?.hero_data;
        this.leaderboardData = xhr.responseJSON?.leaderboard;
        this._hookSpecialHeroRow();
      }
    });
  }

  private _hookSpecialHeroRow() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_("#leaderboard_holder > #outer-hero-row", () => {
      console.log("found special hero row");
      const rankingInfoTooltip = this._createTooltipTableRankingContent();
      const $rankingInfo = $(
        `<img class="me-leaderboard-info" src="https://hh.hh-content.com/leagues/ic_rankup.png" tooltip></img>`,
      );
      $rankingInfo.attr("hh_title", rankingInfoTooltip);
      $("#leaderboard_holder > #outer-hero-row").append($rankingInfo);
    });
  }

  private _createTooltipTableRankingContent(): string {
    if (!this.heroData || !this.leaderboardData) {
      return "";
    }

    const rankThresholds = [10, 50, 100, 250, 500, 1000];
    const currentRank = this.heroData.rank;
    const currentPotions = this.heroData.potions;

    // Build tooltip content as a table
    let tooltipContent =
      `<div class="me-ranking-tooltip">` +
      `<table style="border-collapse: collapse; width: 100%;">` +
      `<thead><tr>` +
      `<th>Rank</th>` +
      `<th>Resource</th>` +
      `<th>Difference</th>` +
      `</tr></thead><tbody>`;

    const playerEntry = this.leaderboardData.find((entry) => entry.rank === currentRank);

    rankThresholds.forEach((threshold) => {
      // Find the leaderboard entry at this rank
      const leaderboardEntry = this.leaderboardData!.find((entry) => entry.rank === threshold);

      const potionsAtRank = leaderboardEntry?.potions ?? "?";
      let diffText = "?";
      let diffColor = "black";
      if (leaderboardEntry) {
        const potionDiff = currentPotions - leaderboardEntry.potions;
        if (potionDiff === 0) {
          const heroId = playerEntry ? playerEntry.id_member : Infinity;
          const entryId = leaderboardEntry.id_member;
          if (heroId < entryId) {
            diffText = "+0 (above)";
            diffColor = "green";
          } else if (heroId > entryId) {
            diffText = "+0 (below)";
            diffColor = "red";
          } else {
            diffText = "= (tie)";
            diffColor = "orange";
          }
        } else {
          diffText = potionDiff > 0 ? `+${potionDiff}` : `${potionDiff}`;
          diffColor = potionDiff > 0 ? "green" : "red";
        }
      }

      tooltipContent +=
        `<tr>` +
        `<td>${threshold}</td>` +
        `<td>${potionsAtRank}</td>` +
        `<td style="color: ${diffColor}; font-weight: bold;">${diffText}</td>` +
        `</tr>`;
    });

    tooltipContent += `</tbody></table></div>`;
    return tooltipContent;
  }
}
