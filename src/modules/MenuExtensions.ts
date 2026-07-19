import { HHModule, HHModule_ConfigSchema, SubSettingsType } from "../base";
import NutakuLogout from "./MenuExtensions/NutakuLogout";
import Calendar from "./MenuExtensions/Calendar";
import runTimingHandler from "../runTimingHandler";

type MenuExtensions_configSchema = {
  baseKey: "menuExtensions";
  label: "<span tooltip='Menu in top right corner'>Menu Extensions:</span>";
  default: true;
  subSettings: [
    {
      key: "calendar";
      label: "Calendar";
      default: true;
    },
    {
      key: "logout";
      label: "Logout";
      default: true;
    },
  ];
};

export default class MenuExtensions extends HHModule {
  readonly configSchema: HHModule_ConfigSchema = (() => {
    const configSchema = {
      baseKey: "menuExtensions",
      label: "<span tooltip='Menu in top right corner'>Menu Extensions:</span>",
      default: true,
      subSettings: [
        {
          key: "calendar",
          label: "Calendar",
          default: true,
        },
      ],
    };
    if (location.hostname.startsWith("nutaku")) {
      configSchema.subSettings.push({
        key: "logout",
        label: "Logout",
        default: true,
      });
    }
    return configSchema;
  })();
  static shouldRun_() {
    return true;
  }
  async run(subSettings: SubSettingsType<MenuExtensions_configSchema>) {
    if (this._hasRun || !MenuExtensions.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();
    console.log("MenuExtensions module running");
    if (subSettings.calendar) {
      new Calendar().run_();
    }
    if (location.hostname.startsWith("nutaku") && subSettings.logout) {
      new NutakuLogout().run_();
    }
  }
}
