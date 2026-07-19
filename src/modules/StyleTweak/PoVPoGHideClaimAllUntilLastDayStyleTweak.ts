import { SubModule } from "../../base";
import { povPoGHideClaimAllUntilLastDayStyleTweakCss } from "../../css/modules";
import runTimingHandler from "../../runTimingHandler";

export default class PoVPoGHideClaimAllUntilLastDayStyleTweak implements SubModule {
  async run_() {
    await runTimingHandler.afterGameScriptsRun_();
    const timeRemaining: number | undefined = unsafeWindow.time_remaining;
    if (timeRemaining === undefined) {
      return;
    }
    // 23.5 hours contests Unlock
    if (timeRemaining > 23.5 * 60 * 60) {
      this._injectCSS();
      console.log("PoVPoGHideClaimAllUntilLastDay module running");
    }
  }
  private async _injectCSS() {
    GM_addStyle(povPoGHideClaimAllUntilLastDayStyleTweakCss);
  }
}
