import { HHModule } from "../base";
import runTimingHandler from "../runTimingHandler";
import { Objective } from "../types";

export default class PopupPlusPlus extends HHModule {
  readonly configSchema = {
    baseKey: "popupPlusPlus",
    label:
      "<span tooltip='Stacking point popups, click on the popup to make it disappear'>Popup++</span>",
    default: true,
  };
  static shouldRun_() {
    return true;
  }
  async run() {
    if (this._hasRun || !PopupPlusPlus.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();
    GM_addStyle("#toast-popups {display:inherit!important;}");
    let lastPoints: Record<string, Record<string, number>> = {};
    let timeOut: ReturnType<typeof setTimeout> | null = null;
    delete shared.general.objectivePopup.show;
    shared.general.objectivePopup.show = function (t: any) {
      if (this.LastPoints == undefined) {
        this.LastPoints = {};
      }
      if (!t.objective_points || t.battle_result) {
        return;
      }
      if (!t.objective_points) {
        // OG function if it's not for objective points
        const n = t.objective_points;
        if (Object.keys(this.pointsBox).length) {
          for (let t in n) {
            this.pointsBox[t]
              ? this.pointsBox[t].name === n[t].name &&
                (this.pointsBox[t].points_gained += n[t].points_gained)
              : (this.pointsBox[t] = n[t]);
          }
        } else {
          this.pointsBox = t.objective_points;
        }
        t?.end?.rewards?.hasOwnProperty("lose"); //|| this.popOverlayPoints(t.next_step)
      }
      customPopup(this, t.objective_points);
    };
    function customPopup(_objectivePopupthis: any, objective_points: any) {
      Object.keys(objective_points).map((n: string) => {
        const currObjective = objective_points[n] as Objective;
        if (!lastPoints[currObjective.title]) {
          lastPoints[currObjective.title] = {};
        }
        if (!lastPoints[currObjective.title][currObjective.name]) {
          lastPoints[currObjective.title][currObjective.name] = currObjective.points_gained;
        } else {
          lastPoints[currObjective.title][currObjective.name] += currObjective.points_gained;
        }
      });
      const $popup = $(
        `<div class="popup_wrapper"><div id="objective_popup" class="popup"><div class="noti_box"><div class="points">${Object.keys(
          lastPoints,
        )
          .map((n) => {
            const currObjective = lastPoints[n];
            const animateClass = "row animate";
            let title = `<div class="${animateClass}" style="transition: all 20ms;" style="animation: slide_left 200ms ease-out;"><div class="contest_name">${n}:</div>`;
            for (const key in currObjective) {
              const value = currObjective[key];
              title += `<div class="contest_points"><div class="points_name" style="animation:none;">${key}: </div><div class="points_num" style="animation:none;"><div class="points_i" style="animation:none;">+${number_format_lang(
                value,
              )}</div></div></div>`;
            }
            title += `</div>`;
            return title;
          })
          .join("")}</div></div></div></div>`,
      );
      $("#toast-popups .popup_wrapper").remove();
      $("#toast-popups").css("display", "unset");
      $("#toast-popups");
      $("#toast-popups").append($popup);
      $("#toast-popups").css("display", "unset");
      if (timeOut !== null) {
        clearTimeout(timeOut);
        timeOut = null;
      }
      timeOut = setTimeout(() => {
        $popup.remove();
        timeOut = null;
        lastPoints = {};
      }, 5000);
      $popup.on("click.removePopup", function () {
        $popup.remove();
        timeOut = null;
        lastPoints = {};
      });
    }
  }
}
