export interface orbsItem {
  type: "orbs";
  orbs_type: allOrbsType;
  value: number; //1;
}
export type allOrbsType =
  | epicOrbsType
  | mythicOrbsType
  | equipmentOrbsType
  | greatOrbsType
  | eventOrbsType;

export type epicOrbsType = "o_e1" | "o_e10" | "o_ed";
export type mythicOrbsType = "o_m1" | "o_m3" | "o_m6";
export type equipmentOrbsType = "o_eq1" | "o_eq2" | "o_eq10";
export type greatOrbsType = "o_g1" | "o_g10";
export type eventOrbsType = "o_v4";
