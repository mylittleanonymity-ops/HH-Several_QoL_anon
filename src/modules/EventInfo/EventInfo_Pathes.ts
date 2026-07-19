import { SubModule } from "../../base";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";
import { EventInfoStorageHandler } from "../../utils/StorageHandler";
import { eventInfoEventCss } from "../../css/modules";

export default class EventInfo_Pathes implements SubModule {
  run_() {
    this._injectCSS();
    const timeRemaining = +(unsafeWindow.time_remaining as string);

    if (window.location.pathname === "/path-of-valor.html") {
      EventInfoStorageHandler.setPoVEndTimeComparedToServerTS_(server_now_ts + timeRemaining);
      this._replacePoVNotifButton();
    } else if (window.location.pathname === "/path-of-glory.html") {
      EventInfoStorageHandler.setPoGEndTimeComparedToServerTS_(server_now_ts + timeRemaining);
      this._replacePoGNotifButton();
    }
  }
  private async _injectCSS() {
    GM_addStyle(eventInfoEventCss);
  }
  private _replacePoVNotifButton() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      ".button-notification-action.notif_button_s",
      () => {
        $(".button-notification-action.notif_button_s")
          .attr("tooltip", "Several QoL: More Info on this event")
          .off("click")
          .on("click", (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            GM_openInTab(
              "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-310477",
              { active: true },
            );
          });
      },
    );
  }
  private _replacePoGNotifButton() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      ".button-notification-action.notif_button_s",
      () => {
        $(".button-notification-action.notif_button_s")
          .attr("tooltip", "Several QoL: More Info on this event")
          .off("click")
          .on("click", (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            GM_openInTab(
              "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-310673",
              { active: true },
            );
          });
      },
    );
  }
}
