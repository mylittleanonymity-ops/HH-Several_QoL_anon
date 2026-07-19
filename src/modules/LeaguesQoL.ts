import { HHModule, HHModule_ConfigSchema, SubSettingsType } from "../base";
import runTimingHandler from "../runTimingHandler";
import LeagueNoPlayerProfileOnNameClick from "./LeaguesQoL/LeagueNoPlayerProfileOnNameClick";
import LeagueOpponentHistory from "./LeaguesQoL/LeagueOpponentHistory";
import NoRefillEnergyConfirm from "./LeaguesQoL/NoRefillEnergyConfirm_LeagueQoL";
import simv4Fix from "./LeaguesQoL/simv4-fix";

type LeaguesQoL_configSchema = {
  baseKey: "leaguesQoL";
  label: "Leagues QoL :";
  default: false;
  subSettings: [
    {
      key: "leagueOpponentHistory";
      label: "<span tooltip='click on the row to refresh, only looks for highest league'>Show history of opponents</span>";
      default: false;
    },
    {
      key: "leagueNoPlayerProfileOnNameClick";
      label: "Disable opening player profile when clicking on their name";
      default: false;
    },
    {
      key: "noRefillEnergyConfirm";
      label: "Disable koban spending confirmation for leagues energy refill";
      default: false;
    },
    {
      key: "simv4Fix";
      label: "Fix simv4 by fetching correct opponent date (request intensive, be careful)";
      default: false;
    },
  ];
};

export default class LeaguesQoL extends HHModule {
  readonly configSchema: HHModule_ConfigSchema = {
    baseKey: "leaguesQoL",
    label: "Leagues QoL :",
    default: false,
    subSettings: [
      {
        key: "leagueOpponentHistory",
        label:
          "<span tooltip='click on the row to refresh, only looks for highest league'>Show history of opponents</span>",
        default: false,
      },
      {
        key: "leagueNoPlayerProfileOnNameClick",
        label: "Disable opening player profile when clicking on their name",
        default: false,
      },
      {
        key: "noRefillEnergyConfirm",
        label: "Disable spending confirmation for leagues energy refill",
        default: false,
      },
      {
        key: "simv4Fix",
        label:
          "<span tooltip='Fetches pre-battle page, Booster Sims & Skill sims are still incorrect for them check Pre-Battle Page'>Fix simv4 : **requires** Leagues++</span>",
        default: false,
      },
    ],
  };
  static shouldRun_() {
    return location.pathname.includes("/leagues.html");
  }
  async run(subSettings: SubSettingsType<LeaguesQoL_configSchema>) {
    if (this._hasRun || !LeaguesQoL.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterThirdPartyScriptsRun_();
    console.log("LeaguesQoL module running");
    if (subSettings.leagueOpponentHistory) {
      new LeagueOpponentHistory().run_();
    }
    if (subSettings.leagueNoPlayerProfileOnNameClick) {
      new LeagueNoPlayerProfileOnNameClick().run_();
    }
    if (subSettings.noRefillEnergyConfirm) {
      new NoRefillEnergyConfirm().run_();
    }
    if (subSettings.simv4Fix) {
      new simv4Fix().run_();
    }
  }
}
