import { AlwaysRunningModule } from "../base";
import { PlayerBadgesCss, PlayerBadges_TighterLeaderboards } from "../css/AlwaysRunningModules";
import runTimingHandler from "../runTimingHandler";
import { labyLeaderboardXHRResponse } from "../types";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";
import { BadgeConfig, Several_QoL_Badges } from "../utils/Several_QoL_Badges";

export default class PlayerBadges extends AlwaysRunningModule {
  static shouldRun_() {
    return [
      "/penta-drill.html",
      "/pantheon.html",
      "/season.html",
      "/labyrinth.html",
      "/path-of-valor.html",
      "/path-of-glory.html",
      "/activities.html",
      "/leagues.html",
    ].some((path) => location.pathname === path);
  }
  private _badgeConfigs: Array<BadgeConfig> = [];
  async run_() {
    if (this._hasRun || !PlayerBadges.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    this._injectCSS();
    await runTimingHandler.afterGameScriptsRun_();
    console.log("PlayerBadges module running");
    this._badgeConfigs = Several_QoL_Badges.getBadgeConfigurations_();
    if (this._badgeConfigs.length === 0) {
      return;
    }

    switch (location.pathname) {
      case "/activities.html":
        HHPlusPlusReplacer.doWhenSelectorAvailable_(".lead_table_view .leadTable > tr", ($el) => {
          this._addContestLeaderboardBadges($el);
        });
        break;
      case "/leagues.html":
        this._addLeagueBadges();
        break;
      default:
        this._hookAjaxComplete();
        break;
    }
  }
  private _addLeagueBadges() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(".league_table > .data-list", ($el) => {
      this._applyBadgesToLeagueRows($el);
      new MutationObserver(() => this._applyBadgesToLeagueRows($el)).observe($el[0], {
        childList: true,
      });
    });
  }

  private _applyBadgesToLeagueRows($el: JQuery<HTMLElement>) {
    $el.children(".body-row").each((_, el) => {
      const rowNickname = el.querySelector(".nickname");
      const playerId = rowNickname?.getAttribute("id-member");
      if (!playerId) return;

      this._badgeConfigs.forEach((config) => {
        if (config.userIds.includes(playerId)) {
          rowNickname?.after(this._generateBadgeElement(config.tooltip, config.cssClass));
        }
      });
    });
  }
  private _hookAjaxComplete() {
    $(document).ajaxComplete((_event, xhr, settings) => {
      if (!(typeof settings?.data === "string")) {
        return;
      }
      console.log("LeaderboardTweaks detected AJAX:", settings.data);
      if (settings.data.startsWith("action=labyrinth_leaderboard")) {
        HHPlusPlusReplacer.doWhenSelectorAvailable_(
          "#leaderboard_holder:has(#outer-hero-row) #leaderboard_list > .leaderboard_row",
          ($el) => {
            this._addLabyrinthLeaderboardBadges(
              $el,
              xhr.responseJSON! as labyLeaderboardXHRResponse,
            );
          },
        );
      } else if (settings.data === "action=leaderboard&feature=path_of_valor") {
        console.log("Detected Path of Valor leaderboard AJAX");
        HHPlusPlusReplacer.doWhenSelectorAvailable_(
          "#pov_leaderboard_tab_container #leaderboard_list > .leaderboard_row",
          ($el) => {
            this._addStandardLeaderboardBadges(
              $el,
              "#pov_leaderboard_tab_container #outer-hero-row .leaderboard-nickname-align",
            );
          },
        );
      } else if (settings.data === "action=leaderboard&feature=path_of_glory") {
        console.log("Detected Path of Glory leaderboard AJAX");
        HHPlusPlusReplacer.doWhenSelectorAvailable_(
          "#pog_leaderboard_tab_container #leaderboard_list > .leaderboard_row",
          ($el) => {
            this._addStandardLeaderboardBadges(
              $el,
              "#pog_leaderboard_tab_container #outer-hero-row .leaderboard-nickname-align",
            );
          },
        );
      } else if (settings.data.startsWith("action=leaderboard")) {
        console.log("Detected Standard leaderboard AJAX");
        HHPlusPlusReplacer.doWhenSelectorAvailable_(
          "#leaderboard_holder:has(.build-at-bottom) > #leaderboard_list > .leaderboard_row",
          ($el) => {
            this._addStandardLeaderboardBadges($el);
          },
        );
      }
    });
  }
  private _addLabyrinthLeaderboardBadges(
    $leaderboard_rowsListElement: JQuery<HTMLElement>,
    response: labyLeaderboardXHRResponse,
  ) {
    const currentPlayerId = response.hero_data?.id_member.toString();

    // Add badges to current player's row
    currentPlayerId &&
      this._badgeConfigs.forEach((config) => {
        if (config.userIds.includes(currentPlayerId)) {
          HHPlusPlusReplacer.doWhenSelectorAvailable_(
            "#outer-hero-row .leaderboard-nickname-align",
            ($el) => {
              $el.append(this._generateBadgeElement(config.tooltip, config.cssClass));
              console.log("Added badge to current player in labyrinth leaderboard");
            },
          );
        }
      });

    // For some strange reasons the elements no longer contain the sorting_id so we use the response data
    console.log($leaderboard_rowsListElement.length);
    $leaderboard_rowsListElement.each((index, el) => {
      const playerData = response.leaderboard[index];
      if (!playerData) return;
      const sortingId = playerData.id_member.toString();
      this._badgeConfigs.forEach((config) => {
        if (config.userIds.includes(sortingId)) {
          el.querySelector(".leaderboard-nickname-align")?.appendChild(
            this._generateBadgeElement(config.tooltip, config.cssClass),
          );
          console.log(`Added badge to player ${playerData.nickname} in labyrinth leaderboard`, el);
        }
      });
      $(el).on("click", () => {
        shared.general.hero_page_popup({ id: playerData.id_member });
      });
    });
  }
  private _addStandardLeaderboardBadges(
    $leaderboard_rowsListElement: JQuery<HTMLElement>,
    customHeroSelector?: string,
  ) {
    const currentPlayerId = shared.Hero.infos.id.toString();

    // Add badges to current player's row
    this._badgeConfigs.forEach((config) => {
      if (config.userIds.includes(currentPlayerId)) {
        document
          .querySelector(customHeroSelector ?? "#outer-hero-row .leaderboard-nickname-align")
          ?.appendChild(this._generateBadgeElement(config.tooltip, config.cssClass));
      }
    });

    // Add badges to other players' rows
    $leaderboard_rowsListElement.each((_, el) => {
      const sortingId = el.getAttribute("sorting_id");
      if (!sortingId) return;

      this._badgeConfigs.forEach((config) => {
        if (config.userIds.includes(sortingId)) {
          el.querySelector(".leaderboard-nickname-align")?.appendChild(
            this._generateBadgeElement(config.tooltip, config.cssClass),
          );
        }
      });
    });
  }
  private _addContestLeaderboardBadges($contestTablesEntries: JQuery<HTMLElement>) {
    $contestTablesEntries.each((_, entries) => {
      const userId = entries.getAttribute("sorting_id");
      if (!userId) return;

      this._badgeConfigs.forEach((config) => {
        if (config.userIds.includes(userId)) {
          entries.children[1].appendChild(
            this._generateBadgeElement(config.tooltip, config.cssClass),
          );
        }
      });
    });
  }
  private _generateBadgeElement(tooltipText: string, additionalClasses?: string): HTMLSpanElement {
    const badge = document.createElement("span");
    badge.className = `S_QoL-leaderboard-badge ${additionalClasses ?? ""}`;
    badge.setAttribute("tooltip", tooltipText);
    $(badge).on("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      event.stopImmediatePropagation();
      GM_openInTab("https://www.patreon.com/infarcactusHH", { active: true });
    });
    return badge;
  }
  private async _injectCSS() {
    GM_addStyle(PlayerBadgesCss);
    GM_addStyle(PlayerBadges_TighterLeaderboards);
  }
}
