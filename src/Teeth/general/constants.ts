import { getToothRegion } from "./utils";

export const BASE_URL = "https://static.bright-plans.com/3d-player/";

export const TOOTH_REGIONS = {
  UPPER_RIGHT: 1,
  UPPER_LEFT: 2,
  LOWER_LEFT: 3,
  LOWER_RIGHT: 4,
} as const;

export const TEETH_POSITIONS: Record<
  number,
  { x: number; y: number; z: number }
> = {
  11: { x: 238, y: 56, z: 5890 },
  12: { x: 156, y: 80, z: 5880 },
  13: { x: 101, y: 107, z: 5870 },
  14: { x: 72, y: 149, z: 5860 },
  15: { x: 53, y: 186, z: 5850 },
  16: { x: 38, y: 227, z: 5840 },
  17: { x: 33, y: 277, z: 5830 },
  18: { x: 33, y: 314, z: 5820 },

  21: { x: 343, y: 56, z: 5790 },
  22: { x: 423, y: 80, z: 5780 },
  23: { x: 479, y: 107, z: 5770 },
  24: { x: 508, y: 149, z: 5760 },
  25: { x: 526, y: 186, z: 5750 },
  26: { x: 542, y: 227, z: 5740 },
  27: { x: 548, y: 277, z: 5730 },
  28: { x: 548, y: 314, z: 5720 },

  31: { x: 320, y: 835, z: 5690 },
  32: { x: 378, y: 828, z: 5680 },
  33: { x: 426, y: 809, z: 5670 },
  34: { x: 462, y: 769, z: 5660 },
  35: { x: 490, y: 735, z: 5650 },
  36: { x: 515, y: 701, z: 5640 },
  37: { x: 535, y: 653, z: 5630 },
  38: { x: 542, y: 603, z: 5620 },

  41: { x: 260, y: 835, z: 5590 },
  42: { x: 200, y: 828, z: 5580 },
  43: { x: 154, y: 809, z: 5570 },
  44: { x: 120, y: 769, z: 5560 },
  45: { x: 86, y: 735, z: 5550 },
  46: { x: 63, y: 701, z: 5540 },
  47: { x: 43, y: 653, z: 5530 },
  48: { x: 36, y: 603, z: 5520 },
};

export const DRILL_POSITIONS: Record<number, { x: number; y: number }> = {
  11: { x: 259, y: 212 },
  12: { x: 173, y: 226 },
  13: { x: 117, y: 254 },
  14: { x: 91, y: 299 },
  15: { x: 69, y: 335 },
  16: { x: 59, y: 378 },
  17: { x: 52, y: 425 },
  18: { x: 52, y: 468 },
  21: { x: -248, y: 212 },
  22: { x: -166, y: 226 },
  23: { x: -105, y: 254 },
  24: { x: -88, y: 299 },
  25: { x: -67, y: 335 },
  26: { x: -53, y: 378 },
  27: { x: -43, y: 425 },
  28: { x: -43, y: 468 },
  31: { x: -275, y: 741 },
  32: { x: -217, y: 730 },
  33: { x: -167, y: 706 },
  34: { x: -136, y: 670 },
  35: { x: -107, y: 638 },
  36: { x: -87, y: 592 },
  37: { x: -66, y: 547 },
  38: { x: -56, y: 505 },
  41: { x: 283, y: 741 },
  42: { x: 221, y: 730 },
  43: { x: 171, y: 706 },
  44: { x: 142, y: 670 },
  45: { x: 108, y: 638 },
  46: { x: 89, y: 592 },
  47: { x: 67, y: 547 },
  48: { x: 59, y: 505 },
};

export const ExtraSmall_GUMS_POSITIONS: Record<
  number,
  { x: number; y: number; z: number }
> = Object.fromEntries(
  Object.entries(TEETH_POSITIONS).map(([tooth, position]) => [
    tooth,
    { ...position, z: position.z + 1000 },
  ])
);

export const TOOTH_IDS = (() => {
  const ids: number[] = [];
  for (let i = 1; i <= 4; i++) {
    for (let j = 1; j <= 8; j++) ids.push(i * 10 + j);
  }
  return ids;
})();

export const BASE_FILES = ["base", "base-mask", "drill", "laser"];

export const UPPER_TOOTH_IDS = TOOTH_IDS.filter((id) => {
  const region = getToothRegion(id);
  return (
    region === TOOTH_REGIONS.UPPER_LEFT || region === TOOTH_REGIONS.UPPER_RIGHT
  );
});

export const LOWER_TOOTH_IDS = TOOTH_IDS.filter((id) => {
  const region = getToothRegion(id);
  return (
    region === TOOTH_REGIONS.LOWER_RIGHT || region === TOOTH_REGIONS.LOWER_LEFT
  );
});
