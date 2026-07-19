export type commonBulb = {
  type: "scrolls_common";
  value: string; // "1"
};
export type rareBulb = {
  type: "scrolls_rare";
  value: string; // "1"
};
export type epicBulb = {
  type: "scrolls_epic";
  value: string; // "1"
};
export type legendaryBulb = {
  type: "scrolls_legendary";
  value: string; // "1"
};
export type mythicBulb = {
  type: "scrolls_mythic";
  value: string; // "1"
};

export type bulbItem = commonBulb | rareBulb | epicBulb | legendaryBulb | mythicBulb;
