import { SubModule } from "../../base";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";

export default class EventInfo_Seasonal implements SubModule {
  private readonly _EventInfoSeasonalLinks2: string[] = [
    "",
    "",
    "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-310473",
  ];
  private readonly _EventInfoSeasonalLinks: { [key: number]: string } = {
    2: "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-310068", // LR
    4: "https://forum.kinkoid.com/index.php?/topic/31207-vademecum-rerum-gestarum-ex-haremverse-a-guide-to-the-events/#comment-310475", // SEM
  };
  run_() {
    const currentSeasonalType = unsafeWindow.event_functionalities
      ?.id_seasonal_event_type as number;
    let linkToUse =
      this._EventInfoSeasonalLinks[currentSeasonalType] ??
      this._EventInfoSeasonalLinks2[currentSeasonalType - 1];
    if (!currentSeasonalType || !linkToUse) {
      console.log("SE Info: No known seasonal event detected");
      return;
    }
    this._replaceSeasonalNotifButton(linkToUse);
  }
  private _replaceSeasonalNotifButton(link: string) {
    if (!link) {
      console.log("SE Info: No link provided for this seasonal event");
      return;
    }
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      ".button-notification-action.notif_button_s",
      () => {
        $(".button-notification-action.notif_button_s")
          .attr("tooltip", "Several QoL: More Info on this event")
          .off("click")
          .on("click", (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            GM_openInTab(link, {
              active: true,
            });
          });
      },
    );
  }
}
