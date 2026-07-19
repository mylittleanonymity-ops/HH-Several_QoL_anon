import { GameKey, popupForQueue } from "../types";
import html from "./html";

export default class GameHelpers {
  static createPopup_(
    type: popupForQueue["popup"]["type"],
    popupID: string,
    content: JQuery<HTMLElement> | string,
    title?: string,
  ) {
    switch (type) {
      case "common":
        this.createCommonPopup_(popupID, (popup, _t) => {
          const $container = popup.$dom_element.find(".container-special-bg");
          if (title) {
            $container.append(html`<div class="title">${title}</div>`);
          }
          $container.append(content);
        });
        break;
      default:
        throw `type ${type} not implemented yet`;
    }
  }

  static createCommonPopup_(
    popupID: string,
    Finit: (popup: popupForQueue["popup"], t: boolean) => void,
  ) {
    const generatePopupDOM = $(html`
      <div class="popup_wrapper">
        <div class="popup_background clickable"></div>
        <div class="popup several-qol-popup" id="popup-${popupID}">
          <div class="container-special-bg" id="container-${popupID}"></div>
          <close class="closable"></close>
        </div>
      </div>
    `);
    let generatedPopup: popupForQueue["popup"] = {
      init: function (t: boolean) {
        $(`#common-popups`).prepend(this.$dom_element); // has to append to it ourselves
        Finit(this, t);
      },
      popup_name: "several_qol_common_popup",
      type: "common",
      $dom_element: generatePopupDOM,
      close_on_esc: true,
      addEventListeners: function () {
        this.$dom_element.find("close, .popup_background").on("click", () => {
          this.destroy();
        });
      },
      removeEventListeners() {},
      onOpen() {
        $("#common-popups").append(this.$dom_element);
      },
      onClose() {},
      destroy: function () {
        shared.PopupQueueManager.close({
          type: this.type,
        });
      },
    };
    shared.PopupQueueManager.add({ popup: generatedPopup });
    return generatedPopup;
  }

  static getWikiPageForCurrentGame(name: string): string | undefined {
    name = name.replace(/ /g, "-");
    const formattedName = name.replace(/[^a-zA-Z0-9\-]/g, "");
    if (location.host.includes("heroes.com")) {
      return `https://harem-battle.club/wiki/Harem-Heroes/HH:${formattedName}`;
    } else if (location.host.includes("gayharem")) {
      return `https://harem-battle.club/wiki/Gay-Harem/GH:${formattedName}`;
    } else if (location.host.includes("gaypornstarharem")) {
      return `https://harem-battle.club/wiki/Gay-Pornstar-Harem/GPSH:${formattedName}`;
    }
    return undefined;
  }

  static getGameKey(): GameKey {
    const host = window.location.host;
    if (host.includes(".gayharem.com")) {
      return "GH";
    }
    if (host.includes(".comixharem.com")) {
      return "CxH";
    }
    if (host.includes(".pornstarharem.com")) {
      return "PSH";
    }
    if (host.includes(".gaypornstarharem.com")) {
      return "GPSH";
    }
    if (host.includes(".transpornstarharem.com")) {
      return "TPSH";
    }
    return "HH";
  }

  static buildGirlIconPathFromHash_(id_girl: number, iconHash?: string, fallback?: string): string {
    const hashHex = this._hexFromHash_(iconHash);
    if (hashHex) {
      return `${IMAGES_URL}/pictures/gallery/77/300x/${id_girl}-${hashHex}.png`;
    }
    return fallback ?? `${IMAGES_URL}/pictures/girls/${id_girl}/ava0.png`;
  }

  static buildGirlPosePathFromHash_(id_girl: number, poseHash?: string, fallback?: string): string {
    const hashHex = this._hexFromHash_(poseHash);
    if (hashHex) {
      return `${IMAGES_URL}/pictures/gallery/70/1200x/${id_girl}-${hashHex}.png`;
    }
    return fallback ?? `${IMAGES_URL}/pictures/girls/${id_girl}/ava0.png`;
  }

  private static _hexFromHash_(hash?: string): string | undefined {
    if (!hash) return undefined;
    if (hash.indexOf("/") !== -1) return undefined;

    if (/^[a-fA-F0-9]+$/.test(hash) && hash.length % 2 === 0) {
      return hash.toLowerCase();
    }

    try {
      return this._base64UrlToHex_(hash);
    } catch (_error) {
      return undefined;
    }
  }

  private static _parseGalleryUrl_(url?: string): { id_girl: number; hashHex: string } | undefined {
    if (!url) return undefined;

    const match = url.match(/\/pictures\/gallery\/\d+\/[^/]+\/(\d+)-([a-fA-F0-9]+)\.png/);
    if (!match) return undefined;

    return {
      id_girl: Number(match[1]),
      hashHex: match[2].toLowerCase(),
    };
  }

  private static _base64UrlToHex_(base64url: string): string {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const paddedBase64 = base64 + "=".repeat(padLen);
    const binary = atob(paddedBase64);
    let hex = "";
    for (let i = 0; i < binary.length; i++) {
      const hexByte = binary.charCodeAt(i).toString(16);
      hex += hexByte.length === 1 ? "0" + hexByte : hexByte;
    }
    return hex;
  }

  /**
   * This is not fullproof since the shown value is rounded beforehand
   * @param shownMoney 4digits max
   * @returns
   */
  static convertShownMoneyToNumber(shownMoney: string): number {
    // Tests have been run to ensure it works
    const trimmed = shownMoney.trim();
    if (!trimmed) return 0;

    const suffixMatch = trimmed.match(/([kKmMgGtTpPeEzZyY])$/);
    const multiplierMap: Record<string, number> = {
      k: 1e3,
      m: 1e6,
      g: 1e9,
      t: 1e12,
      p: 1e15,
      e: 1e18,
      z: 1e21,
      y: 1e24,
    };

    const suffix = suffixMatch?.[1]?.toLowerCase();
    const multiplier = suffix ? (multiplierMap[suffix] ?? 1) : 1;
    const numberPortion = suffix ? trimmed.slice(0, -1) : trimmed;

    const parseReducedNumber = (value: string): number => {
      const clean = value.replace(/\s/g, "");
      // number_reduce uses commas as thousands separators and dots as decimals.
      // Find the last dot or comma to determine decimal separator
      const lastDotIndex = clean.lastIndexOf(".");
      const lastCommaIndex = clean.lastIndexOf(",");

      // Determine which is the decimal separator (the rightmost one)
      let decimalSeparator = "";

      if (lastDotIndex > lastCommaIndex) {
        decimalSeparator = ".";
      } else if (lastCommaIndex > lastDotIndex) {
        decimalSeparator = ",";
      }

      // Remove all thousands separators (the other one)
      let normalized = clean;
      if (decimalSeparator === ".") {
        normalized = normalized.replace(/,/g, ""); // Remove commas as thousands separators
      } else if (decimalSeparator === ",") {
        normalized = normalized.replace(/\./g, ""); // Remove dots as thousands separators
        normalized = normalized.replace(/,/g, "."); // Convert comma decimal to dot for parsing
      }

      return Number.parseFloat(normalized || "0");
    };

    const baseValue = parseReducedNumber(numberPortion);
    if (!Number.isFinite(baseValue)) return 0;
    return baseValue * multiplier;
  }
}
