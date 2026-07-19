import { GirlArmorItem } from "../items";

export type GirlEquipmentListResponse = {
  items: Array<GirlArmorItem & { id_girl_armor: number }>;
  items_count: number; // min is 0 ?, and max is 100
  sorting: string; // mix of sort_by & sorting_order params, e.g. "rarity_desc"
  success: true;
};
