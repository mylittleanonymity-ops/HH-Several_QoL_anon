import { HHModule, SubSettingsType } from "../base";
import type { global_pop_hero_girls_incomplete, PlacesOfPowerData } from "../types";
import { placesOfPowerCss } from "../css/modules";
import html from "../utils/html";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";
import RequestQueueHandler from "../SingletonModules/RequestQueueHandler";
import runTimingHandler from "../runTimingHandler";
import { UnsafeWindow_Activities } from "../types/unsafeWindows/activities";

type configSchema = {
  baseKey: "placesOfPowerPlusPlus";
  label: "<span tooltip='Global overhaul of PoPs especially for claiming & filling manually'>Places of Power++</span>";
  default: true;
  subSettings: [
    {
      key: "rewardPopup";
      default: true;
      label: "Show reward popup on PoP claim";
    },
  ];
};

export default class PlacesOfPowerPlusPlus extends HHModule {
  readonly configSchema = {
    baseKey: "placesOfPowerPlusPlus",
    label:
      "<span tooltip='Global overhaul of PoPs especially for claiming & filling manually'>Places of Power++</span>",
    default: true,
    subSettings: [
      {
        key: "rewardPopup",
        default: true,
        label: "Show reward popup on PoP claim",
      },
    ],
  };
  private readonly _minPercentToStartPoP: number = 0.05; // Minimum percent of max power required to start a PoP (5%)
  private _hasPopupEnabled: boolean = false;

  private readonly _criteriaToClassMap: Record<PlacesOfPowerData["criteria"], 1 | 2 | 3> = {
    carac_1: 1,
    carac_2: 2,
    carac_3: 3,
  };

  // prettier-ignore
  private readonly _idealPoPOrder = [ // From HH++ slightly tweaked
    '1', '2', '3',      // primary pops
    '13', '14', '15',   // orb      / water
    '7', '8', '9',      // koban    / light
    '4', '5', '6',      // ymen     / darkness
    '16', '17', '18',   // booster  / fire
    '22', '23', '24',   // gift     / sun
    '19', '20', '21',   // ticket   / stone
    '10', '11', '12',   // gem      / nature & psychic
  ];

  static shouldRun_() {
    return (
      location.pathname.includes("/activities.html") &&
      !location.search.includes("?tab=pop&pop_id=")
    );
  }
  async run(subSettings: SubSettingsType<configSchema>) {
    if (this._hasRun || !PlacesOfPowerPlusPlus.shouldRun_()) {
      return;
    }
    this._hasPopupEnabled = subSettings?.rewardPopup ?? true;
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();
    if (unsafeWindow.pop_data === undefined) {
      return;
    }
    const $PopSwitcher = $(".switch-tab[data-tab='pop']");
    let NodePoP = $PopSwitcher.contents()[0];
    NodePoP.nodeValue = NodePoP.nodeValue?.trim() + "++";
    $PopSwitcher.attr("tooltip", "By infarctus");

    if (location.search.includes("tab=pop")) {
      HHPlusPlusReplacer.doWhenSelectorAvailable_("#pop_info", () => {
        this._buildPopInfoWithLoadingHandling();
        this._setupPoPSwitcherClickHandler($PopSwitcher);
      });
    } else {
      this._setupPoPSwitcherClickHandler($PopSwitcher);
    }

    this._injectCustomStyles();
  }
  /**
   * Build the custom PoP UI, handling the loading state if girls are still being loaded
   */
  private _buildPopInfoWithLoadingHandling(): void {
    HHPlusPlusReplacer.doWhenSelectorAvailable_("#pop_info", () => {
      this._buildCustomPopInfo();
    });
  }

  /**
   * Set up the click handler for the PoP switcher tab
   */
  private _setupPoPSwitcherClickHandler($PopSwitcher: JQuery<HTMLElement>): void {
    $PopSwitcher.on("click", () => {
      this._buildPopInfoWithLoadingHandling();
    });
  }

  private _updateSuckless() {
    if (unsafeWindow.suckless && unsafeWindow.suckless.parsePopData) {
      console.log(
        "Updating other scripts PoP tracked time",
        (unsafeWindow as UnsafeWindow_Activities).pop_data,
      );
      unsafeWindow.suckless.parsePopData((unsafeWindow as UnsafeWindow_Activities).pop_data);
    }
  }

  private _updateOtherScriptsPoPTrackedTime() {
    this._updateSuckless();
    const localStorageKey = "HHPlusPlusTrackedTimes";
    if (!localStorage.getItem(localStorageKey)) {
      console.log("No HHPlusPlusTrackedTimes found in localStorage");
      return;
    }
    const trackedTimes: Record<string, any> = JSON.parse(
      localStorage.getItem(localStorageKey) || "{}",
    );
    if (trackedTimes.pop == undefined || trackedTimes.popDuration == undefined) {
      console.log("No trackedTimes.pop or trackedTimes.popDuration found");
      return;
    }
    const endingsIn = Object.values((unsafeWindow as UnsafeWindow_Activities).pop_data)
      .map(({ remaining_time, time_to_finish }) => ({
        endAt: remaining_time,
        duration: time_to_finish,
      }))
      .filter(({ endAt }) => endAt)
      .sort((a, b) => (a.endAt > b.endAt ? 1 : -1));

    const soonest = endingsIn[0] || { endAt: 0, duration: 0 };
    const nowTs = Math.floor(Date.now() / 1e3);
    trackedTimes.pop = nowTs + soonest.endAt;
    trackedTimes.popDuration = soonest.duration;
    localStorage.setItem(localStorageKey, JSON.stringify(trackedTimes));
  }

  private _createOrUpdateKobanButtons() {
    let popToClaim = false;
    let popToFill = false;
    for (const popEntry of Object.values((unsafeWindow as UnsafeWindow_Activities).pop_data)) {
      if (popEntry.status === "pending_reward") {
        popToClaim = true;
      }
      if (popEntry.status === "can_start") {
        popToFill = true;
      }
      if (popToClaim && popToFill) break;
    }
    if ($(".pop-koban-buttons-container").length) {
      $(".pop-koban-buttons-container").remove();
    }
    const $popKobanButtonContainer = $(html`<div class="pop-koban-buttons-container"></div>`);
    const $popKobanClaimAllButton = $(html`
      <btn
        class="pop-koban-button pop-claim-all orange_button_L"
        price="${(unsafeWindow as UnsafeWindow_Activities).hh_prices_auto_claim}"
        ${popToClaim ? "" : "disabled"}
      >
        <div class="action-label">Claim All</div>
        <div class="action-cost">
          <div class="hc-cost">
            <span class="hard_currency_icn"></span>${(unsafeWindow as UnsafeWindow_Activities)
              .hh_prices_auto_claim}
          </div>
        </div>
      </btn>
    `);
    const self = this;
    $popKobanClaimAllButton.on("click", function () {
      let t = $(this);
      if (t.attr("disabled") !== undefined) {
        return;
      }
      let n = t.attr("price");
      shared.general.hc_confirm(n!, () => {
        shared.animations.loadingAnimation.start();
        t.prop("disabled", true);
        RequestQueueHandler.getInstance_().addAjaxRequest_(
          {
            action: "pop_claim_all",
          },
          (response: any) => {
            for (const popEntry of Object.values(
              (unsafeWindow as UnsafeWindow_Activities).pop_data,
            )) {
              if (popEntry.status === "pending_reward") {
                popEntry.status = "can_start";
              }
            }
            if (self._hasPopupEnabled) {
              shared.reward_popup.Reward.handlePopup(response.rewards);
            }
            $(".pop-record .collect_notif").remove();
            self._buildPopDetails("1");
            $("pop-record").first().trigger("click");
            shared.animations.loadingAnimation.stop();
          },
        );
      });
    });
    $popKobanButtonContainer.append($popKobanClaimAllButton);
    const $popKobanFillAllButton = $(html`
      <btn
        class="pop-koban-button pop-fill-all orange_button_L"
        price="${(unsafeWindow as UnsafeWindow_Activities).hh_prices_auto_start}"
        ${popToFill ? "" : "disabled"}
      >
        <div class="action-label">Fill All</div>
        <div class="action-cost">
          <div class="hc-cost">
            <span class="hard_currency_icn"></span>${(unsafeWindow as UnsafeWindow_Activities)
              .hh_prices_auto_start}
          </div>
        </div>
      </btn>
    `);
    $popKobanFillAllButton.on("click", function () {
      //base game function except for the update of pop_data
      let t = $(this);
      if (t.attr("disabled") !== undefined) return;
      let n = t.attr("price");
      shared.general.hc_confirm(n!, () => {
        (t.prop("disabled", !0),
          RequestQueueHandler.getInstance_().addAjaxRequest_(
            {
              action: "pop_auto_start_all",
            },
            function () {
              t.prop("disabled", !1);
              location.reload();
            },
          ));
      });
    });
    $popKobanButtonContainer.append($popKobanFillAllButton);
    $("#pop_info").append($popKobanButtonContainer);
  }

  /**
   * Select optimal girls for a PoP from scratch using pre-sorted lists
   */
  private async _selectOptimalGirls(popId: number): Promise<{
    selectedGirls: number[];
    totalPower: number;
    popData: UnsafeWindow_Activities["pop_data"][number] | undefined;
  }> {
    // 1. Fetch and parse data using clean async/await (no .then() nesting)
    const response = await fetch(
      shared.general.getDocumentHref(`/activities.html?tab=pop&pop_id=${popId}`),
    );
    const text = await response.text();
    const match = text.match(
      /var pop_data = \[\];\n\s+var current_pop_data =(.+);\n\s+var pop_can_auto_start =/,
    );

    if (!match || match.length < 2) {
      return { selectedGirls: [], totalPower: 0, popData: undefined };
    }

    const popData = JSON.parse(match[1].trim());
    const criteriaKey = `carac_${popData.class}` as const;

    const girls: any[] = popData.girls.filter((girl: any) => girl.assigned === -1);

    let remainingPower: number = popData.max_team_power;

    const chosenGirls: number[] = [];

    for (let i = 0; i < girls.length; i++) {
      const girl = girls[i];
      const girlPower = girl[criteriaKey];
      const girlId: number = girl.id_girl;

      if (girlPower <= remainingPower) {
        remainingPower -= girlPower;
        chosenGirls.push(girlId);

        if (remainingPower <= 0) {
          break;
        }
      } else {
        let bestGirlId = girlId;
        let bestGirlPower = girlPower;

        for (let j = i + 1; j < girls.length; j++) {
          const nextGirl = girls[j];
          const nextPower = nextGirl[criteriaKey];

          if (nextPower <= remainingPower) {
            break;
          }
          bestGirlId = nextGirl.id_girl;
          bestGirlPower = nextGirl[criteriaKey];
        }

        chosenGirls.push(bestGirlId);
        remainingPower -= bestGirlPower;
        break;
      }
    }

    console.log(chosenGirls, remainingPower, popData.max_team_power);

    return {
      selectedGirls: chosenGirls,
      totalPower: popData.max_team_power - remainingPower,
      popData: popData,
    };
  }

  private _selectNextPoPFromFill($currentPoPRecordSelected: JQuery<HTMLElement>) {
    if ($currentPoPRecordSelected.length === 0) return;
    let $next = $currentPoPRecordSelected
      .nextAll()
      .filter(function () {
        const popId = $(this).data("pop-id");
        const popData = (unsafeWindow as UnsafeWindow_Activities).pop_data[popId];
        return !popData.locked && popData && popData.status !== "in_progress";
      })
      .first();
    if ($next.length) {
      $next.trigger("click");
      return;
    }
    // If none found after, try from the start (excluding those with pending_reward)
    $next = $(".pop-record")
      .filter(function () {
        const popId = $(this).data("pop-id");
        const popData = (unsafeWindow as UnsafeWindow_Activities).pop_data[popId];
        return !popData.locked && popData && popData.status !== "in_progress";
      })
      .first();
    if ($next.length) {
      $next.trigger("click");
    } else {
      for (const [str, popEntry] of Object.entries(
        (unsafeWindow as UnsafeWindow_Activities).pop_data,
      )) {
        if (!popEntry.locked && popEntry.status !== "in_progress") {
          $(`[data-pop-id='${str}']`).trigger("click");
          return;
        }
      }
      // fallback: select the first
      $(".pop-record").first().trigger("click");
    }
  }
  private _selectNextPoPFromClaim() {
    const $currentPoPRecordSelected = $(".pop-record.selected");
    if ($currentPoPRecordSelected.nextAll().find(".collect_notif").length !== 0) {
      // find those after in priority
      $currentPoPRecordSelected.nextAll().find(".collect_notif").first().parent().trigger("click");
      return;
    }
    const $nextWithNotif = $(".pop-record").find(".collect_notif").first();
    if ($nextWithNotif.length) {
      $nextWithNotif.parent().trigger("click");
      return;
    } else {
      for (const [str, popEntry] of Object.entries(
        (unsafeWindow as UnsafeWindow_Activities).pop_data,
      )) {
        if (!popEntry.locked && popEntry.status === "can_start") {
          $(`[data-pop-id='${str}']`).trigger("click");
          return;
        }
      }
    }
    $(".pop-record").first().trigger("click"); // default to first
  }

  private _sendClaimRequest(popKey: string) {
    shared.animations.loadingAnimation.start();
    const popKeyInt = parseInt(popKey);
    const currentPoPData = (unsafeWindow as UnsafeWindow_Activities).pop_data[popKeyInt];
    $(".claimPoPButton").prop("disabled", true);
    if (currentPoPData.ends_in === null || currentPoPData.ends_in !== 0) {
      $(".claimPoPButton").css("display", "none");
      $(".startPoPButton").css("display", "");
      currentPoPData.status = "can_start";
      currentPoPData.ends_in = null;
      currentPoPData.time_to_finish = 0;
      $(".pop-record.selected .collect_notif").remove();
    } else {
      const $currentPoPRecordSelected = $(".pop-record.selected");
      this._selectNextPoPFromFill($currentPoPRecordSelected);
      delete (unsafeWindow as UnsafeWindow_Activities).pop_data[popKeyInt];
      $currentPoPRecordSelected.remove();
    }
    const n = {
      action: "claim_pop",
      id_place_of_power: currentPoPData.id_places_of_power,
    };
    RequestQueueHandler.getInstance_().addAjaxRequest_(n, (response: any) => {
      if (this._hasPopupEnabled) {
        shared.reward_popup.Reward.handlePopup(response.rewards);
      }
      this._selectNextPoPFromClaim();
      this._updateSuckless();
      if (
        $(".pop-record > .collect_notif").length === 0 &&
        $(".switch-tab[data-tab='pop'] > .collect_notif").length
      ) {
        $(".switch-tab[data-tab='pop'] > .collect_notif").remove();
      }
      shared.animations.loadingAnimation.stop();
    });
  }

  private _calculateTimeToFinishSeconds(popData: PlacesOfPowerData, totalPower: number): number {
    // If total power exceeds max_team_power, it takes 6 hours
    if (totalPower >= popData.max_team_power) {
      return 6 * 60 * 60; // 6 hours in seconds
    }

    // Otherwise, calculate time based on level_power / total_power (in minutes), convert to seconds
    const timeInMinutes = popData.level_power / totalPower;
    return Math.floor(timeInMinutes * 60); // Convert minutes to seconds
  }

  private async _sendFillRequest(popKey: string) {
    shared.animations.loadingAnimation.start();
    const popKeyInt = parseInt(popKey);
    const currentPoPData = (unsafeWindow as UnsafeWindow_Activities).pop_data[popKeyInt];
    if (currentPoPData.status !== "can_start") return;

    const popId = currentPoPData.id_places_of_power;

    // Build assignment for this specific PoP only
    console.log(`[PoP ${popId}] Building assignment for this PoP...`);
    const { selectedGirls, totalPower, popData } = (await this._selectOptimalGirls(popId)) || [];
    console.log(selectedGirls);
    if (!popData) {
      alert("Failed to fetch PoP data, this is normal if PoPs expired. Will reload the page...");
      shared.animations.loadingAnimation.stop();
      location.reload();
      return;
    }

    if (selectedGirls.length === 0) {
      alert(
        `No ${GT.design.Girls} were assigned to this PoP. This might happen if all your ${GT.design.Girls} are already assigned to other PoPs.`,
      );
      shared.animations.loadingAnimation.stop();
      return;
    }

    if (totalPower / popData.max_team_power < this._minPercentToStartPoP) {
      alert("Not enough power to start this PoP.");
      shared.animations.loadingAnimation.stop();
      return;
    }

    const timeToFinishSeconds = this._calculateTimeToFinishSeconds(popData, totalPower);
    // If not capped, ask for confirmation
    if (totalPower < popData.max_team_power) {
      const shouldContinue = confirm(
        `Warning: This PoP is not fully maxed!\n\n` +
          `Current Power: ${Math.floor(totalPower)}\n` +
          `Max Power: ${popData.max_team_power}\n\n` +
          `This will take ${(timeToFinishSeconds / 60 / 60).toFixed(2)} hours to complete.` +
          `\nDo you want to continue?`,
      );
      if (!shouldContinue) {
        // Revert UI changes
        $(".startPoPButton").css("display", "");
        $(".claimPoPButton").css("display", "none");
        shared.animations.loadingAnimation.stop();
        return;
      }
    }

    $(".startPoPButton").css("display", "none");
    $(".claimPoPButton").css("display", "");

    // Send the actual request to start the PoP with the selected girls
    const n = {
      action: "start_pop",
      id_place_of_power: popId,
      selected_girls: selectedGirls,
    };

    const $timer = $('<div class="pop-plus-plus-timer"></div>');

    const timerElement = shared.timer.buildTimer(
      timeToFinishSeconds,
      "",
      "pop-active-timer",
      false,
    );
    $timer.append(timerElement);
    $(".pop-record.selected").append($timer);
    (unsafeWindow as UnsafeWindow_Activities).pop_data[popKeyInt].status = "in_progress";
    (unsafeWindow as UnsafeWindow_Activities).pop_data[popKeyInt].time_to_finish =
      timeToFinishSeconds;
    (unsafeWindow as UnsafeWindow_Activities).pop_data[popKeyInt].remaining_time =
      timeToFinishSeconds;
    (unsafeWindow as UnsafeWindow_Activities).pop_data[popKeyInt].end_ts =
      timeToFinishSeconds + Math.floor(Date.now() / 1e3);

    RequestQueueHandler.getInstance_().addAjaxRequest_(n, (_response: any) => {
      shared.timer.activateTimers("pop-record.selected .pop-active-timer", () => {});
      this._selectNextPoPFromFill($(".pop-record.selected"));
      this._updateOtherScriptsPoPTrackedTime();
      shared.animations.loadingAnimation.stop();
    });
  }

  private _buildPopDetails(popKey: string) {
    const $popDetails = $(".pop-details-container");
    if (!$popDetails.length) return;
    const currentPoPData = (unsafeWindow as UnsafeWindow_Activities).pop_data[parseInt(popKey)];
    if (!currentPoPData) return;

    $popDetails.empty();

    // Girl image on the left
    const $popDetailsLeft = $('<div class="pop-details-left"></div>');
    $popDetails.append($popDetailsLeft);
    const $girlImageHolder = $("<img></img>");
    $girlImageHolder.attr(
      "src",
      currentPoPData.girl
        ? currentPoPData.girl.avatar
        : IMAGES_URL + "/pictures/girls/1/avb0-1200x.webp?a=1",
    );
    $popDetailsLeft.append($girlImageHolder);

    const $navigationButtons = $(
      '<div class="pop-navigation-buttons-original blue_button_L">Visit Original</div>',
    );
    $navigationButtons.on("click", () => {
      shared.general.navigate("/activities.html?tab=pop&pop_id=");
    });
    $popDetailsLeft.append($navigationButtons);

    // Details (title, rewards, buttons) on the right
    const $popDetailsRight = $("<div class='pop-details-right'></div>");
    $popDetails.prepend($popDetailsRight);

    const $title = $(html`
      <a
        tooltip="Visit this PoP original page"
        class="pop-title"
        href="${shared.general.getDocumentHref(
          "/activities.html?tab=pop&pop_id=" + currentPoPData.id_places_of_power,
        )}"
        >${currentPoPData.title}</a
      >
    `);
    $popDetailsRight.append($title);

    // Create rewards container
    const $rewardsContainer = $('<div class="pop-rewards-container"></div>');

    for (const [_key, reward] of Object.entries(currentPoPData.rewards)) {
      if (reward.loot) {
        const rewardElement = shared.reward.newReward.multipleSlot(reward);
        $rewardsContainer.append(rewardElement);
        break;
      }
    }

    $popDetailsRight.append($rewardsContainer);

    const $claimBtn = $(html`
      <button
        class="purple_button_L claimPoPButton"
        ${currentPoPData.status != "pending_reward" ? "disabled" : ""}
      >
        Claim
      </button>
    `);
    $popDetailsRight.append($claimBtn);
    $claimBtn.on("click", () => {
      this._sendClaimRequest(popKey);
    });

    const $startFillBtn = $(`<button class="blue_button_L startPoPButton">Fill & Start</button>`);
    $startFillBtn.on("click", () => {
      this._sendFillRequest(popKey);
    });
    $popDetailsRight.append($startFillBtn);
    if (currentPoPData.status !== "can_start") {
      $startFillBtn.css("display", "none");
    } else {
      $claimBtn.css("display", "none");
    }
    this._createOrUpdateKobanButtons();
  }

  private _buildCustomPopInfo() {
    const $popInfo = $("#pop_info");
    if (!$popInfo.length) return;

    $popInfo.empty();

    // Create left container for PoP details
    const $popDetailsContainer = $('<div class="pop-details-container"></div>');
    $popInfo.append($popDetailsContainer);

    // Create container for PoP records
    const $popRecordsContainer = $('<div class="pop-records-container"></div>');

    // Iterate through pop_data records
    // Order them according to idealPoPOrder (if an id appears there), then fallback to numeric id order
    const orderedEntries = Object.entries((unsafeWindow as UnsafeWindow_Activities).pop_data).sort(
      ([_aKey, aRec], [_bKey, bRec]) => {
        const aId = String(aRec.id_places_of_power ?? _aKey);
        const bId = String(bRec.id_places_of_power ?? _bKey);
        const idxA = this._idealPoPOrder.indexOf(aId);
        const idxB = this._idealPoPOrder.indexOf(bId);
        if (idxA !== -1 || idxB !== -1) {
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        }
        // fallback to numeric order
        return Number(aId) - Number(bId);
      },
    );

    orderedEntries.forEach(([key, popRecord]) => {
      const isLocked = popRecord.locked || 0;
      const $popRecord = $(
        html`<div class="${isLocked ? "pop-record-locked" : "pop-record"}"></div>`,
      );
      $popRecord.attr("data-pop-id", key);

      // Add background image as img element
      const bgImage = html`<img src="${popRecord.image}" class="pop-record-bg" />`;
      $popRecord.append(bgImage);

      // Add click handler for selection
      if (!isLocked) {
        $popRecord.on("click", () => {
          // Remove selection styling from all records
          $(".pop-record").removeClass("selected");
          // Add selection styling to clicked record
          $popRecord.addClass("selected");
          // Update details view
          this._buildPopDetails(key);
        });

        /*         // Create icon (top left)
        const icon = html`<img
          src="https://hh.hh-content.com/pictures/misc/items_icons/${popRecord.class}.png"
          class="pop-icon"
        />`;

        $popRecord.append(icon); */

        const $lvl = $(html`<div class="pop-lvl">Lv. ${popRecord.level}</div>`);
        $popRecord.append($lvl);

        if (popRecord.status === "in_progress") {
          // Create timer
          const $timer = $('<div class="pop-plus-plus-timer"></div>');

          const timerElement = shared.timer.buildTimer(
            popRecord.remaining_time,
            "",
            "pop-active-timer",
            false,
          );
          $timer.append(timerElement);
          $popRecord.append($timer);
        }
        if (popRecord.status === "pending_reward") {
          const $claimNotif = $(`<div class="collect_notif"></div>`);
          $popRecord.append($claimNotif);
        }
      }

      $popRecordsContainer.append($popRecord);
      $popRecord.attr("tooltip", popRecord.title);
    });

    // Add the container to the top of popInfo
    $popInfo.append($popRecordsContainer);
    //Select first PoP by default
    if ($(".pop-record").find(".collect_notif").length !== 0) {
      $(".pop-record").find(".collect_notif").first().parent().trigger("click");
    } else {
      $(".pop-record").first().trigger("click");
    }

    shared.timer.activateTimers("pop-active-timer", (timer) => {
      const $popRecord = timer.$dom_element.parent().parent().parent();
      if ($popRecord.hasClass("selected")) {
        $(".claimPoPButton").prop("disabled", false);
      }
      const popId = $popRecord.data("pop-id");
      (unsafeWindow as UnsafeWindow_Activities).pop_data[popId].status = "pending_reward";
      (unsafeWindow as UnsafeWindow_Activities).pop_data[popId].remaining_time = 0;
      $popRecord.append('<div class="collect_notif"></div>');
      timer.$dom_element.parent().parent().remove();
    });
  }
  private async _injectCustomStyles() {
    // Inject module-specific styling when the PoP UI is displayed
    GM_addStyle(placesOfPowerCss);
  }
}
