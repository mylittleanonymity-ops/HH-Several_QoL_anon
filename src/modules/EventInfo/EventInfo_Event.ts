import { SubModule } from "../../base";
import type { sm_event_dataIncomplete } from "../../types";
import GameHelpers from "../../utils/GameHelpers";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";
import { EventInfoStorageHandler } from "../../utils/StorageHandler";
import { eventInfoEventCss } from "../../css/modules";

type EventInfo_EventsList =
  | "dp_event" // Double Pen
  | "cumback_contest"
  | "sm_event" // SM
  // | "event" // Org Days, Classic Event
  | "legendary_contest"
  | "mythic_event"
  | "path_event" // Path of Renaissance
  | "crazy_cumback_contest"
  | "lively_scene_event"
  | "dpg_event"; // double date

type WeirdKKShitEvent = "classic_event" | "org_days";

export default class EventInfo_Event implements SubModule {
  private readonly _EventInfoLinks: Record<EventInfo_EventsList | WeirdKKShitEvent, string> = {
    dp_event:
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-304655",
    sm_event:
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-309998",
    cumback_contest:
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-304660",
    org_days:
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-304653",
    legendary_contest:
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-304657",
    mythic_event:
      "https://forum.kinkoid.com/index.php?/topic/23259-everything-about-mythic-days-revival/",
    path_event:
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-304650",
    crazy_cumback_contest:
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-304661",
    classic_event:
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-304648",
    lively_scene_event:
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-304656",
    dpg_event:
      "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-309997",
  };
  run_() {
    const eventInSearchParams = new URLSearchParams(location.search).get("tab");
    const eventType = eventInSearchParams?.replace(/_\d+$/, "");
    this._injectCSS();
    this._whichEventToCall(eventType as EventInfo_EventsList | undefined);
  }
  private async _injectCSS() {
    GM_addStyle(eventInfoEventCss);
  }

  private _helperCreateNotifButton(event: EventInfo_EventsList | WeirdKKShitEvent) {
    const $notifButton = $(
      `<div class="button-notification-action notif_button_s sm-event-info-button" tooltip="Several QoL: More Info on this event"></div>`,
    );
    HHPlusPlusReplacer.doWhenSelectorAvailable_(".nc-panel-header .nc-pull-right", () => {
      $(".nc-panel-header .nc-pull-right").prepend($notifButton);
    });
    $notifButton.off("click").on("click", () => {
      GM_openInTab(this._EventInfoLinks[event], { active: true });
    });
    return $notifButton;
  }
  private _helperReplaceNotifButton(
    event: EventInfo_EventsList | WeirdKKShitEvent,
    stopPropagation = false,
  ) {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      ".nc-pull-right > .button-notification-action",
      () => {
        $(".nc-pull-right > .button-notification-action")
          .attr("tooltip", "Several QoL: More Info on this event")
          .off("click")
          .on("click", (e) => {
            if (stopPropagation) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
            }
            GM_openInTab(this._EventInfoLinks[event], { active: true });
          });
      },
    );
  }
  private _whichEventToCall(eventType: EventInfo_EventsList | "event" | undefined) {
    if (!eventType) {
      return;
    }
    switch (eventType) {
      case "cumback_contest":
      case "legendary_contest":
      case "path_event":
      case "crazy_cumback_contest":
      case "lively_scene_event":
      case "dpg_event":
        this._helperCreateNotifButton(eventType);
        return;
      case "mythic_event":
        this._mythic_eventRun();
        return;
      case "dp_event":
        this._dp_eventRun();
        return;
      case "sm_event":
        this._sm_eventRun();
        return;
      case "event":
        this._event_Run();
      default:
        return; // not yet implemented or nothing to display
    }
  }
  private _event_Run() {
    console.log(unsafeWindow.event_data);
    if (unsafeWindow.event_data && unsafeWindow.event_data.subtype === "classic") {
      this._helperCreateNotifButton("classic_event");
    } else {
      this._helperCreateNotifButton("org_days");
    }
  }
  private _mythic_eventRun() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      ".nc-pull-right > .button-notification-action",
      () => {
        $(".nc-pull-right > .button-notification-action").removeClass("js-mythic-help-open-button");
        this._helperReplaceNotifButton("mythic_event");
      },
    );
  }
  private _dp_eventRun() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      ".button-notification-action.notif_button_s",
      () => {
        $(".button-notification-action.notif_button_s")
          .attr("tooltip", "Several QoL: More Info on this event")
          .off("click")
          .on("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            GameHelpers.createCommonPopup_("event_info", (popup, _t) => {
              popup.$dom_element
                .find(".container-special-bg")
                .append(
                  `<div class="banner">Several QoL - Event Info - DP</div>` +
                    `<div class="event-content dp_event"><span>` +
                    `Before going\n into more details read <a target="_blank" href="${this._EventInfoLinks["dp_event"]}"><strong>this</strong></a> guide made by bolitho` +
                    `<br><br>There are important things to note for this event:<br>` +
                    `First there are some missions that are not in the daily missions list that can appear on easy & hard side :<br>` +
                    `- Claim chest n°X on daily missions (you cannot land on a chest you already claimed)<br>` +
                    `- Claim X number of PoP<br>` +
                    `- Gain PoV potions<br>` +
                    `- Get shards<br>` +
                    `- Score points in contests<br>` +
                    `<br>` +
                    `There's one that's <strong>really annoying</strong> that can only appear on the hard side:<br>` +
                    `- Restock the Market<br>` +
                    `<br>` +
                    `One info not given is that a challenge cannot be the same on both easy & hard side as such try to lock an annoying mission on the hard side before you get stuck with "Restock the Market"` +
                    `</span></div>`,
                );
            });
          });
      },
    );
  }
  private _sm_eventRun() {
    this._helperReplaceNotifButton("sm_event");
    const sm_event_data = unsafeWindow.sm_event_data as sm_event_dataIncomplete;
    // base game function
    const t = shared.timer.buildTimer(
      sm_event_data.seconds_until_event_end,
      GT.design.event_ends_in,
      "event-timer nc-expiration-label",
      !1,
    );
    $(".nc-pull-right").append(t);
    shared.timer.activateTimers("event-timer.nc-expiration-label");
    // end base game function
    $("#sultry-mysteries-tabs > #shop_tab").on("click.SeveralQoLEventInfo", function () {
      $(this).off("click.SeveralQoLEventInfo");
      HHPlusPlusReplacer.doWhenSelectorAvailable_(".shop-timer.timer", () => {
        const shopRefreshesIn = $(".shop-timer.timer").attr("data-time-stamp");
        if (!shopRefreshesIn || isNaN(Number(shopRefreshesIn))) {
          return;
        }
        const timeShopRefreshesIn = Number(shopRefreshesIn) + Math.floor(Date.now() / 1000);
        EventInfoStorageHandler.setSMShopRefreshTimeComparedToServerTS_(timeShopRefreshesIn);
      });
    });
    const storedSMShopRefreshTime =
      EventInfoStorageHandler.getSMShopRefreshTimeComparedToServerTS_();
    if (storedSMShopRefreshTime > server_now_ts) {
      const t = shared.timer.buildTimer(
        storedSMShopRefreshTime - server_now_ts,
        "",
        "severalQoL-event-shop-timer nc-expiration-label",
        !1,
      );
      $("#sultry-mysteries-tabs > #shop_tab").append(t);
      shared.timer.activateTimers("severalQoL-event-shop-timer.nc-expiration-label");
    }
  }
}
