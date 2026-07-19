export interface HHModule_ConfigSchema {
  baseKey: string;
  label: string;
  default: boolean;
  subSettings?: readonly {
    key: string;
    default: boolean;
    label: string;
  }[];
}

export type SubSettingsType<T extends HHModule_ConfigSchema> = T["subSettings"] extends readonly {
  key: string;
  default: boolean;
  label: string;
}[]
  ? { [K in T["subSettings"][number]["key"]]: boolean }
  : undefined;

export abstract class HHModule {
  public group = "severalQoL";
  protected _hasRun = false;

  abstract readonly configSchema: HHModule_ConfigSchema;
  abstract run(subSettings: any /*SubSettingsType<HHModule_ConfigSchema>*/): void;
  //static shouldRun_(): boolean; < NEEDS to be defined as static
}
