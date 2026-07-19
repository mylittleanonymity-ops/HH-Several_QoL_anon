export default class runTimingHandler {
  private static _DomContentLoaded = new Promise<void>((resolve) => {
    if (document.readyState === "loading") {
      unsafeWindow.addEventListener("DOMContentLoaded", () => resolve(), {
        capture: true,
        once: true,
      });
    } else {
      resolve();
    }
  });

  private static _JQueryLoaded = new Promise<void>((resolve) => {
    if (unsafeWindow.$ != null) {
      resolve();
    } else {
      void runTimingHandler._DomContentLoaded.then(() => {
        if (unsafeWindow.$ != null) {
          resolve();
        }
      });
    }
  });

  private static _GameScriptsRun = new Promise<void>((resolve) => {
    void runTimingHandler._JQueryLoaded.then(() => {
      queueMicrotask(() => {
        unsafeWindow.$(() => {
          resolve();
        });
      });
    });
  });

  private static _afterThirdPartyScriptsRun = new Promise<void>((resolve) => {
    void runTimingHandler._GameScriptsRun.then(() => {
      queueMicrotask(() => {
        resolve();
      });
    });
  });

  private static _HHPlusPlusRun = new Promise<boolean>((resolve) => {
    void runTimingHandler._JQueryLoaded.then(() => {
      if (unsafeWindow.HHPlusPlus != null) {
        resolve(true);
      } else {
        $(document).one("hh++-bdsm:loaded", () => resolve(true));
      }
    });
    void runTimingHandler._GameScriptsRun.then(() => {
      queueMicrotask(() => {
        $(() => {
          // last fallback
          if (unsafeWindow.HHPlusPlus != null) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    });
  });

  static afterDomContentLoaded_(): Promise<void> {
    return runTimingHandler._DomContentLoaded;
  }

  static afterJQueryLoaded_(): Promise<void> {
    return runTimingHandler._JQueryLoaded;
  }

  static afterGameScriptsRun_(): Promise<void> {
    return runTimingHandler._GameScriptsRun;
  }

  static afterHHPlusPlusRun_(): Promise<boolean> {
    return runTimingHandler._HHPlusPlusRun;
  }
  static afterThirdPartyScriptsRun_(): Promise<void> {
    return runTimingHandler._afterThirdPartyScriptsRun;
  }
}
