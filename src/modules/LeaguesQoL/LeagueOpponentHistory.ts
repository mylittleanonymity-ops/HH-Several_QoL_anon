import { SubModule } from "../../base";
import type { league_player_record, LeagueOpponentIncomplete } from "../../types";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";
import { LeagueStorageHandler } from "../../utils/StorageHandler";
import { leagueOpponentHistoryCss } from "../../css/modules";
import html from "../../utils/html";
import RequestQueueHandler from "../../SingletonModules/RequestQueueHandler";

declare const opponents_list: Array<LeagueOpponentIncomplete>;
declare const season_end_at: number;
declare const league_rewards: any; // don't care about the type

export default class LeagueOpponentHistory implements SubModule {
  leaguePlayerRecord: league_player_record | undefined;
  updatedPlayerRecordsThisSession: Set<number> = new Set();

  run_() {
    this._injectCSS();
    this.leaguePlayerRecord = LeagueStorageHandler.getLeaguePlayerRecord_();
    HHPlusPlusReplacer.doWhenSelectorAvailable_(".league_table > .data-list", ($el) => {
      this._applyRankingsToOpponentLists();
      this._startObserverClickOnTable();
      this._applyRankingsToTable();
      new MutationObserver(() => {
        this._startObserverClickOnTable();
        this._applyRankingsToTable();
      }).observe($el[0], { childList: true });
    });
  }

  private async _injectCSS() {
    GM_addStyle(leagueOpponentHistoryCss);
  }
  private _applyRankingsToOpponentLists() {
    if (this.leaguePlayerRecord === undefined) {
      return;
    }
    opponents_list.forEach((opponent) => {
      const opponentId = opponent.player.id_fighter;
      const record = this.leaguePlayerRecord![opponentId];
      if (record) {
        opponent.Several_QoL = {
          checkExpiresAt: record.checkExpiresAt,
          bestPlace: record.bestPlace,
          timesReached: record.timesReached,
        };
      }
    });
  }
  private _startObserverClickOnTable() {
    const self = this;
    $(".league_table > .data-list > .body-row").on("click.SeveralQoL-OpponentHistory", function () {
      const place = parseInt($(this).children("[column='place']").text().trim());
      const selectedOpponent = opponents_list.find((opponents) => opponents.place === place);
      if (!selectedOpponent) {
        console.warn("Could not find opponent for place ", place);
        return;
      }
      if (
        selectedOpponent.Several_QoL &&
        selectedOpponent.Several_QoL.checkExpiresAt > server_now_ts
      ) {
        return;
      } else {
        console.log("Record expired or not found, fetching new data...");
      }
      if (self.updatedPlayerRecordsThisSession.has(selectedOpponent.player.id_fighter)) {
        return;
      }
      self._sendRequestAndAnalyzeOpponent(selectedOpponent.player.id_fighter, $(this));
    });
  }
  private _sendRequestAndAnalyzeOpponent(opponentId: number, $opponentRow: JQuery<HTMLElement>) {
    const payload = {
      action: "fetch_hero",
      id: "profile",
      preview: false,
      player_id: opponentId,
    };
    const highestLeague = Object.keys(league_rewards).length;
    const D3Placement = new RegExp(
      `<img src="https:\\/\\/.*?\\/pictures\\/design\\/leagues\\/${highestLeague}\\.png">\\n\\s*?<div class=\\"tier-stats\\">\\n\\s*?<div>Best place:\\s*<span>(\\d+)<sup>[^<]+<\\/sup><\\/span><\\/div>[\\s\\S]*?<div>Times reached: <span>(\\d+)<\\/span><\\/div>`,
      "g",
    );
    RequestQueueHandler.getInstance_().addAjaxRequest_<{ html: string; success: boolean }>(
      payload,
      (response) => {
        const match = D3Placement.exec(response.html);
        const bestPlace = match ? parseInt(match[1]) : -1;
        const timesReached = match ? parseInt(match[2]) : -1;
        this.updatedPlayerRecordsThisSession.add(opponentId);

        const newRecord = this._updateOpponentRecord(opponentId, bestPlace, timesReached);
        $opponentRow
          .children("[column='nickname']")
          .find(".several-qol-bestrank-timesreached")
          .remove();
        $opponentRow.children("[column='nickname']").append(this._generateRankHtml(newRecord));
      },
      RequestQueueHandler.PRIORITY_.LOW,
    );
  }
  private _updateOpponentRecord(
    opponentId: number,
    bestPlace: number,
    timesReached: number,
  ): league_player_record[number] {
    this.leaguePlayerRecord![opponentId] = {
      bestPlace: bestPlace,
      timesReached: timesReached,
      checkExpiresAt: server_now_ts + season_end_at + 10, // +10 to avoid edge cases
    };
    LeagueStorageHandler.setLeaguePLayerRecord_(this.leaguePlayerRecord!);
    return this.leaguePlayerRecord![opponentId];
  }
  private _applyRankingsToTable() {
    const allRows = $(".data-row.body-row");
    if (this.leaguePlayerRecord === undefined) {
      return;
    }
    allRows.each((_, row) => {
      const place = parseInt($(row).children("[column='place']").text().trim());
      if (!place) return;
      const opponent = opponents_list.find((opponents) => opponents.place === place);
      if (!opponent) return;
      const opponentId = opponent.player.id_fighter;
      const record = this.leaguePlayerRecord![opponentId];
      if (
        record &&
        !$(row).children("[column='nickname']").find(".several-qol-bestrank-timesreached").length
      ) {
        $(row).children("[column='nickname']").append(this._generateRankHtml(record));
      }
    });
  }
  private _generateRankHtml(record: league_player_record[number]): JQuery<HTMLElement> {
    const isOld = record.checkExpiresAt < server_now_ts;
    const $divBestRankTimesReached = $(
      html`<div
        class="several-qol-bestrank-timesreached ${isOld ? "old" : ""}"
        ${isOld ? "tooltip='Old record, click To refresh'" : ""}
      ></div>`,
    );
    if (record.bestPlace === -1 || record.timesReached === -1) {
      const unknownSpan = html`<span class="new-in-league">NEW</span>`;
      $divBestRankTimesReached.append(unknownSpan);
      return $divBestRankTimesReached;
    }
    const rankContainer = html`<span
      class="rank-container ${this._generateRankClass(record.bestPlace)}"
      >${record.bestPlace}</span
    >`;
    const timesReached = html`<span class="times-reached">x${record.timesReached}</span>`;
    $divBestRankTimesReached.prepend(rankContainer);
    $divBestRankTimesReached.append(timesReached);
    return $divBestRankTimesReached;
  }
  private _generateRankClass(bestPlace: number): string {
    if (bestPlace == 1) {
      return "several-qol-top1";
    } else if (bestPlace <= 4) {
      return "several-qol-top4";
    } else if (bestPlace <= 15) {
      return "several-qol-top15";
    } else if (bestPlace <= 30) {
      return "several-qol-top30";
    } else {
      return "several-qol-top30plus";
    }
  }
}
