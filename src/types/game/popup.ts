export interface popupForQueue {
  popup: {
    $dom_element: JQuery<HTMLElement>; // main injected dom element (?) still has to be attached though it seems
    init: (t: boolean) => void; // only seen it called with false
    onOpen: (...a: any[]) => void; // called after init
    addEventListeners: () => void; // called right after open
    popup_name: string;
    close_on_esc: boolean; // whether it should close when pressing escape or not
    type: "toast" | "common" | "sliding" | "notification";
    onClose: () => void; // called when closing (for example when pressing escape if enabled)
    removeEventListeners: () => void; // called right after closing (even if close was called by destroy)
    destroy: () => void; // useful when you want to put a red cross to close the popup, only called manually
  };
  // creation flow : init(???) -> onOpen() -> addEventListeners()
  // normal close flow : onClose() -> removeEventListeners()
}
