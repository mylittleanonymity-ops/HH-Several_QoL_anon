import { HeroClass, Rarity } from "../common";
import { GirlElement } from "../girls";

export type GirlArmorItem =
  | GirlArmorItemCommonRare
  | GirlArmorItemEpic
  | GirlArmorItemLegendary
  | GirlArmorItemMythic;

export type GirlArmorItemEquipped =
  | GirlArmorItemCommonRareEquipped
  | GirlArmorItemEpicEquipped
  | GirlArmorItemLegendaryEquipped
  | GirlArmorItemMythicEquipped;

type GirlArmorItemBase = {
  armor: {
    carac1: number;
    carac2: number;
    carac3: number;
    damage: number;
    defense: number;
    ego: number;
    id_girl_item_armor: 1 | 2 | 3 | 4 | 5;
  };
  carac: {
    carac1: number;
    carac2: number;
    carac3: number;
    damage: number;
    defense: number;
    ego: number;
  };
  id_girl_armor: string | number; // Pretty sure it's a string only in pachinko response
  id_girl_item_armor: 1 | 2 | 3 | 4 | 5;
  id_item_skin: number;
  id_member: number;
  id_variation: number;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  skin: {
    ico: string;
    id_item_skin: number;
    id_skin_set: number;
    identifier: string; //"EA117";
    name: string; //"Luxury handbag";
    release_date: string; //"1900-01-01";
    subtype: number; //6;
    wearer: "girl";
    weight: 1; // ??????
  };
  slot_index: 1 | 2 | 3 | 4 | 5 | 6;
  type: "girl_armor";
};

type GirlArmorItemBaseEquipped = Omit<GirlArmorItemBase, "id_girl_armor"> & {
  id_girl_armor_equipped: number;
  id_girl: number;
};

// Non-equipped variants
export type GirlArmorItemCommonRare = GirlArmorItemBase & {
  armor: {
    rarity: Extract<Rarity, "common" | "rare">;
  };
  rarity: Extract<Rarity, "common" | "rare">;
  resonance_bonuses: [];
  variation: null;
};

export type GirlArmorItemEpic = GirlArmorItemBase & {
  armor: {
    rarity: Extract<Rarity, "epic">;
  };
  rarity: Extract<Rarity, "epic">;
  resonance_bonuses: {
    class: {
      identifier: "1" | "2" | "3";
      resonance: "ego";
      bonus: number;
    };
  };
  variation: {
    class: HeroClass;
    class_resonance: "ego";
    element: null;
    element_resonance: null;
    figure: null;
    figure_resonance: null;
    id_variation: number; //1;
    rarity: Extract<Rarity, "epic">;
  };
};

export type GirlArmorItemLegendary = GirlArmorItemBase & {
  armor: {
    rarity: Extract<Rarity, "legendary">;
  };
  rarity: Extract<Rarity, "legendary">;
  resonance_bonuses: {
    class: {
      identifier: "1" | "2" | "3";
      resonance: "ego";
      bonus: number;
    };
    element: {
      identifier: string; //null;
      resonance: "defense";
      bonus: number;
    };
  };
  variation: {
    class: HeroClass;
    class_resonance: "ego";
    element: GirlElement; //null;
    element_resonance: "defense";
    figure: null;
    figure_resonance: null;
    id_variation: number; //23;
    rarity: Extract<Rarity, "legendary">;
  };
};

export type GirlArmorItemMythic = GirlArmorItemBase & {
  armor: {
    rarity: Extract<Rarity, "mythic">;
  };
  rarity: Extract<Rarity, "mythic">;
  resonance_bonuses: {
    class: {
      identifier: "1" | "2" | "3";
      resonance: "ego";
      bonus: number;
    };
    element: {
      identifier: string;
      resonance: "defense";
      bonus: number;
    };
    figure: {
      identifier: string;
      resonance: "damage";
      bonus: number;
    };
  };
  variation: {
    class: HeroClass;
    class_resonance: "ego";
    element: GirlElement; //null;
    element_resonance: "defense";
    figure: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    figure_resonance: "damage";
    id_variation: number; //41;
    rarity: Extract<Rarity, "mythic">;
  };
};

// Equipped variants
type GirlArmorItemCommonRareEquipped = GirlArmorItemBaseEquipped & {
  armor: {
    rarity: Extract<Rarity, "common" | "rare">;
  };
  rarity: Extract<Rarity, "common" | "rare">;
  resonance_bonuses: [];
  variation: null;
};

type GirlArmorItemEpicEquipped = GirlArmorItemBaseEquipped & {
  armor: {
    rarity: Extract<Rarity, "epic">;
  };
  rarity: Extract<Rarity, "epic">;
  resonance_bonuses: {
    class: {
      identifier: "1" | "2" | "3";
      resonance: "ego";
      bonus: number;
    };
  };
  variation: {
    class: HeroClass;
    class_resonance: "ego";
    element: null;
    element_resonance: null;
    figure: null;
    figure_resonance: null;
    id_variation: number; //1;
    rarity: Extract<Rarity, "epic">;
  };
};

type GirlArmorItemLegendaryEquipped = GirlArmorItemBaseEquipped & {
  armor: {
    rarity: Extract<Rarity, "legendary">;
  };
  rarity: Extract<Rarity, "legendary">;
  resonance_bonuses: {
    class: {
      identifier: "1" | "2" | "3";
      resonance: "ego";
      bonus: number;
    };
    element: {
      identifier: string; //null;
      resonance: "defense";
      bonus: number;
    };
  };
  variation: {
    class: HeroClass;
    class_resonance: "ego";
    element: GirlElement; //null;
    element_resonance: "defense";
    figure: null;
    figure_resonance: null;
    id_variation: number; //23;
    rarity: Extract<Rarity, "legendary">;
  };
};

type GirlArmorItemMythicEquipped = GirlArmorItemBaseEquipped & {
  armor: {
    rarity: Extract<Rarity, "mythic">;
  };
  rarity: Extract<Rarity, "mythic">;
  resonance_bonuses: {
    class: {
      identifier: "1" | "2" | "3";
      resonance: "ego";
      bonus: number;
    };
    element: {
      identifier: string;
      resonance: "defense";
      bonus: number;
    };
    figure: {
      identifier: string;
      resonance: "damage";
      bonus: number;
    };
  };
  variation: {
    class: HeroClass;
    class_resonance: "ego";
    element: GirlElement; //null;
    element_resonance: "defense";
    figure: number;
    figure_resonance: "damage";
    id_variation: number; //41;
    rarity: Extract<Rarity, "mythic">;
  };
};
