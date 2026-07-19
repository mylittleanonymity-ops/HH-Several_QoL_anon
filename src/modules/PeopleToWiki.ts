import { HHModule, SubSettingsType } from "../base";
import GameHelpers from "../utils/GameHelpers";

type configSchema = {
  baseKey: "peopleToWiki";
  label: "People to Wiki(HH,GH,GPSH)";
  default: false;
  subSettings: [
    {
      key: "infoBubbleNameToWiki";
      default: true;
      label: "Info bubble name clickable to wiki";
    },
    {
      key: "portraitToWiki";
      default: false;
      label: "Make portrait clickable to wiki";
    },
  ];
};

export default class People extends HHModule {
  readonly configSchema = {
    baseKey: "peopleToWiki",
    label: "People to Wiki(HH,GH,GPSH)",
    default: false,
    subSettings: [
      {
        key: "infoBubbleNameToWiki",
        default: true,
        label: "Info bubble name clickable to wiki",
      },
      {
        key: "portraitToWiki",
        default: false,
        label: "Make portrait clickable to wiki",
      },
    ],
  };
  static shouldRun_() {
    return (
      location.host.includes("heroes") ||
      location.host.includes("gayharem") ||
      location.host.includes("gaypornstarharem")
    );
  }
  run(subSettings: SubSettingsType<configSchema>) {
    if (this._hasRun || !People.shouldRun_()) {
      return;
    }
    this._hasRun = true;

    if (subSettings.infoBubbleNameToWiki) {
      GM_addStyle(`.new_girl_info .girl_name_wrap > h5 { cursor: pointer; }`);
      $(document).on("click.InfoBubbleToWiki", ".new_girl_info .girl_name_wrap > h5", (event) => {
        const girlName = event.currentTarget.getAttribute("hh_title");
        if (!girlName) return;
        const formattedName = girlName.replace(/ /g, "-");
        const link = GameHelpers.getWikiPageForCurrentGame(formattedName);
        if (!link) {
          return;
        }
        GM_openInTab(link, {
          active: true,
        });
      });
    }
    if (subSettings.portraitToWiki) {
      GM_addStyle(`.slot_girl_shards > [data-new-girl-tooltip] { cursor: pointer; }`);
      $(document).on(
        "click.PortraitToWiki",
        ".slot_girl_shards > [data-new-girl-tooltip]",
        (event) => {
          const tooltip = event.currentTarget.getAttribute("data-new-girl-tooltip");
          if (!tooltip) return;
          const match = tooltip.match(/"name":"(.+)","rarity/);
          if (match && match[1]) {
            const formattedName = match[1].replace(/ /g, "-");
            const link = GameHelpers.getWikiPageForCurrentGame(formattedName);
            if (!link) {
              return;
            }
            GM_openInTab(link, {
              active: true,
            });
          }
        },
      );
    }
  }
}
