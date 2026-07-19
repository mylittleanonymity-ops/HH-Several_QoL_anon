export interface Objective {
  name: string;
  points_gained: number;
  title: string;
}

export interface ObjectivePoints {
  // incomplete, missing at least: LS, DP
  contest?: Objective;
  path_event?: Objective;
  path_of_glory?: Objective;
  path_of_valor?: Objective;
  seasonal_event?: Objective;
}
