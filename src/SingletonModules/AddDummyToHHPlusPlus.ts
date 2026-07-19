import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";

export interface Dummy {
  label: string;
  active: boolean;
  callback: (NewValue: boolean) => void;
  after?: string;
}

export default class AddDummyToHHPlusPlus {
  private static _instance: AddDummyToHHPlusPlus | null = null;
  private _dummyAdded: boolean = false;
  private _dummyList: Dummy[] = [];
  private constructor() {
    this.run_();
  }
  public static getInstance_(): AddDummyToHHPlusPlus {
    if (!AddDummyToHHPlusPlus._instance) {
      AddDummyToHHPlusPlus._instance = new AddDummyToHHPlusPlus();
    }
    return AddDummyToHHPlusPlus._instance;
  }
  public addDummy_(dummy: Dummy) {
    this._dummyList.push(dummy);
    if (this._dummyAdded) {
      this._addDummyToHHPlusPlus(
        dummy,
        $(".hh-plus-plus-config-panel .group-panel[rel='severalQoL'] .panel-contents"),
      );
    }
  }
  public run_() {
    if (location.pathname !== "/home.html") {
      return;
    }
    HHPlusPlusReplacer.doWhenSelectorAvailable_(".hh-plus-plus-config-button", ($button) => {
      $button.one("click.addDummyToHHPlusPlus", () => {
        HHPlusPlusReplacer.doWhenSelectorAvailable_(
          ".hh-plus-plus-config-panel .group-panel[rel='severalQoL'] .panel-contents",
          ($QoLpanel) => {
            console.log("Adding dummy to HH++ config panel", $QoLpanel.children());
            this._dummyAdded = true;
            this._dummyList.forEach((dummy) => {
              this._addDummyToHHPlusPlus(dummy, $QoLpanel);
            });
          },
        );
      });
    });
  }
  private _addDummyToHHPlusPlus(dummy: Dummy, $QoLpanel: JQuery<HTMLElement>) {
    const $dummyElement = this._createDummyElement(dummy);
    if (!dummy.after) {
      $QoLpanel.append($dummyElement);
    } else {
      $QoLpanel.find(`[rel='${dummy.after}']`).after($dummyElement);
    }
  }
  private _createDummyElement(dummy: Dummy): JQuery<HTMLElement> {
    const $dummyFrame = $(
      `<div class="config-setting ${dummy.active ? "enabled" : "disabled"}"></div>`,
    );
    const $label = $(`<label class="base-setting">${dummy.label}</label>`);
    const $toggle = $(`<input type="checkbox" ${dummy.active ? `checked="checked"` : ""}>`);
    $toggle.on("change", () => {
      const newValue = $toggle.is(":checked");
      dummy.callback(newValue);
      $dummyFrame.toggleClass("enabled", newValue);
    });
    $label.append($toggle);
    $dummyFrame.append($label);
    return $dummyFrame;
  }
}
