export class HHPlusPlusReplacer {
  static doWhenSelectorAvailable_(
    selector: string,
    callback: ($element: JQuery<HTMLElement>) => void,
  ) {
    const $elementOnCall = $(selector);
    if ($elementOnCall.length) {
      callback($elementOnCall);
    } else {
      const observer = new MutationObserver(() => {
        const $elementNow = $(selector);
        if ($elementNow.length) {
          observer.disconnect();
          callback($elementNow);
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  }
  static conditionalDoWhenSelectorAvailable_(
    condition: ($el: JQuery<HTMLElement>) => boolean,
    selector: string,
    callback: ($element?: JQuery<HTMLElement>) => void,
  ) {
    const $elementOnCall = $(selector);
    if (condition($elementOnCall)) {
      callback($elementOnCall);
    } else {
      const observer = new MutationObserver(() => {
        const $elementNow = $(selector);
        if (condition($elementNow)) {
          observer.disconnect();
          callback($elementNow);
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  }
}
