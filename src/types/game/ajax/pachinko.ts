import { equipmentOrbsType, GirlArmorItem, HeroChangesCurrencyUpdate, OrbChangesUpdate } from "..";

// This is pachinko6
export type EquipmentPachinko_AjaxResponse = {
  result: "won";
  success: true;
  rewards: {
    can_play: boolean;
    content_button_data: {
      button_type: number; // only 0 ?
      currency_type: "soft_currency" | "hard_currency";
      game_count: 1 | 2 | 10;
      game_orb_name: equipmentOrbsType;
      game_orbs: -1 | number; // -1 when no more orbs, otherwise number of orbs left
      play: "pachinko6";
      price: number; // Always the koban price even if orbs left
    };
    data: {
      loot: true;
      rewards: Array<{ type: "girl_armor"; value: GirlArmorItem & { id_girl_armor: string } }>;
    };
    heroChangesUpdate: HeroChangesCurrencyUpdate & OrbChangesUpdate;
    is_free: boolean;
    is_pachinko: true;
    play_again: boolean;
    title: string;
  };
};
