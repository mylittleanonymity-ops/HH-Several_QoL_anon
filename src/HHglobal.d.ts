import { sharedHeroIncomplete } from "./types";
import { popupForQueue } from "./types/GameTypes";

export declare global {
  const shared: {
    PopupQueueManager: {
      add(options: popupForQueue): void;
      close(options: { type: "toast" | "common" | "sliding" | "notification" }): void; // at the end calls $dom_element.remove()
    };
    general: {
      hc_confirm: (price: string | number, callback?: () => void) => void; // opens the confirm popup for premium spending
      hh_ajax: (options: { [key: string]: any }, callback: (response: any) => void) => void; // jQuery ajax wrapper for HH games
      navigate(url: string): void; // navigate to a new page
      getDocumentHref(url: string): string; // useful for completing sessIds
      objectivePopup: any;
      loadGirlImageSrc(
        img: JQuery<HTMLElement>,
        url: string,
        grade_offsets: Array<number>,
        unknown4: number, //seems to be 0 or 1 (for now only seen 0)
        $parentContainer: JQuery<HTMLElement> = null, // unsure if it has to be the parent container
        unknown6: boolean = false, // unsure of it's purpose ? On love raid pages only called with true, but on main page called with false
      ): void;
      hero_page_popup(option: { id: number; profile_fallback?: boolean }): void;
    };
    reward_popup: any;
    reward: any;
    animations: {
      loadingAnimation: {
        // useful when you don't want the user to do actions
        start(): void;
        stop(): void;
        isLoading: boolean;
      };
    };
    timer: {
      buildTimer(
        timeToFinishInSeconds: number,
        text: string,
        className: string,
        marketClock?: boolean,
      ): string; // returns the html string
      activateTimers(
        className: string, // classname is wonky here. The selector they make adds a dot before it but you can add more after
        callback?: (timer: {
          // Callback by default refreshes the page when timer ends
          $dom_element: JQuery<HTMLElement>; // self
          next_tick: number; // ??
          onComplete: () => void; // the callback
          time_remaining: 0; // should always be 0 here ?
          timeout_id: number; // unknown
        }) => void,
      ): void; // careful to not activate multiple time the same timer
      createTimer(
        parentElement: JQuery<HTMLElement>,
        timeToFinishInSeconds: number,
        unknown?: any, // a function ??? but never gets called or smthing
        unknown2?: any, // doesn't event seem to be passed AT ALL
      ): {
        getState(): {
          $dom_element: JQuery<HTMLElement>;
          time_remaining: number;
          timeout_id: number;
          next_tick?: number;
        };
        //getTotalRemainingTime(): undefined | {}; // don't use
        startTimer(): void;
        updateTimer(newTime: number): void;
        stopTimer(): void; // Makes times entirely display none and stops counting, can be resumed later
        //updateText(): void; // unsure how it works, for now don't use it
        isRunning(): boolean;
      };
    };
    Hero: sharedHeroIncomplete;
    popup_payment: any;
  };

  const GT: any;
  const IMAGES_URL: string; // get the base url for images
  const HH_UNIVERSE: string; // get the string of the current universe (different for games & nutaku vs .com)
  const server_now_ts: number; // Server simply sends Date.now()/1000
  const tutoFeatures: { [key: string]: any };
  const tutorial_keys: Array<string>;
  const tutoData: { [key: string]: any };
  function number_format_lang(num: number): string;
}

interface String {
  toImageUrl(variant: string): string; // only known value is "ava"
}
