import { HHModule, HHModule_ConfigSchema, SubSettingsType } from "../base";
import runTimingHandler from "../runTimingHandler";
import type { popupForQueue } from "../types";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";

type Popupminusminus_ConfigSchema = {
  baseKey: "popupMinusMinus";
  label: "Popup--";
  default: false;
  subSettings: [
    {
      key: "noAnnoyingReminders";
      default: true;
      label: "<span tooltip hh_title='Does not work inside nutaku frame if you have violentmonkey<br>Removes annoying popup appearing automatically for shops, paths, news'>No Annoying Reminders/Popups</span>";
    },
    {
      key: "noMissionPopup";
      default: true;
      label: "No Mission Popup";
    },
    {
      key: "noLevelUpPopup";
      default: false;
      label: "No Level Up Popup";
    },
    {
      key: "noPoVPoGClaimPopup";
      default: false;
      label: "<span tooltip='Does not remove girl obtained popup'>No PoV/PoG claim Popup</span>";
    },
    {
      key: "noMEClaimPopup";
      default: false;
      label: "<span tooltip='Does not remove girl obtained popup'>No ME Claim Popup</span>";
    },
    {
      key: "noPDClaimPopup";
      default: false;
      label: "<span tooltip='Does not remove girl obtained popup'>No PD Claim Popup</span>";
    },
  ];
};

export default class PopupMinusMinus extends HHModule {
  readonly configSchema: HHModule_ConfigSchema = {
    baseKey: "popupMinusMinus",
    label: "Popup--",
    default: false,
    subSettings: [
      {
        key: "noAnnoyingReminders",
        default: true,
        label:
          "<span tooltip hh_title='Does not work inside nutaku frame if you have violentmonkey<br>Removes annoying popup appearing automatically for shops, paths, news'>No Annoying Reminders/Popups</span>",
      },
      {
        key: "noMissionPopup",
        default: true,
        label: "No Mission Popup",
      },
      {
        key: "noLevelUpPopup",
        default: false,
        label: "No Level Up Popup",
      },
      {
        key: "noPoVPoGClaimPopup",
        default: false,
        label: "<span tooltip='Does not remove girl obtained popup'>No PoV/PoG claim Popup</span>",
      },
      {
        key: "noMEClaimPopup",
        default: false,
        label: "<span tooltip='Does not remove girl obtained popup'>No ME Claim Popup</span>",
      },
      {
        key: "noPDClaimPopup",
        default: false,
        label: "<span tooltip='Does not remove girl obtained popup'>No PD Claim Popup</span>",
      },
    ],
  };
  static shouldRun_() {
    return true;
  }
  private _popupQueueManagerAddOverrides: Array<{
    fn: (t: popupForQueue["popup"]) => boolean;
    permanent: boolean;
  }> = [];
  private _reward_popupRewardHandlePopupOverrides: Array<{
    fn: (t: any) => boolean;
    permanent: boolean;
  }> = []; // carefull with this one
  async run(subSettings: SubSettingsType<Popupminusminus_ConfigSchema>) {
    if (this._hasRun || !PopupMinusMinus.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();
    this._overridePopups();

    if (subSettings.noLevelUpPopup) {
      this._noLevelUpPopup();
    }
    if (subSettings.noMissionPopup && location.pathname === "/activities.html") {
      this._noMissionPopup();
    }
    if (subSettings.noAnnoyingReminders) {
      this._noAnnoyingReminders();
    }
    if (
      subSettings.noPoVPoGClaimPopup &&
      ["/path-of-glory.html", "/path-of-valor.html"].includes(location.pathname)
    ) {
      this._noPoVPoGClaimPopup();
    }
    if (subSettings.noMEClaimPopup && location.pathname === "/seasonal.html") {
      this._noMEClaimPopup();
    }
    if (subSettings.noPDClaimPopup && location.pathname === "/penta-drill.html") {
      this._noPoVPoGClaimPopup();
    }
  }
  private _overridePopups() {
    const self = this;
    const originalPopupQueuManagerAdd = shared.PopupQueueManager.add;
    shared.PopupQueueManager.add = function ({ popup: t }) {
      for (let i = self._popupQueueManagerAddOverrides.length - 1; i >= 0; i--) {
        const overrideData = self._popupQueueManagerAddOverrides[i];
        const shouldBlock = overrideData.fn(t);
        if (shouldBlock) {
          console.log("Blocked popup by override", t);
          // Remove if no more usages left
          if (!overrideData.permanent) {
            self._popupQueueManagerAddOverrides.splice(i, 1);
          }
          return; // blocked by override
        }
      }
      return originalPopupQueuManagerAdd.call(this, { popup: t });
    };

    const originalRewardHandlePopup = shared.reward_popup.Reward.handlePopup;
    shared.reward_popup.Reward.handlePopup = function (t: any) {
      for (let i = self._reward_popupRewardHandlePopupOverrides.length - 1; i >= 0; i--) {
        const overrideData = self._reward_popupRewardHandlePopupOverrides[i];
        const shouldBlock = overrideData.fn(t);
        if (shouldBlock) {
          console.log("Blocked reward popup by override", t);
          // Remove if no more usages left
          if (!overrideData.permanent) {
            self._reward_popupRewardHandlePopupOverrides.splice(i, 1);
          }
          return; // blocked by override
        }
      }
      return originalRewardHandlePopup.call(this, t);
    };
  }
  private _noAnnoyingReminders() {
    setCookie();
    function setCookie() {
      console.log("Setting cookie to disable annoying popups");
      try {
        GM_cookie.set({
          name: "disabledPopups",
          value: "PassReminder,Bundles,News",
          domain: location.hostname.split(".").slice(-2).join("."),
          secure: true,
          path: "/",
          sameSite: "no_restriction",
          expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
        });
      } catch (e) {
        document.cookie =
          "disabledPopups=PassReminder,Bundles,News; path=/; max-age=" + 60 * 60 * 24 * 30;
      }
    }
    // TO MONITOR USEFULLNESS ONCE ITS PUSHED TO PROD
    if (location.pathname === "/home.html") {
      function patchClubs() {
        if (!$("[rel='clubs']").attr("href")?.includes("javascript:void(0)")) {
          return;
        }
        const d = $("#club-cooldown");
        let u = 0;
        if (d.length && ((u = Math.round(parseInt(d.attr("timer")!, 10))), u > 0)) {
          const C = shared.timer.buildTimer(u, "", "home-button-timer", !1);
          ($("#club-cooldown").append(C), shared.timer.activateTimers("home-button-timer"));
        }
        const m = $(".messenger-reply-timer.timer-box");
        if (m.length) {
          const E = parseInt(m.data("time-remaining")),
            x = `+${parseInt(m.data("amount-energy-replies"))} ${GT.design.messenger_in}`,
            w = shared.timer.buildTimer(E, x, "energy-replies-refill-timer", !1);
          (m.append(w), shared.timer.activateTimers("energy-replies-refill-timer"));
        }
        $('#homepage [rel="clubs"]')
          .off("click")
          .on("click", (t) => {
            (t.preventDefault(),
              u <= 0
                ? (shared.animations.loadingAnimation.start(),
                  shared.general.navigate($(t.currentTarget).data("href")))
                : alert(GT.design.club_cooldown_error));
          });
        /* $(".left-side-container a").click((t: any) => {
          "/" === $(t.target).closest("a")!.attr("href")!.substring(0, 1) &&
            shared.animations.loadingAnimation.start();
        }); */
      }
      patchClubs();
      console.log("Setting up listener to delete cookie on checkbox click");
      $(document).on(
        "change",
        "input[name='severalQoL_popupMinusMinus_noAnnoyingReminders']",
        function (event) {
          const isChecked = (event.target as HTMLInputElement).checked;
          if (!isChecked) {
            try {
              GM_cookie.delete(
                {
                  name: "disabledPopups",
                },
                function (error: boolean) {
                  if (error) {
                    console.error("Error deleting cookie:", error);
                  } else {
                    console.log("Cookie deleted successfully");
                  }
                },
              );
            } catch (e) {
              document.cookie = "disabledPopups=; path=/; max-age=0";
            }
          } else {
            setCookie();
          }
        },
      );
    }
  }
  private _noMissionPopup() {
    this._reward_popupRewardHandlePopupOverrides.push({
      fn: (t: any) => {
        if (t.callback === "handleMissionPopup") {
          console.log("Blocked mission popup", t);
          shared.Hero.updates(t.heroChangesUpdate, false);
          // Game handler
          ($(".missions_wrap > .mission_object").length ||
            (t.callbackArgs.isGiftClaimed
              ? (t.callbackArgs.displayAfterGift(), $(".end_gift").hide())
              : (t.callbackArgs.displayGift(), $("#missions_counter").hide())),
            $('#missions button[rel="claim"]').addClass("button_glow").prop("disabled", !1));
          return true;
        }
        return false;
      },
      permanent: true,
    });
  }
  private _noLevelUpPopup() {
    this._popupQueueManagerAddOverrides.push({
      fn: (t: popupForQueue["popup"]) => {
        if (
          t.type === "common" &&
          t.$dom_element.children().filter("#level_up.hero_leveling").length === 1
        ) {
          return true;
        }
        return false;
      },
      permanent: true,
    });
  }
  private _noPoVPoGClaimPopup() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_("button[rel='claim']", ($el) => {
      console.log("Setting up PoV/PoG popup blocker");
      $el.on("click.noPovPoGPopup", () => {
        this._popupQueueManagerAddOverrides.push({
          fn: (t: popupForQueue["popup"]) => {
            if (t.type === "common" && t.popup_name === "rewards") {
              t.onClose();
              console.log("Blocked PoV/PoG popup", t);
              return true;
            }
            return false;
          },
          permanent: false,
        });
      });
    });
  }
  private _noMEClaimPopup() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_("button[rel='claim'].mega-claim-reward", ($el) => {
      console.log("Setting up ME popup blocker");
      $el.on("click.noPovPoGPopup", () => {
        this._popupQueueManagerAddOverrides.push({
          fn: (t: popupForQueue["popup"]) => {
            if (t.type === "common" && t.popup_name === "rewards") {
              t.onClose();
              console.log("Blocked ME claim popup", t);
              return true;
            }
            return false;
          },
          permanent: false,
        });
      });
    });
  }
}
