import { HHModule } from "../base";
import html from "../utils/html";
import { GirlMinimalData } from "../types";
import RequestQueueHandler from "../SingletonModules/RequestQueueHandler";
import runTimingHandler from "../runTimingHandler";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";

export default class ChampionFightsFromMap extends HHModule {
  readonly configSchema = {
    baseKey: "championFightsFromMap",
    label: `<span tooltip="Don't click on the button directly to access champ page">Champion Fights From Map</span>`,
    default: false,
  };
  static shouldRun_() {
    return location.pathname === "/champions-map.html";
  }
  async run() {
    if (this._hasRun || !ChampionFightsFromMap.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    console.log("ChampionFightsFromMap module running");
    await runTimingHandler.afterGameScriptsRun_();
    HHPlusPlusReplacer.doWhenSelectorAvailable_("a[champions_id]", ($elements) => {
      $elements.each(function () {
        const $this = $(this);
        const champId = $this.attr("champions_id");
        const timerId = `timer${champId}`;
        const champUrl = shared.general.getDocumentHref((this as HTMLLinkElement).href);
        if ($this.find(".champion-rest-timer").length === 0) {
          const $timer = $(html`
            <div class="champion-rest-timer">
              <div class="rest-timer timer">
                <span id="${timerId}">${GT.design.pantheon_perform}</span>
              </div>
            </div>
          `);
          $this.find(".map-label-link").append($timer);
          let cooldown = 0;
          $this.find(".map-label-link").on("click", function (event) {
            if (cooldown > 0) {
              // while on cooldown, visit the champ
              return;
            }
            event.preventDefault();
            shared.animations.loadingAnimation.start();
            RequestQueueHandler.getInstance_().addRequest_(async () => {
              await new Promise<void>((resolve) => {
                $.ajax({
                  url: champUrl,
                  success: function (data) {
                    const championData = JSON.parse(
                      /{"champion"[\w\W]+?};/.exec(data)![0].slice(0, -1),
                    );
                    const team = championData.team.map((girl: GirlMinimalData) => girl.id_girl);
                    const params = {
                      class: "TeamBattle",
                      battle_type: "champion",
                      battles_amount: 1,
                      defender_id: champId,
                      attacker: {
                        team,
                      },
                    };
                    RequestQueueHandler.getInstance_().addAjaxRequest_(
                      params,
                      function (data) {
                        console.log("response from champ fight", data);
                        shared.animations.loadingAnimation.stop();
                        delete data.end.rewards.redirectUrl;
                        shared.reward_popup.Reward.handlePopup(data.end.rewards);
                        shared.Hero.updates(data.end.rewards.heroChangesUpdate);
                        if (data.objective_points) {
                          shared.general.objectivePopup.show(data.objective_points);
                        }
                        cooldown = data.final.winner.type === "champion" ? 900 : 86400; // 15 minutes or 24hours
                        const timerElement = shared.timer.buildTimer(
                          cooldown,
                          "",
                          `rest-timer id-${champId}`,
                          false,
                        );
                        $this.find(".rest-timer").replaceWith(timerElement);
                        shared.timer.activateTimers(`rest-timer.id-${champId}`, () => {});
                      },
                      RequestQueueHandler.PRIORITY_.CRITICAL,
                    );
                    resolve();
                  },
                });
              });
            });
          });
        }
      });
    });
  }
}
