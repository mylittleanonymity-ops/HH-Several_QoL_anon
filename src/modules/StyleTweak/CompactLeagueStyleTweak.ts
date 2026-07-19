import { SubModule } from "../../base";
import { CompactLeagueStyleTweakCss } from "../../css/modules";
import runTimingHandler from "../../runTimingHandler";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";

export default class CompactLeagueStyleTweak implements SubModule {
  async run_() {
    await runTimingHandler.afterThirdPartyScriptsRun_(); // weirdly can't inject the css too early or it breaks other scripts
    this._injectCSS();
    HHPlusPlusReplacer.doWhenSelectorAvailable_(".league_table > .data-list", ($el) => {
      new MutationObserver(() => {
        $el.parent()[0].scrollTo({ top: 0, behavior: "instant" });
      }).observe($el[0], { childList: true });
    });
  }
  private async _injectCSS() {
    GM_addStyle(CompactLeagueStyleTweakCss);
  }
}
