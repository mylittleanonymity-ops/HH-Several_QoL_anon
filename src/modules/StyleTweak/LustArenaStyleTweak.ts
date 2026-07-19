import { SubModule } from "../../base";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";
import { LustArenaStyleTweakCss } from "../../css/modules";
import html from "../../utils/html";
import { PlayerStorageHandler } from "../../utils/StorageHandler";
import runTimingHandler from "../../runTimingHandler";

export default class LustArenaStyleTweak implements SubModule {
  private readonly _blinkTimeThreshold = 60 * 60 * 24 - 60 * 30; // 23hours 30min
  private readonly _rgbEasterEggChance = 1000; // 1 in 1000 chance

  /**
   * Returns the appropriate class for the timeout warning.
   * Has a 1/1000 chance to return the RGB easter egg class instead of the normal blink.
   */
  private _getTimeoutWarningClass(): string {
    const isRgbMode = Math.floor(Math.random() * this._rgbEasterEggChance) === 0;
    return isRgbMode ? "several-qol-rgb-mode" : "several-qol-blink";
  }

  async run_() {
    await runTimingHandler.afterGameScriptsRun_();
    if (this._isInTutoLustArena()) {
      return;
    }
    this._injectCSS();
    HHPlusPlusReplacer.doWhenSelectorAvailable_('.main-container [rel="pvp-arena"]', ($el) => {
      const $MapContainer = $('.left-side-container [rel="map"] > .notif-position > span');
      const leftSideBgColor = $MapContainer.css("background-color");
      const leftSideColor = $MapContainer.children().css("color");
      GM_addStyle(
        `:root {--lust-arena-left-side-bg-color: ${leftSideBgColor};--lust-arena-left-side-color: ${leftSideColor};}`,
      );
      //wrap in a div to be able to target with css
      const $wrapper = $('<div class="lust-arena-style-tweak-wrapper"></div>');
      $el.replaceWith($wrapper);
      console.log("LustArenaStyleTweak: injecting league and season info", $wrapper);
      const leagueInfo = PlayerStorageHandler.getPlayerLeagueRank_();
      const $leaguesA = $(
        html`<a href="${shared.general.getDocumentHref("/leagues.html")}" rel="leagues">
          <img
            src="${IMAGES_URL}/pictures/design/leagues/${leagueInfo.league}.png"
            alt="Leagues Icon"
          />
          <p>#${leagueInfo.rank}</p>
        </a>`,
      );
      $wrapper.append($leaguesA);

      // Create right section with 2 rows
      const $rightSection = $('<div class="lust-arena-right-section"></div>');

      const seasonInfo = PlayerStorageHandler.getPlayerSeasonInfo_();
      const seasonEndsAt = seasonInfo?.endsAt || server_now_ts + this._blinkTimeThreshold + 1;
      const seasonNeedsWarning = seasonEndsAt - server_now_ts < this._blinkTimeThreshold;
      const $seasonA = $(
        html`<a
          href="${shared.general.getDocumentHref("/season.html")}"
          rel="season"
          class="${seasonNeedsWarning ? this._getTimeoutWarningClass() : ""}"
        >
          <p>${GT.design.Season}</p>
        </a>`,
      );
      if (seasonInfo) {
        $seasonA.attr(
          "tooltip",
          this._generateProgressBarTooltip(
            seasonInfo.tier,
            seasonInfo.mojo,
            seasonInfo.previousTierThreshold,
            seasonInfo.name ?? GT.design.Season,
            seasonInfo.nextTierThreshold,
            IMAGES_URL + "/mojo_logo.svg",
          ),
        );
      }
      // font-size for season will be computed after elements are in DOM
      $rightSection.append($seasonA);

      const pentaDrillInfo = PlayerStorageHandler.getPlayerPentaDrillInfo_();
      const pentaDrillEndsAt =
        pentaDrillInfo?.endsAt || server_now_ts + this._blinkTimeThreshold + 1;
      const pentaDrillNeedsWarning = pentaDrillEndsAt - server_now_ts < this._blinkTimeThreshold;
      const $pentaDrillA = $(
        html`<a
          href="${shared.general.getDocumentHref("/penta-drill.html")}"
          rel="penta-drill"
          class="${pentaDrillNeedsWarning ? this._getTimeoutWarningClass() : ""}"
        >
          <p>${GT.design.penta_drill}</p>
        </a>`,
      );
      if (pentaDrillInfo) {
        $pentaDrillA.attr(
          "tooltip",
          this._generateProgressBarTooltip(
            pentaDrillInfo.tier,
            pentaDrillInfo.potions,
            pentaDrillInfo.previousTierThreshold,
            GT.design.penta_drill,
            pentaDrillInfo.nextTierThreshold,
            "https://raw.githubusercontent.com/infarcactus-HH/HH-Several_QoL/refs/heads/main/images/PDPoints.png",
            13,
          ),
        );
      }
      $rightSection.append($pentaDrillA);

      $wrapper.append($rightSection);

      const numericWidthSeason = $seasonA.width() ?? 0; // returns number (px)
      const lengthSeason = GT.design.Season.length;
      $seasonA
        .find("p")
        .css(
          "font-size",
          `clamp(11px, calc(${numericWidthSeason}px / ${lengthSeason} * 1.75), 14px)`,
        );

      const numericWidthPenta = $pentaDrillA.width() ?? 0;
      const lengthPentaDrill = GT.design.penta_drill.length;
      $pentaDrillA.find("p").css({
        "font-size": `clamp(9px, calc(${numericWidthPenta}px / ${lengthPentaDrill} * 1.6), 14px)`,
      });
    });
  }
  private async _injectCSS() {
    GM_addStyle(LustArenaStyleTweakCss);
  }
  private _generateProgressBarTooltip(
    tier: number,
    currentAmount: number,
    currentTier: number,
    name: string,
    nextTier?: number,
    imageUrl?: string,
    imagesize?: number,
  ): string {
    const colors = this._getColors();
    let progressPercent: number;
    if (nextTier === undefined) {
      // Max tier reached
      progressPercent = 100;
    } else {
      const tierRange = nextTier - currentTier;
      const amountInTier = currentAmount - currentTier;
      progressPercent = Math.min(100, Math.max(0, (amountInTier / tierRange) * 100));
    }
    const progressDisplay =
      nextTier !== undefined ? `${currentAmount} / ${nextTier}` : `${currentAmount} (Max)`;

    const mojoContent = imageUrl
      ? `${progressDisplay}<img src="${imageUrl}" alt="mojo" class="progressbar-tooltip-mojo-icon" style="${
          imagesize ? `height: ${imagesize}px; width: auto;` : ""
        }"/>`
      : progressDisplay;

    return html`<div class="progressbar-tooltip">
      <div class="progressbar-tooltip-name">${name}</div>
      <div class="progressbar-tooltip-tier-row">
        <span class="progressbar-tooltip-tier" style="color: ${colors.tier}">
          ${GT.design.tier} ${tier}
        </span>
        <span class="progressbar-tooltip-mojo">${mojoContent}</span>
      </div>
      <div class="progressbar-tooltip-bar-container">
        <div
          class="progressbar-tooltip-bar-fill"
          style="width: ${progressPercent}%; background-image: ${colors.barGradient};"
        />
      </div>
    </div>`;
  }

  private _getColors(): { barGradient: string; tier: string } {
    const $barDummy = $(
      html`<div class="progress-section">
        <div class="general-progress-bar">
          <div class="progress-bar-fill" />
        </div>
      </div>`,
    );
    $barDummy.appendTo("#contains_all");
    const barGradient = $barDummy.find(".progress-bar-fill").css("background-image");
    $barDummy.remove();

    const $tabDummy = $(
      html`<div class="tabs-switcher">
        <div class="switch-tab" />
      </div>`,
    );
    $tabDummy.appendTo("#contains_all");
    const tier = $tabDummy.find(".switch-tab").css("color");
    $tabDummy.remove();

    return { barGradient, tier };
  }
  private _isInTutoLustArena(): boolean {
    if (tutoFeatures.season && !tutoData.home4_1) {
      return true;
    }
    if (tutoFeatures.leagues && !tutoData.home6_1) {
      return true;
    }
    return false;
  }
}
