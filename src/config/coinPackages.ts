export interface CoinPackage {
  id: string;
  coins: number;
  label: string;
  priceInr: number;
  bestValue?: boolean;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: "starter", coins: 100, label: "Starter", priceInr: 49 },
  { id: "popular", coins: 250, label: "Popular", priceInr: 99 },
  { id: "extra_value", coins: 600, label: "Extra value", priceInr: 199, bestValue: true },
  { id: "super_pack", coins: 1500, label: "Super pack", priceInr: 399 },
];

export const COINS_PER_MINUTE_CALL = 20;
