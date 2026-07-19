interface QueuedRequest {
  func: () => Promise<void>;
  priority: number;
}

export default class RequestQueueHandler {
  private static _instance: RequestQueueHandler | null = null;
  private _requestQueue: QueuedRequest[] = [];
  private _isProcessing = false;
  private _DelayBetweenRequests = 100; // milliseconds

  // Priority levels for convenience
  static readonly PRIORITY_ = {
    LOW: 0,
    NORMAL: 5,
    HIGH: 10,
    CRITICAL: 15,
  } as const;

  private constructor() {}

  static getInstance_(): RequestQueueHandler {
    if (this._instance === null) {
      this._instance = new RequestQueueHandler();
    }
    return this._instance;
  }
  public addRequest_(
    requestFunc: () => Promise<void>,
    priority: number = RequestQueueHandler.PRIORITY_.NORMAL,
  ) {
    this._requestQueue.push({ func: requestFunc, priority });
    if (!this._isProcessing) {
      this._processQueue();
    }
  }
  public addAjaxRequest_<T = any>(
    payload: any,
    callback: (response: T) => void,
    priority: number = RequestQueueHandler.PRIORITY_.NORMAL,
  ) {
    return this.addRequest_(
      () =>
        new Promise<void>((resolve) => {
          shared.general.hh_ajax(payload, (response: T) => {
            callback(response);
            resolve();
          });
        }),
      priority,
    );
  }
  private async _processQueue() {
    if (this._isProcessing) {
      return;
    }
    this._isProcessing = true;
    while (this._requestQueue.length > 0) {
      // Find the highest priority request
      let highestPriorityIndex = 0;
      for (let i = 1; i < this._requestQueue.length; i++) {
        if (this._requestQueue[i].priority > this._requestQueue[highestPriorityIndex].priority) {
          highestPriorityIndex = i;
        }
      }
      const queuedRequest = this._requestQueue.splice(highestPriorityIndex, 1)[0];
      try {
        await queuedRequest.func();
        await new Promise((resolve) => setTimeout(resolve, this._DelayBetweenRequests)); // Add a small delay between requests
      } catch (error) {
        console.error("Error processing request:", error);
      }
    }
    this._isProcessing = false;
  }
}
