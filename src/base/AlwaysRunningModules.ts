export abstract class AlwaysRunningModule {
  protected _hasRun = false;
  abstract run_(): void;
}
