import { HHModule } from "../base";
import { GirlEquipmentTrackerCss } from "../css/modules";
import { MythicGirlGearPachinkoSummaryCss } from "../css/AlwaysRunningModules";
import {
  EquipmentPachinko_AjaxResponse,
  GirlArmorItem,
  GirlArmorItemMythic,
  GirlElement,
  GirlEquipmentListResponse,
} from "../types";
import GameHelpers from "../utils/GameHelpers";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";
import RequestQueueHandler from "../SingletonModules/RequestQueueHandler";
import runTimingHandler from "../runTimingHandler";
import { UnsafeWindow_Waifu } from "../types/unsafeWindows/waifu";

export default class MythicGirlEquipmentTracker extends HHModule {
  readonly configSchema = {
    baseKey: "girlEquipmentTracker",
    label:
      "<span tooltip='Go to edit your waifu on front page or go to Harem++ and click on icon with Girl Equip on it'>Mythic Girl Equipment Tracker / MGE Pachinko summary</span>",
    default: true,
  };
  private _girlEquipmentButton: JQuery<HTMLElement> = $(
    `<button id="open-girl-equipment-popup-button" class="square_blue_btn" tooltip="Mythic Girl Equipment Tracker" disabled><img src="/images/pictures/design/pachinko/ic_girl_armor_tooltip_icon.png"></img></button>`,
  );
  private _filters: {
    level: "all" | "10";
    element: GirlElement | null;
  } = {
    level: "all",
    element: null,
  };

  private _obtainedMythicEquips: Array<GirlArmorItemMythic> = [];

  private _equipmentData: {
    [figure: number]: { [slotIndex: number]: Array<{ level: number; element: GirlElement }> };
  } = {};

  static shouldRun_() {
    return location.pathname === "/waifu.html" || location.pathname === "/pachinko.html";
  }

  async run() {
    if (this._hasRun || !MythicGirlEquipmentTracker.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    this._injectCSS();
    await runTimingHandler.afterGameScriptsRun_();
    if (location.pathname === "/pachinko.html") {
      console.log("MythicGirlEquipmentTracker module running (pachinko)");
      this._hookAjaxComplete();
      this._addMythicSummary();
    } else if (location.pathname === "/waifu.html") {
      console.log("MythicGirlEquipmentTracker module running (waifu)");
      this._init();
      this._AddButton();
    }
  }

  private _hookAjaxComplete() {
    $(document).ajaxComplete((_event, xhr, settings) => {
      if (!(typeof settings?.data === "string")) {
        return;
      }
      if (settings.data.includes("action=play&what=pachinko6")) {
        const response = xhr.responseJSON as EquipmentPachinko_AjaxResponse;
        if (!response || !response.success) {
          return;
        }
        for (const equipment of response.rewards.data.rewards) {
          if (equipment.value.rarity === "mythic") {
            console.log("Mythic armor obtained!", equipment);
            this._obtainedMythicEquips.push(equipment.value);
            if (this._obtainedMythicEquips.length === 1) {
              this._addMythicSummary();
            }
            console.log(this._obtainedMythicEquips);
          }
        }
      }
    });
  }

  private _addMythicSummary() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      `.playing-zone[type-panel="equipment"]`,
      ($panel) => {
        if (this._obtainedMythicEquips.length === 0) {
          return;
        }
        const $summary = $(
          `<img id="qol-mythic-armor-drops" src="https://hh.hh-content.com/design/ic_books_gray.svg" tooltip="Show Mythic armors obtained this sessions">`,
        );
        $panel.append($summary);
        $summary.on("click", () => {
          shared.reward_popup.Reward.handlePopup({
            data: { loot: true, rewards: this._obtainedMythicEquips },
            title: "Mythic armors obtained :",
          });
        });
      },
    );
  }

  private _AddButton() {
    this._girlEquipmentButton.on("click", () => {
      console.log("Clicked girl equipment button");
      this._showEquipmentPopup();
    });
    if (location.hash !== "") {
      HHPlusPlusReplacer.doWhenSelectorAvailable_(".harem-toolbar > .spacer", ($el) => {
        $el.after(this._girlEquipmentButton);
      });
    } else {
      HHPlusPlusReplacer.doWhenSelectorAvailable_(".change-girl-panel #filter_girls", ($el) => {
        $el.wrap("<div style='display: flex;'></div>");
        $el.after(this._girlEquipmentButton);
      });
    }
  }

  private _showEquipmentPopup() {
    const $equipmentEquipmentListContainer = $("<div class='equipment-list-container'></div>");
    $equipmentEquipmentListContainer.append(this._generateEquipmentTable());

    const $container = $("<div class='girl-equipment-popup-container'></div>");

    // Add filter toggle
    const levelFilterToggle = $("<div class='filter-toggle'><span>Level:</span></div>");
    const $levelFilterAllBtn = $("<span class='filter-btn' data-filter='all'>All</span>");
    const $levelFilter10Btn = $("<span class='filter-btn disabled' data-filter='10'>10</span>");
    levelFilterToggle.append($levelFilterAllBtn, $levelFilter10Btn);
    $levelFilter10Btn.on("click", () => {
      $levelFilterAllBtn.addClass("disabled");
      $levelFilter10Btn.removeClass("disabled");
      this._filters.level = "10";
      $equipmentEquipmentListContainer.html(this._generateEquipmentTable());
    });
    $levelFilterAllBtn.on("click", () => {
      $levelFilterAllBtn.removeClass("disabled");
      $levelFilter10Btn.addClass("disabled");
      this._filters.level = "all";
      $equipmentEquipmentListContainer.html(this._generateEquipmentTable());
    });
    const $elementFilterToggle = $("<div class='filter-toggle-element'></div>");
    const elements: GirlElement[] = [
      "fire",
      "darkness",
      "nature",
      "light",
      "psychic",
      "stone",
      "sun",
      "water",
    ];
    elements.forEach((element) => {
      const $btn = $(`<span class='${element}_element_icn' data-filter='${element}'></span>`);
      $btn.on("click", () => {
        if (this._filters.element === element) {
          this._filters.element = null;
          $btn.removeClass("active");
        } else {
          this._filters.element = element;
          $elementFilterToggle.children().removeClass("active");
          $btn.addClass("active");
        }
        $equipmentEquipmentListContainer.html(this._generateEquipmentTable());
      });
      if (this._filters.element === element) {
        $btn.addClass("active");
      }
      $elementFilterToggle.append($btn);
    });

    $container.append(levelFilterToggle);
    $container.append($elementFilterToggle);
    $container.append($equipmentEquipmentListContainer);

    GameHelpers.createPopup_(
      "common",
      "girl-equipment-tracker-popup",
      $container,
      "Mythic Girl Equipment Tracker",
    );
  }

  private _generateEquipmentTable(): string {
    let html = "";

    // Iterate through each figure (1-12)
    for (let figure = 1; figure <= 12; figure++) {
      html += `<div class="figure-group" data-figure="${figure}">`;
      html += `<div class="figure-title-row"><img class="figure-title-img" src="${IMAGES_URL}/pictures/design/battle_positions/${figure}.png" alt="Figure ${figure}" /><span class="figure-title">${GT.figures[figure]}</span></div>`;
      html += '<table class="figure-equipment-table">';
      html += '<tr class="slot-header-row">';

      // Add slot headers (1-6)
      for (let slot = 1; slot <= 6; slot++) {
        html += `<th></th>`;
      }
      html += "</tr>";

      // Add 7 rows for items
      for (let row = 0; row < 7; row++) {
        html += '<tr class="equipment-row">';
        for (let slot = 1; slot <= 6; slot++) {
          // Get items for this figure and slot
          const equipsSlot = this._equipmentData[figure]?.[slot] || [];

          // Filter based on criteria
          const filteredLevels = equipsSlot.filter((equip) => {
            if (this._filters.element && equip.element !== this._filters.element) {
              return false;
            }
            if (this._filters.level === "10") {
              return equip.level === 10;
            }
            return true; // for "all" filter
          });
          filteredLevels.sort((a, b) => b.level - a.level); // Sort levels in descending order

          // Display item if available, otherwise empty cell
          if (row < filteredLevels.length) {
            html += `<td class="equipment-item level-${filteredLevels[row].level}">${filteredLevels[row].level}</td>`;
          } else {
            html += '<td class="equipment-item empty"></td>';
          }
        }
        html += "</tr>";
      }

      html += "</table>";
      html += "</div>";
    }
    return html;
  }

  private async _init() {
    const a = this._fetchAllSlots();
    const b = this._getEquipDataFromEquippedGirls();
    await Promise.all([a, b]);
    console.log("Initialization complete. Equipment data:", this._equipmentData);
    unsafeWindow.QoL_girlEquipmentData = this._equipmentData;
    this._girlEquipmentButton.prop("disabled", false);
  }

  // Run asynchronously to gain time
  private async _getEquipDataFromEquippedGirls() {
    const girlsDataList = (unsafeWindow as UnsafeWindow_Waifu).girls_data_list;
    if (!girlsDataList) {
      alert("Unable to access girls_data_list");
      return;
    }
    for (const girlData of girlsDataList) {
      if (girlData.armor && girlData.armor.length > 0) {
        girlData.armor.forEach((armorItem) => {
          if (armorItem.rarity === "mythic") {
            const figure = armorItem.variation.figure;
            const slotIndex = armorItem.slot_index;
            if (!this._equipmentData[figure]) {
              this._equipmentData[figure] = {};
            }
            if (!this._equipmentData[figure][slotIndex]) {
              this._equipmentData[figure][slotIndex] = [];
            }
            this._equipmentData[figure][slotIndex].push({
              level: armorItem.level,
              element: armorItem.variation.element,
            });
          }
        });
      }
    }
  }

  private async _fetchAllSlots() {
    const slots: GirlArmorItem["slot_index"][] = [1, 2, 3, 4, 5, 6];
    await Promise.all(slots.map((slot) => this._fetchEquipmentWithPagination(slot)));
  }

  private _fetchEquipmentWithPagination(
    slotIndex: GirlArmorItem["slot_index"],
    page: number = 1,
  ): Promise<void> {
    return new Promise((resolve) => {
      const params = {
        action: "girl_equipment_list",
        slot_index: slotIndex,
        sort_by: "rarity",
        sorting_order: "desc",
        page: page,
        id_girl: 1,
      };
      RequestQueueHandler.getInstance_().addAjaxRequest_(
        params,
        (response: GirlEquipmentListResponse) => {
          const mythicItems = response.items.filter((item) => item.rarity === "mythic");
          // Store the items from this page
          mythicItems.forEach((item) => {
            const figure = item.variation.figure;
            if (!this._equipmentData[figure]) {
              this._equipmentData[figure] = {};
            }
            if (!this._equipmentData[figure][slotIndex]) {
              this._equipmentData[figure][slotIndex] = [];
            }
            this._equipmentData[figure][slotIndex].push({
              level: item.level,
              element: item.variation.element,
            });
          });

          // Check if all items are mythic, if so fetch the next page
          if (mythicItems.length === response.items.length && response.items.length > 0) {
            // Fetch next page for this slot
            this._fetchEquipmentWithPagination(slotIndex, page + 1).then(resolve);
          } else {
            resolve();
          }
        },
      );
    });
  }

  private async _injectCSS() {
    GM_addStyle(GirlEquipmentTrackerCss);
    GM_addStyle(MythicGirlGearPachinkoSummaryCss);
  }
}
