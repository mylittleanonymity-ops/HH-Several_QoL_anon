export interface BaseUnsafeWindow extends Window {
  tutoData: {
    [key: BaseUnsafeWindow["tutorial_keys"][number]]: 0 | 1 | string | boolean | undefined; // what is this shit
  };
  tutorial_keys: Array<string>;
  tutoFeatures: {
    [key: string]: boolean;
  };
  IMAGES_URL: string;
  ON_PROD: boolean;
  platform_name: string;
  PLATFORM_COOKIELESS: boolean;
  void_img: string;
  ENABLE_PUSH_NOTIFICATIONS: boolean;
  FEATURE_SIDE_QUESTS_UNLOCKED: boolean;
  GIRL_PREVIEWS_ENABLED: boolean;
  FEATURE_OFFERS_SHOP: boolean;
  FEATURE_PAYMENTS_AND_HC_FALLBACK: boolean;
  FEATURE_TROLL_PRE_BATTLE_TUTORIAL: boolean;
  EXTENDED_SEASONS_BATTLE_TUTORIAL: boolean;
  FEATURE_MUSIC: boolean;
  REFERRALS_SYSTEM_UNLOCKED: boolean;
  MEMBER_PROGRESSION_REWARDS: boolean;
  HH_UNIVERSE: string;
  HH_MAX_LEVEL: number;
  GIRL_MAX_LEVEL: number;
  GIRL_IMAGE_HEIGHT: number;
  GIRL_CANVAS_HEIGHT: number;
  randomGirlAvatar: string;
}
