export type ReducedLoveRaid = {
  all_is_owned: boolean;
  id_raid: number;
  start: number;
  end: number;
  hidden?: boolean;
};

export type ReducedLoveRaids = Array<ReducedLoveRaid>;
