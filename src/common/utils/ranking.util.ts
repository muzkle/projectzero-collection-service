import { Rarity } from '@muzkle/contracts';

export const RARITY_SCORE: Record<Rarity, number> = {
  [Rarity.COMMON]: 1,
  [Rarity.RARE]: 3,
  [Rarity.EPIC]: 7,
  [Rarity.LEGENDARY]: 15,
};

export function scoreForRarity(rarity: Rarity): number {
  return RARITY_SCORE[rarity] ?? 1;
}
