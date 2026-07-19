export interface GirlGlobalStorageSkin {
  skinIco?: string;
  id_girl_grade_skin: number;
  shards: number;
  num_order: number;
  skinPose?: string;
}

export interface GirlGlobalStorageEntry {
  name: string;
  rarity: number;
  ico?: string;
  poseImage?: string;
  shards?: number;
  skins?: GirlGlobalStorageSkin[];
}

export type GirlGlobalStorage = Record<string, GirlGlobalStorageEntry>;
