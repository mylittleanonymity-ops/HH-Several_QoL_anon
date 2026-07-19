export class TooltipHook {
  private static _instance: TooltipHook | null = null;
  currentTarget: HTMLElement | null = null;
  tooltipOverrides: Array<{
    selector: string;
    override: (currentTarget: HTMLElement, tooltipElement: HTMLElement) => void;
  }> = [];

  private constructor() {
    this._hookTooltip();
  }

  public static getInstance_(): TooltipHook {
    if (!TooltipHook._instance) {
      TooltipHook._instance = new TooltipHook();
    }
    return TooltipHook._instance;
  }

  public addTooltipOverride_(
    elementSelector: string,
    tooltipSelector: string,
    override: (currentTarget: HTMLElement, tooltipElement: HTMLElement) => void,
  ) {
    $("body").on("mouseenter touchstart", elementSelector, (e) => {
      this.currentTarget = e.currentTarget;
    });
    this.tooltipOverrides.push({ selector: tooltipSelector, override });
  }

  private async _hookTooltip() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (
            node.nodeType === 1 &&
            (node as Element).matches?.(".hh_tooltip_new.QoL-custom-tooltip")
          ) {
            for (const { selector, override } of this.tooltipOverrides) {
              if ((node as HTMLElement).matches(selector) && this.currentTarget) {
                override(this.currentTarget, node as HTMLElement);
              }
            }
          }
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
    });
  }
}
