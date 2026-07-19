import { SubModule } from "../../base";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";

export default class LeagueNoPlayerProfileOnNameClick implements SubModule {
  run_() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      '.data-row.body-row .data-column[column="nickname"]',
      () => {
        $("body").off("click", '.data-row.body-row .data-column[column="nickname"]');
      },
    );
  }
}
