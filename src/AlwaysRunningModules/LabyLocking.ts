import { AlwaysRunningModule } from "../base";
import { LabyLockingCss } from "../css/AlwaysRunningModules";
import runTimingHandler from "../runTimingHandler";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";
import { PlayerStorageHandler } from "../utils/StorageHandler";

export default class LabyLocking extends AlwaysRunningModule {
  static shouldRun_() {
    return location.pathname === "/labyrinth-entrance.html";
  }
  async run_() {
    if (!LabyLocking.shouldRun_()) {
      return;
    }
    this.addStyle_();
    await runTimingHandler.afterThirdPartyScriptsRun_();
    HHPlusPlusReplacer.doWhenSelectorAvailable_(".difficulty-button[data-difficulty]", ($els) => {
      const updateButtonStates = () => {
        const storedLockedDifficulty = PlayerStorageHandler.getPlayerLabyLockedDifficulty();
        $els.each((_, LabyButton) => {
          const $Labybutton = $(LabyButton);
          const btnDifficulty = $Labybutton.attr("data-difficulty");

          // If a difficulty is locked, only that one is selectable
          if (storedLockedDifficulty) {
            if (storedLockedDifficulty === btnDifficulty) {
              $Labybutton.addClass("locked-difficulty").removeClass("unlocked-difficulty");
              $Labybutton.prop("disabled", false);
            } else {
              $Labybutton.addClass("unlocked-difficulty").removeClass("locked-difficulty");
              $Labybutton.prop("disabled", true);
            }
          } else {
            // No lock, all buttons are selectable
            $Labybutton.addClass("locked-difficulty").removeClass("unlocked-difficulty");
            $Labybutton.prop("disabled", false);
          }

          // Update lock icon text
          const $lockDifficultyBtn = $Labybutton.next(".lab-lock");
          $lockDifficultyBtn.text(storedLockedDifficulty === btnDifficulty ? "🔒" : "🔓");
        });
      };

      $els.each((_, LabyButton) => {
        console.log("Adding lock to difficulty button", LabyButton);
        const $Labybutton = $(LabyButton);
        const btnDifficulty = $Labybutton.attr("data-difficulty");

        // Only create lock button if it doesn't exist
        if ($Labybutton.next(".lab-lock").length === 0) {
          const $lockDifficultyBtn = $(
            '<span class="lab-lock" title="Locked difficulty" aria-hidden="true"></span>',
          );
          $lockDifficultyBtn.attr("data-difficulty", btnDifficulty!);
          const $parent = $Labybutton.parent();
          $parent.append($lockDifficultyBtn);

          $lockDifficultyBtn.on("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentLocked = PlayerStorageHandler.getPlayerLabyLockedDifficulty();
            if (currentLocked === btnDifficulty) {
              // Unlock if clicking the already-locked one
              PlayerStorageHandler.setPlayerLabyLockedDifficulty_(null);
            } else {
              // Lock this difficulty
              PlayerStorageHandler.setPlayerLabyLockedDifficulty_(btnDifficulty!);
            }
            updateButtonStates(); // Update all button states dynamically
          });
        }
      });

      // Initial setup of button states
      updateButtonStates();
    });
  }
  async addStyle_() {
    GM_addStyle(LabyLockingCss);
  }
}
