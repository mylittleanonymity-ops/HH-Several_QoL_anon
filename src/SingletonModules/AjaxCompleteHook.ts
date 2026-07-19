import runTimingHandler from "../runTimingHandler";

export default class AjaxCompleteHook {
  private static _instance: AjaxCompleteHook | null = null;
  private _callbacks: Array<
    (event: JQuery.TriggeredEvent, xhr: JQuery.jqXHR, settings: JQuery.AjaxSettings) => void
  > = [];
  private _ajaxHistory: Array<{
    event: JQuery.TriggeredEvent;
    xhr: JQuery.jqXHR;
    settings: JQuery.AjaxSettings;
  }> = [];
  private pendingTrollsRequest: boolean = false;

  private constructor() {
    this._HookAjax();
  }
  private async _HookAjax() {
    await runTimingHandler.afterJQueryLoaded_();
    $(document).ajaxComplete((event, xhr, settings) => {
      if (this._ajaxHistory.length >= 10) {
        this._ajaxHistory.shift();
      }
      this._ajaxHistory.push({ event, xhr, settings });
      this._callbacks.forEach((callback) => callback(event, xhr, settings));
      if (settings.data && settings.data.includes("action=do_battles_trolls")) {
        this.pendingTrollsRequest = false;
      }
    });
    $(document).on("ajaxSend", (event, xhr, settings) => {
      if (settings.data && settings.data.includes("action=do_battles_trolls")) {
        this.pendingTrollsRequest = true;
      }
    });
    window.addEventListener("beforeunload", (e) => {
      if (this.pendingTrollsRequest) {
        e.preventDefault();
        e.returnValue = true; // Triggers browser's default "leave site?" dialog
      }
    });
  }

  public static getInstance_(): AjaxCompleteHook {
    if (!AjaxCompleteHook._instance) {
      AjaxCompleteHook._instance = new AjaxCompleteHook();
    }
    return AjaxCompleteHook._instance;
  }
  public static async init_() {
    if (!AjaxCompleteHook._instance) {
      AjaxCompleteHook._instance = new AjaxCompleteHook();
    }
  }

  public addCallback_(
    callback: (
      event: JQuery.TriggeredEvent,
      xhr: JQuery.jqXHR,
      settings: JQuery.AjaxSettings,
    ) => void,
    replayHistory: boolean = true,
  ): void {
    this._callbacks.push(callback);
    // Replay history for the new callback
    if (replayHistory) {
      this._ajaxHistory.forEach(({ event, xhr, settings }) => {
        callback(event, xhr, settings);
      });
    }
  }
}
