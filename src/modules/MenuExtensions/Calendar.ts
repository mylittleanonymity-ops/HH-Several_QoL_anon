import { SubModule } from "../../base";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";
import html from "../../utils/html";
import GameHelpers from "../../utils/GameHelpers";
import { calendarCss } from "../../css/modules";

export default class Calendar implements SubModule {
  run_() {
    this._injectCSS();
    this._addCalendarOption();
  }

  private async _injectCSS() {
    GM_addStyle(calendarCss);
  }

  private _addCalendarOption() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      "#contains_all > nav > [rel='content'] > div",
      ($navDiv) => {
        const calendarURL = `https://raw.githubusercontent.com/infarcactus-HH/HH-Several_QoL/refs/heads/main/images/calendar/${GameHelpers.getGameKey()}.jpg`;

        const $calendarMenuItem = $(
          html`<a>
            <div><ic class="calendar"></ic><span>Calendar</span></div>
          </a>`,
        );
        $navDiv.prepend($calendarMenuItem);

        const $calendarPopup = $(html`<img src="${calendarURL}" alt="calendar" />`);
        $calendarMenuItem.on("click", function () {
          GameHelpers.createPopup_("common", "calendar-qol", $calendarPopup, "Calendar");
        });
      },
    );
  }
}
