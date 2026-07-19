import { SubModule } from "../../base";
import { HHPlusPlusReplacer } from "../../utils/HHPlusPlusreplacer";
import html from "../../utils/html";

export default class NutakuLogout implements SubModule {
  run_() {
    this._addLogoutOption();
  }
  private _addLogoutOption() {
    HHPlusPlusReplacer.doWhenSelectorAvailable_(
      "#contains_all > nav > [rel='content'] > div",
      ($navDiv) => {
        const logoutLink = html`<a
          href="${shared.general.getDocumentHref("/logout.html")}"
          tooltip="Can solve unique issues, like buggy contests or stuff like that"
          logout
        >
          <div>
            <ic class="logout"></ic>
            <span>Logout</span>
          </div>
        </a>`;
        $navDiv.append(logoutLink);
      },
    );
  }
}
