import { AlwaysRunningModule } from "../base";
import { BetterNSFWCensorCss } from "../css/AlwaysRunningModules";
import AddDummyToHHPlusPlus from "../SingletonModules/AddDummyToHHPlusPlus";
import { GlobalStorageHandler } from "../utils/StorageHandler";

export default class BetterNSFWCensor extends AlwaysRunningModule {
  nsfwCensorElement: Element | null = null;
  static shouldRun_() {
    return true;
  }
  run_(): void {
    if (GlobalStorageHandler.getBetterNsfwCensorEnabled_()) {
      this.nsfwCensorElement = GM_addStyle(BetterNSFWCensorCss);
    }
    AddDummyToHHPlusPlus.getInstance_().addDummy_({
      label: "Better NSFW Censor",
      active: GlobalStorageHandler.getBetterNsfwCensorEnabled_(),
      callback: (newValue: boolean) => {
        GlobalStorageHandler.setBetterNsfwCensorEnabled_(newValue);
        if (newValue) {
          if (!this.nsfwCensorElement) {
            this.nsfwCensorElement = GM_addStyle(BetterNSFWCensorCss);
          }
        } else {
          if (this.nsfwCensorElement) {
            this.nsfwCensorElement.remove();
            this.nsfwCensorElement = null;
          }
        }
      },
      after: "severalQoL_menuExtensions",
    });
  }
}
