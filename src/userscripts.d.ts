export declare global {
  let unsafeWindow: UnsafeWindow;

  interface GM_XMLHttpRequestDetails {
    method?: string;
    url: string;
    headers?: Record<string, string>;
    data?: string;
    onload?: (response: GM_XMLHttpRequestResponse) => void;
    onerror?: (error: any) => void;
    ontimeout?: () => void;
    timeout?: number;
  }

  interface GM_XMLHttpRequestResponse {
    responseText: string;
    status: number;
    statusText: string;
    readyState: number;
    responseHeaders: string;
    finalUrl: string;
  }

  function GM_openInTab(url: string, options?: { active: boolean }): void;
  function GM_addStyle(css: string): HTMLStyleElement;
  function GM_setValue(key: string, value: any): void;
  function GM_getValue(key: string, defaultValue?: any): any;
  function GM_deleteValue(key: string): void;
  function GM_listValues(): string[];
  function GM_xmlhttpRequest(details: GM_XMLHttpRequestDetails): void;
  const GM_cookie: any;
  const GM_info: any;
}
