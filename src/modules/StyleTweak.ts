import { HHModule, HHModule_ConfigSchema, SubSettingsType } from "../base";
import CompactLeagueStyleTweak from "./StyleTweak/CompactLeagueStyleTweak";
import LustArenaStyleTweak from "./StyleTweak/LustArenaStyleTweak";
import PoVPoGHideClaimAllUntilLastDayStyleTweak from "./StyleTweak/PoVPoGHideClaimAllUntilLastDayStyleTweak";
import VillainReplaceBulbsByMulticolorBulbStyleTweak from "./StyleTweak/VillainReplaceBulbsByMulticolorBulbStyleTweak";

type StyleTweak_configSchema = {
  baseKey: "styleTweak";
  label: "Style Tweak: Visual improvements";
  default: true;
  subSettings: [
    {
      key: "villainReplaceBulbsByMulticolorBulb";
      label: "Villain: Replace bulbs by multicolor bulb";
      default: true;
    },
    {
      key: "lustArenaStyleTweak";
      label: "Lust Arena";
      default: true;
    },
    {
      key: "poVPoGHideClaimAllUntilLastDay";
      label: "PoV/PoG: Hide 'Claim All' until last day";
      default: false;
    },
    {
      key: "compactLeagueStyleTweak";
      label: "<span tooltip='This module is meant to be used alongside Leagues++ & League Tracker'>Compact League View</span>";
      default: false;
    },
  ];
};

export default class StyleTweak extends HHModule {
  readonly configSchema: HHModule_ConfigSchema = {
    baseKey: "styleTweak",
    label: "Style Tweak: Visual improvements",
    default: true,
    subSettings: [
      {
        key: "villainReplaceBulbsByMulticolorBulb",
        label: "Villain: Replace bulbs by multicolor bulb",
        default: true,
      },
      {
        key: "lustArenaStyleTweak",
        label: "Lust Arena",
        default: true,
      },
      {
        key: "poVPoGHideClaimAllUntilLastDay",
        label: "PoV/PoG: Hide 'Claim All' until last day",
        default: false,
      },
      {
        key: "compactLeagueStyleTweak",
        label:
          "<span tooltip='This module is meant to be used alongside Leagues++ & League Tracker'>Compact League View</span>",
        default: false,
      },
    ],
  };
  static shouldRun_() {
    return true;
  }
  async run(subSettings: SubSettingsType<StyleTweak_configSchema>) {
    if (this._hasRun || !StyleTweak.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    console.log("StyleTweak module running");
    if (
      subSettings.villainReplaceBulbsByMulticolorBulb &&
      location.pathname === "/troll-pre-battle.html"
    ) {
      new VillainReplaceBulbsByMulticolorBulbStyleTweak().run_();
    }
    if (subSettings.lustArenaStyleTweak && location.pathname === "/home.html") {
      new LustArenaStyleTweak().run_();
    }
    if (
      subSettings.poVPoGHideClaimAllUntilLastDay &&
      (location.pathname === "/path-of-valor.html" || location.pathname === "/path-of-glory.html")
    ) {
      new PoVPoGHideClaimAllUntilLastDayStyleTweak().run_();
    }
    if (subSettings.compactLeagueStyleTweak && location.pathname === "/leagues.html") {
      new CompactLeagueStyleTweak().run_();
    }
  }
}
