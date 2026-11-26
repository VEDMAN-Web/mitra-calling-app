export interface DiamondPackage {
  id: string;
  diamonds: number;
  label: string;
  priceInr: number;
  bestValue?: boolean;
}

export const DIAMOND_PACKAGES: DiamondPackage[] = [
  { id: "starter", diamonds: 100, label: "Starter", priceInr: 49 },
  { id: "popular", diamonds: 250, label: "Popular", priceInr: 99 },
  { id: "extra_value", diamonds: 600, label: "Extra Value", priceInr: 199, bestValue: true },
  { id: "super_pack", diamonds: 1500, label: "Super Pack", priceInr: 399 },
  { id: "mega_pack", diamonds: 3000, label: "Mega Pack", priceInr: 699 },
  { id: "ultimate_pack", diamonds: 7000, label: "Ultimate Pack", priceInr: 1499 },
];

export const DIAMONDS_PER_MINUTE_CALL = 20;
