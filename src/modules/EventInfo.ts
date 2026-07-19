import { HHModule } from "../base";
import runTimingHandler from "../runTimingHandler";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";
import EventInfo_Event from "./EventInfo/EventInfo_Event";
import EventInfo_Home from "./EventInfo/EventInfo_Home";
import EventInfo_Pathes from "./EventInfo/EventInfo_Pathes";
import EventInfo_Seasonal from "./EventInfo/EventInfo_Seasonal";

export default class EventInfo extends HHModule {
  readonly configSchema = {
    baseKey: "eventInfo",
    label:
      "<span tooltip='Click on the Information top right of events'>Event Info : Show guides, tips, tricks & more info on events</span>",
    default: true,
  };
  static shouldRun_() {
    return (
      location.pathname === "/event.html" ||
      location.pathname === "/home.html" ||
      location.pathname === "/path-of-glory.html" ||
      location.pathname === "/path-of-valor.html" ||
      location.pathname === "/seasonal.html" ||
      location.pathname === "/world-boss-event" ||
      location.pathname === "/season.html" ||
      location.pathname === "/love-raids.html"
    );
  }
  async run() {
    if (this._hasRun || !EventInfo.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();

    const path = location.pathname;

    console.log("EventInfo module running on path:", path);

    switch (path) {
      case "/home.html":
        this._runHome();
        break;
      case "/event.html":
        this._runEvent();
        break;
      case "/path-of-glory.html":
      case "/path-of-valor.html":
        this._runPathes();
        break;
      case "/seasonal.html": // Mega Event
        this._runSeasonal();
        break;
      case "/season.html":
        this._runSeason();
        break;
      case "/love-raids.html":
        this._runLoveRaids();
        break;
    }
  }
  private _runHome() {
    new EventInfo_Home().run_();
  }
  private _runEvent() {
    new EventInfo_Event().run_();
  }
  private _runPathes() {
    new EventInfo_Pathes().run_();
  }
  private _runSeasonal() {
    new EventInfo_Seasonal().run_();
  }
  private _runSeason() {
    this._helperReplaceNotifButton(
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-310674",
    );
  }
  private _runLoveRaids() {
    this._helperReplaceNotifButton(
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-316577",
    );
  }

  private _helperReplaceNotifButton(url: string) {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      ".button-notification-action.notif_button_s",
      () => {
        console.log("EventInfo: Replacing notif button link for more info");
        $(".button-notification-action.notif_button_s")
          .attr("tooltip", "Several QoL: More Info on this event")
          .off("click")
          .on("click", () => {
            GM_openInTab(url, { active: true });
          });
      },
    );
  }
}
