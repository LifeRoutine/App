import type { ShopItem, ShopListId } from "@/lib/types";

export type { ShopListId };

export const SHOP_LISTS: { id: ShopListId; label: string; hint: string }[] = [
  { id: "einkauf", label: "Einkauf", hint: "Supermarkt" },
  { id: "baumarkt", label: "Baumarkt", hint: "Schrauben, Farbe, …" },
  { id: "reise", label: "Reise", hint: "Was mit muss" },
];

export function shopListId(item: Pick<ShopItem, "listId">): ShopListId {
  return item.listId === "baumarkt" || item.listId === "reise"
    ? item.listId
    : "einkauf";
}

export function shopListLabel(id: ShopListId): string {
  return SHOP_LISTS.find((l) => l.id === id)?.label ?? "Einkauf";
}

export function itemsOnList(items: ShopItem[], listId: ShopListId): ShopItem[] {
  return items.filter((i) => shopListId(i) === listId);
}
