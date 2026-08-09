import type { AppState, PantryItem, ShopOffer } from "@/lib/types";

/** Demo-/Listen-Angebot zu einem Vorratsartikel (Name-Match). */
export function offerForPantryItem(
  state: AppState,
  item: PantryItem,
): ShopOffer | null {
  const preferred = new Set(state.profile.preferredStoreIds);
  const onList = state.shoppingList.find(
    (s) =>
      s.name.toLowerCase() === item.name.toLowerCase() &&
      s.offer &&
      preferred.has(s.offer.storeId),
  );
  return onList?.offer ?? null;
}

export function pantryBuyHints(state: AppState): {
  item: PantryItem;
  offer: ShopOffer;
}[] {
  return state.pantry
    .filter((p) => p.amount < p.minAmount)
    .map((item) => {
      const offer = offerForPantryItem(state, item);
      return offer && offer.advice === "kaufen" ? { item, offer } : null;
    })
    .filter((x): x is { item: PantryItem; offer: ShopOffer } => x != null);
}
