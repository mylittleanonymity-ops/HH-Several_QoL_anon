import { HHModule } from "../base";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";

export default class WhaleBossTournament extends HHModule {
  readonly configSchema = {
    baseKey: "whaleBossTournament",
    label: "Renames WBT to Whale Boss Tournament",
    default: false,
  };
  static shouldRun_() {
    return location.pathname.includes("/home.html");
  }
  async run() {
    if (this._hasRun || !WhaleBossTournament.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    HHPlusPlusReplacer.doWhenSelectorAvailable_(".world-boss .title", ($element) => {
      $element.each((_, el) => {
        const $el = $(el);
        if ($el.parent().attr("rel") === "world-boss-co-op") {
          $el.text("Whale Boss Co-Op");
        } else {
          $el.text("Whale Boss Tournament");
        }
      });
    });
  }
}
