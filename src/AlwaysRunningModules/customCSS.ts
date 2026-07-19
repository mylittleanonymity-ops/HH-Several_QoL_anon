import { AlwaysRunningModule } from "../base";

export default class CustomCSS extends AlwaysRunningModule {
  static shouldRun_() {
    return location.pathname === "/home.html";
  }
  run_() {
    if (location.pathname === "/home.html") {
      GM_addStyle(
        `h4.severalQoL.selected::after{content: 'v${GM_info.script.version}';display: block;position: absolute;top: -10px;right: -15px;font-size: 10px;}`,
      );
      GM_addStyle(`.hh-plus-plus-config-panel .group-panel .config-setting.has-subsettings[rel="severalQoL_noReloadFromClaimingDailyChests"],
.hh-plus-plus-config-panel .group-panel .config-setting.has-subsettings[rel="severalQoL_placesOfPowerPlusPlus"] { grid-row-end: span 1;}`);
    }
  }
}
