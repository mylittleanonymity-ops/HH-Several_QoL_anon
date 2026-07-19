import { HHModule, HHModule_ConfigSchema, SubSettingsType } from "../base";
import { HHPlusPlusReplacer } from "../utils/HHPlusPlusreplacer";
import { LoveRaidsStorageHandler } from "../utils/StorageHandler";
import { loveRaidsCss } from "../css/modules";
import GameHelpers from "../utils/GameHelpers";
import html from "../utils/html";
import { ReducedLoveRaid } from "../types/storage/love_raids";
import runTimingHandler from "../runTimingHandler";
import { love_raids_type } from "../types/unsafeWindows/love_raids";

declare const love_raids: Array<love_raids_type> | undefined;

type configSchema = {
  baseKey: "loveRaids";
  label: "<span tooltip='Show mysterious raids, CSS tweaks, Hide completed raids ...'>Additional Love Raids tweaks</span>";
  default: true;
  subSettings: [
    {
      key: "hideRaidCardsUntillStart";
      default: false;
      label: `<span tooltip="Hides raids until they start (5min before starting they'll appear)">Hide raids cards until they start</span>`;
    },
  ];
};

export default class LoveRaids extends HHModule {
  readonly configSchema: HHModule_ConfigSchema = {
    baseKey: "loveRaids",
    label:
      "<span tooltip='Show mysterious raids, CSS tweaks, Hide completed raids ...'>Additional Love Raids tweaks</span>",
    default: true,
    subSettings: [
      {
        key: "hideRaidCardsUntillStart",
        default: false,
        label: `<span tooltip="Hides raids (on season, champion etc) until they start (5min before starting they'll appear)">Hide raids cards until they start</span>`,
      },
    ],
  };
  static shouldRun_() {
    return true;
  }
  async run(subSettings: SubSettingsType<configSchema>) {
    if (this._hasRun || !LoveRaids.shouldRun_()) {
      return;
    }
    this._hasRun = true;
    await runTimingHandler.afterGameScriptsRun_();
    if (
      !location.pathname.includes("/home.html") &&
      (unsafeWindow.love_raids === undefined || !love_raids?.length)
    ) {
      return;
    }
    switch (location.pathname) {
      case "/home.html":
        this._homePageModifications();
        break;
      case "/love-raids.html":
        this._loveRaidsPageModifications();
        break;
      default:
        HHPlusPlusReplacer.doWhenSelectorAvailable_("a.love-raid-container.raid", () => {
          this._handleRaidCards(subSettings.hideRaidCardsUntillStart);
        });
        break;
    }
  }
  private _handleRaidCards(hideRaidCardsUntillStart: boolean) {
    if (love_raids === undefined) {
      return;
    }
    const storedRaids = LoveRaidsStorageHandler.getReducedLoveRaids_();
    $("a.love-raid-container.raid").each(function (_index, element) {
      const raidSearchParam = (element as HTMLLinkElement).href.match(/[?&]raid=(\d+)/)?.[1];
      if (!raidSearchParam) {
        return;
      }
      const id = +raidSearchParam;
      const storedRaid = storedRaids.find((raid) => raid.id_raid === id);
      const raid = love_raids.find((raid) => raid.id_raid === id)!;
      handleRaidCards(storedRaid, raid, element as HTMLElement);
    });

    function handleRaidCards(
      storedRaid: ReducedLoveRaid | undefined,
      raid: love_raids_type,
      element: HTMLElement,
    ) {
      console.log("Handling raid card for raid:", storedRaid);
      if (raid.all_is_owned) {
        element.remove();
        return;
      }
      if (raid.status === "upcoming") {
        if (hideRaidCardsUntillStart && raid.seconds_until_event_start > 60 * 5) {
          element.remove();
          return;
        }
      }
      if (storedRaid?.hidden) {
        console.log("Raid is hidden, hiding raid card", element);
        element.style.filter = "opacity(40%) grayscale(100%)";
        element.setAttribute("tooltip", "This raid is marked as hidden");
      }
    }
  }
  private _loveRaidsPageModifications() {
    if (love_raids === undefined) {
      console.log("love_raids data is undefined, cannot modify page");
      return;
    }
    injectCSS();
    const result = updateStorage();
    let currentLoveRaidNotifs = result.loveRaidNotifs;
    let hiddenRaidIds = new Set<number>(
      result.reducedLoveRaids.filter((raid) => raid.hidden).map((raid) => raid.id_raid),
    );
    let hideHiddenRaids = LoveRaidsStorageHandler.getHideHiddenRaids_(); // persisted monkey state
    let hiddenRaidsCss: Element | undefined;
    const refreshHiddenRaidsCss = () => {
      hiddenRaidsCss?.remove();
      if (hideHiddenRaids && hiddenRaidIds.size > 0) {
        const selector = [...hiddenRaidIds].map((id) => `[data-raid-id="${id}"]`).join(",");
        hiddenRaidsCss = GM_addStyle(`${selector}{display:none!important;}`);
      }
    };
    refreshHiddenRaidsCss();
    HHPlusPlusReplacer.doWhenSelectorAvailable_(".raid-card", () => {
      modifyPageWithoutGirlDict();
      unsafeWindow.HHPlusPlus?.Helpers?.getGirlDictionary().then((girlDict: any) => {
        modifyPageWithGirlDict(girlDict);
      });
    });

    function modifyPageWithGirlDict(girlDict: any) {
      if (love_raids === undefined) {
        return;
      }
      const girls = love_raids.map((raid) => girlDict.get(raid.id_girl.toString()));
      $(".raid-card").each((index, raidCard) => {
        if (!girls[index]) {
          return;
        }
        const $raidCard = $(raidCard);
        const { name, shards, skins } = girls[index];
        const {
          id_girl,
          girl_data: { grade_skins },
        } = love_raids[index];
        const haremLink = shared.general.getDocumentHref(`/characters/${id_girl}`);
        const wikiLink = GameHelpers.getWikiPageForCurrentGame(name);

        if (grade_skins.length && !raidCard.classList.contains("multiple-girl") && skins) {
          const skinsList = skins as Array<{
            id_girl_grade_skin: number;
            num_order: number;
            girl_grade_num: number;
            grade_skin_name: string;
            shards_count: number;
            is_selected: boolean;
          }>;
          // Find the lowest num_order that has shards_count != 33
          const nextSkin = skinsList.filter((skin) => skin.shards_count !== 33)[0];

          const leftImage = $(raidCard.querySelector(".girl-img.left")!);
          raidCard.classList.add("multiple-girl");
          raidCard.classList.remove("single-girl");
          $raidCard.find("div.raid-content").append(
            $(html`
              <div class="right-girl-container">
                <img
                  class="girl-img right"
                  src="${IMAGES_URL}/pictures/girls/${id_girl}/grade_skins/grade_skin${nextSkin.num_order}.png"
                  alt="Right"
                  style="margin-top: ${leftImage.css("marginTop")}"
                />
              </div>
            `),
          );
          $raidCard.find(".info-box .info-container .classic-girl").after(
            $(html`
              <div class="classic-girl">
                <div class="shards-container">
                  <div class="progress-container">
                    <div class="shards_bar_wrapper">
                      <div class="shards">
                        <span class="skins_shard_icn"></span>
                        <p><span>${nextSkin.shards_count}/33</span></p>
                      </div>
                      <div class="shards_bar skins-shards">
                        <div
                          class="bar basic-progress-bar-fill pink"
                          style="width: ${(nextSkin.shards_count / 33) * 100}%"
                        ></div>
                      </div>
                    </div>
                  </div>
                  <a href="" class="redirect_button blue_button_L" disabled="">Go</a>
                </div>
                <div class="border-bottom"></div>
              </div>
            `),
          );
        }
        const objectives = raidCard.querySelectorAll(".classic-girl");
        const girl = objectives[0];
        const skin = objectives[1];
        // @prettier-ignore
        //raidCard.querySelector(".raid-name > span > span")!.textContent = `${name} ${GT.design.love_raid}`;
        HHPlusPlusReplacer.doWhenSelectorAvailable_(".raid-name span span", () => {
          $raidCard.find(".raid-name > span > span").first().text(`${name} ${GT.design.love_raid}`);
          if (wikiLink) {
            $raidCard
              .find(".girl-name")
              .html(html`<a href="${wikiLink}" target="_blank">${name}</a>`);
          }
        });

        // add go buttons if there aren't any
        addMissingGoButton(girl);
        addMissingGoButton(skin);

        // enable go buttons of owned girls/skins
        const goButtons = raidCard.querySelectorAll(
          ".redirect_button",
        ) as NodeListOf<HTMLLinkElement>;
        if (shards === 100) {
          if (girl) {
            (girl.querySelector(".objective") as HTMLElement).innerText =
              GT.design.girl_town_event_owned_v2;
            goButtons[0].removeAttribute("disabled");
            goButtons[0].href = haremLink;
          }
          if (skin) {
            const skinProgressOrNull = (
              skin.querySelector(".shards_bar .bar") as HTMLDivElement | null
            )?.style?.width;
            if (skinProgressOrNull) {
              if (parseFloat(skinProgressOrNull) === 100) {
                goButtons[1].removeAttribute("disabled");
                goButtons[1].href = haremLink;
              }
            }
          }
        }
      });
    }
    function modifyPageWithoutGirlDict() {
      handleHidingCompletedRaids();
      HHPlusPlusReplacer.doWhenSelectorAvailable_(
        // removes the eye from HH++
        ".raid-content > .eye.btn-control",
        ($els) => {
          $els.remove();
        },
      );
      HHPlusPlusReplacer.doWhenSelectorAvailable_(".raid-card", () => {
        if (love_raids === undefined) {
          return;
        }
        $(".raid-card").each((index, element) => {
          const raidData = love_raids[index];
          if (raidData === undefined) {
            console.warn("love_raids data is undefined for index ", index);
            return;
          }
          const $element = $(element);
          $element.attr("data-raid-id", raidData.id_raid.toString());
          if (!raidData.all_is_owned) {
            showGirlAvatarForHidden(raidData, $element);
            HHPlusPlusReplacer.doWhenSelectorAvailable_(".raid-name > .type_icon", () => {
              addNotificationForFavoriteRaid(raidData, $element);
            });
            return;
          }
          // Notif for "favorite" raids
        });
        function setRaidHiddenState(raidId: number, hidden: boolean) {
          const reduced = LoveRaidsStorageHandler.getReducedLoveRaids_();
          const updated = reduced.map((raid) =>
            raid.id_raid === raidId ? { ...raid, hidden } : raid,
          );
          LoveRaidsStorageHandler.setReducedLoveRaids_(updated);
          if (hidden) {
            hiddenRaidIds.add(raidId);
          } else {
            hiddenRaidIds.delete(raidId);
          }
          refreshHiddenRaidsCss();
        }
        function showGirlAvatarForHidden(raidData: love_raids_type, $element: JQuery<HTMLElement>) {
          if (raidData.announcement_type_name !== "full" && raidData.status !== "ongoing") {
            // mysterious ones
            const $girlImg = $element.find(".girl-img.avatar");
            $girlImg.attr("src", `${IMAGES_URL}/pictures/girls/${raidData.id_girl}/ava0.png`); // set the image to normal avatar
            if ($girlImg.css("visibility") === "hidden") {
              // sometimes hidden by default ?
              $girlImg.css("visibility", "visible");
            }
          }
        }
        function addNotificationForFavoriteRaid(
          raidData: love_raids_type,
          $element: JQuery<HTMLElement>,
        ) {
          const $raidName = $element.find(".raid-name");
          if (currentLoveRaidNotifs.includes(raidData.id_raid)) {
            $raidName.attr("data-notify", "true");
          }
          const $notifyToggle = $(
            html`<span
              tooltip="Toggle favorite (shows an indicator on home page when raid is ongoing)"
              class="notify-toggle"
            ></span>`,
          );
          $notifyToggle.on("click", (event) => {
            event.stopPropagation();
            if (currentLoveRaidNotifs.includes(raidData.id_raid)) {
              currentLoveRaidNotifs = currentLoveRaidNotifs.filter((id) => id !== raidData.id_raid);
              $raidName.attr("data-notify", "false");
            } else {
              currentLoveRaidNotifs.push(raidData.id_raid);
              $raidName.attr("data-notify", "true");
            }
            LoveRaidsStorageHandler.setLoveRaidNotifications_(currentLoveRaidNotifs);
          });
          $raidName.append($notifyToggle);

          // Visibility toggle per raid
          const isHidden = hiddenRaidIds.has(raidData.id_raid);
          const $visibilityToggle = $(
            html`<span tooltip="Toggle raid visibility" class="raid-visibility-toggle"
              >${isHidden ? "🙈" : "🐵"}</span
            >`,
          );
          $visibilityToggle.on("click", (event) => {
            event.stopPropagation();
            const newHidden = !hiddenRaidIds.has(raidData.id_raid);
            setRaidHiddenState(raidData.id_raid, newHidden);
            $visibilityToggle.text(newHidden ? "🙈" : "🐵");
          });
          $raidName.append($visibilityToggle);
        }
      });
    }
    function addMissingGoButton(element: Element | null) {
      if (element && !$(element).find(".redirect_button").length) {
        $(element)
          .find(".shards-container")
          .append(html`<a class="redirect_button blue_button_L" disabled>Go</a>`);
      }
    }
    async function injectCSS() {
      GM_addStyle(`.notify-toggle {background-image: url(${IMAGES_URL}/ic_new.png);`);
      GM_addStyle(loveRaidsCss);
    }
    function updateStorage() {
      // clean up notifications for raids that no longer exist
      const loveRaidNotifs = LoveRaidsStorageHandler.getLoveRaidNotifications_();
      const previousReduced = LoveRaidsStorageHandler.getReducedLoveRaids_();
      const previousHiddenById = new Map<number, boolean>(
        previousReduced.map((r) => [r.id_raid, !!r.hidden]),
      );
      let currentLoveRaidNotifs = loveRaidNotifs.filter((id) =>
        love_raids!.some((raid) => raid.id_raid === id),
      ); // can also be used later in the script
      LoveRaidsStorageHandler.setLoveRaidNotifications_(currentLoveRaidNotifs);
      const reducedLoveRaids = love_raids!.map((raid) => {
        const { id_raid, all_is_owned } = raid;
        let start, end;
        if (raid["status"] === "ongoing") {
          const { seconds_until_event_end } = raid;
          start = 0; // irrelevant since it is running
          end = server_now_ts + seconds_until_event_end;
        } else {
          const { event_duration_seconds, seconds_until_event_start } = raid;
          start = server_now_ts + seconds_until_event_start;
          end = start + event_duration_seconds;
        }
        const hidden = previousHiddenById.get(id_raid) ?? false;
        return { all_is_owned, id_raid, start, end, hidden };
      });
      LoveRaidsStorageHandler.setReducedLoveRaids_(reducedLoveRaids);
      return { reducedLoveRaids, loveRaidNotifs };
    }
    function handleHidingCompletedRaids() {
      let shouldHideCompletedRaids = LoveRaidsStorageHandler.getShouldHideCompletedRaids_();
      let hidingCss: Element | undefined;
      if (shouldHideCompletedRaids) {
        hidingCss = GM_addStyle(`.raid-card.grey-overlay{display:none!important;}`);
      }
      HHPlusPlusReplacer.doWhenSelectorAvailable_(".head-section > a", ($element) => {
        const $toggle = $(html`
          <div
            class="eye btn-control love-raids-hide-completed-btn"
            tooltip="Toggle hiding completed raids"
          >
            <img
              src="${IMAGES_URL}/quest/${shouldHideCompletedRaids
                ? "ic_eyeopen"
                : "ic_eyeclosed"}.svg"
            />
          </div>
        `);
        $element.after($toggle);
        $toggle.on("click", () => {
          shouldHideCompletedRaids = !shouldHideCompletedRaids;
          LoveRaidsStorageHandler.setShouldHideCompletedRaids_(shouldHideCompletedRaids);
          $toggle
            .find("img")
            .attr(
              "src",
              `${IMAGES_URL}/quest/${shouldHideCompletedRaids ? "ic_eyeopen" : "ic_eyeclosed"}.svg`,
            );
          if (shouldHideCompletedRaids) {
            hidingCss = GM_addStyle(`.raid-card.grey-overlay{display:none!important;}`);
          } else {
            hidingCss?.remove();
          }
        });

        // Global monkey toggle: OFF (🐵) shows hidden raids, ON (🙈) hides them
        const $visibilityToggle = $(html`
          <div
            class="btn-control love-raids-visibility-toggle"
            tooltip="Show/hide raids marked as 🙈"
            style="margin-left: 10px; cursor: pointer; font-size: 1.5rem; line-height: 1;"
          ></div>
        `);
        const updateMonkeyIcon = () => {
          $visibilityToggle.text(hideHiddenRaids ? "🙈" : "🐵");
        };
        updateMonkeyIcon();
        $toggle.after($visibilityToggle);
        $visibilityToggle.on("click", () => {
          hideHiddenRaids = !hideHiddenRaids;
          updateMonkeyIcon();
          refreshHiddenRaidsCss();
          LoveRaidsStorageHandler.setHideHiddenRaids_(hideHiddenRaids);
        });
      });
    }
  }
  private _homePageModifications() {
    console.log("Modifying home page for love raids notifications");
    const raids = LoveRaidsStorageHandler.getReducedLoveRaids_();
    const raidNotifs = LoveRaidsStorageHandler.getLoveRaidNotifications_();
    HHPlusPlusReplacer.doWhenSelectorAvailable_(`.raids`, () => {
      if (raids.length !== 0 && raidNotifs.length !== 0) {
        setRaidNotif();
      }
      if (raids.length !== 0) {
        setNonCompletedRaidCounts();
      }
    });

    function setNonCompletedRaidCounts() {
      const { ongoing_love_raids_count, upcoming_love_raids_count } = unsafeWindow;
      let expired = 0,
        ongoing = 0,
        upcoming = 0;
      raids.forEach((raid) => {
        if (raid.end < server_now_ts) {
          expired += 1;
        } else if (raid.all_is_owned || raid.hidden) {
          // don't care
        } else if (raid.start < server_now_ts) {
          ongoing += 1;
        } else {
          upcoming += 1;
        }
      });
      const outdated =
        raids.length - expired < ongoing_love_raids_count + upcoming_love_raids_count;
      const $raidAmounts = $(`.raids .raids-amount`);
      console.log("raid amounts:", $raidAmounts);
      $raidAmounts
        .first()
        .html(
          html`<span ${outdated ? 'style="color:pink"' : ""}>${ongoing}</span> ${GT.design
              .love_raid}`,
        );
      $raidAmounts
        .last()
        .html(
          html`<span ${outdated ? 'style="color:pink"' : ""}>${upcoming}</span> ${GT.design
              .upcoming_love_raids}`,
        );
    }
    function setRaidNotif() {
      const showNotif = raids.reduce((result, raid) => {
        const ongoing = raid.start < server_now_ts && raid.end > server_now_ts;
        if (ongoing && raidNotifs.includes(raid.id_raid) && !raid.all_is_owned && !raid.hidden) {
          if (raid.end > server_now_ts) {
            return true;
          }
        }
        return result;
      }, false);
      if (showNotif) {
        $(".raids").append(
          html`<img
            class="new_notif"
            src="${IMAGES_URL}/ic_new.png"
            style="position: relative;"
            alt="!"
          />`,
        );
      }
    }
  }
}
