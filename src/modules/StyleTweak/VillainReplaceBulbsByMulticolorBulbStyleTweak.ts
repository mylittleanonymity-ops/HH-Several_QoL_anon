import type { VillainPreBattle } from "../../types";
import html from "../../utils/html";
import { VillainReplaceBulbsByMulticolorBulbStyleTweakCss } from "../../css/modules";
import { SubModule } from "../../base";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";
import runTimingHandler from "../../runTimingHandler";

export default class VillainReplaceBulbsByMulticolorBulbStyleTweak implements SubModule {
  async run_() {
    this._injectCSS();
    await runTimingHandler.afterGameScriptsRun_();
    console.log("VillainReplaceBulbsByMulticolorBulb module running");
    const opponentFighter = unsafeWindow.opponent_fighter as VillainPreBattle | undefined;
    if (!opponentFighter) {
      return;
    }
    if (opponentFighter.rewards.data.rewards.find((reward) => reward.type === "scrolls_common")) {
      HHPlusPlusReplacer.doWhenSelectorAvailable_(
        ".slot.size_small[class*='slot_scrolls_']",
        ($el) => {
          const multicolorBulbHtml = html`<div
            class="slot slot_scrolls_mythic size_small"
            tooltip="1 bulb of a random rarity"
          >
            <span class="scrolls_multicolor_icn"></span>
            <div class="amount">1</div>
          </div>`;
          $el.first().replaceWith(multicolorBulbHtml);
          $el.slice(1).remove();
        },
      );
    }
  }
  private async _injectCSS() {
    GM_addStyle(VillainReplaceBulbsByMulticolorBulbStyleTweakCss);
  }
}
