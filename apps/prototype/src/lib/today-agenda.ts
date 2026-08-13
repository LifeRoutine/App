import { eventsOnDate, localDateISO } from "@/lib/plan-dates";
import { itemsOnList, SHOP_LISTS } from "@/lib/shop-lists";
import type { AppState, PriorityKind } from "@/lib/types";
import { classifyWasteBin, wasteBinLabel } from "@/lib/waste-bins";

export type AgendaKind = PriorityKind | "urlaub" | "muell" | "ferien";

export type AgendaItem = {
  id: string;
  kind: AgendaKind;
  title: string;
  detail: string;
  href: string;
};

function formatDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}

function monthsBefore(iso: string, months: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() - months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Was heute wirklich ansteht — Alltagssprache, keine €/Min-Kacheln. */
export function buildTodayAgenda(
  state: AppState,
  today = localDateISO(),
): AgendaItem[] {
  const items: AgendaItem[] = [];
  const todayEvents = eventsOnDate(state.events, today, today);

  for (const ev of todayEvents) {
    const bin =
      ev.wasteBin ??
      (ev.source === "ics" ? classifyWasteBin(ev.title) : null);
    if (bin || ev.source === "ics") {
      items.push({
        id: ev.id,
        kind: "muell",
        title: bin ? `${wasteBinLabel[bin]} rausstellen` : ev.title,
        detail: "Heute Abfuhr — Tonne rechtzeitig raus.",
        href: "/plan",
      });
      continue;
    }
    if (ev.source === "vacation") {
      const who =
        state.members.find((m) => m.id === ev.memberId)?.name ?? "";
      items.push({
        id: ev.id,
        kind: "urlaub",
        title: ev.title,
        detail: who ? `${who} ist heute nicht da.` : "Urlaub — heute.",
        href: "/plan",
      });
      continue;
    }
    if (ev.source === "school") {
      items.push({
        id: ev.id,
        kind: "ferien",
        title: ev.title,
        detail: "Schulferien — heute frei.",
        href: "/plan",
      });
      continue;
    }
    if (ev.source === "schoolcal") {
      const who =
        state.members.find((m) => m.id === ev.memberId)?.name ?? "Kind";
      items.push({
        id: ev.id,
        kind: "termin",
        title: ev.time && ev.time !== "00:00" ? `${ev.time} ${ev.title}` : ev.title,
        detail: `Schule · ${who}`,
        href: "/plan",
      });
      continue;
    }
    if (ev.source === "personal") {
      const who = state.members.find((m) => m.id === ev.memberId)?.name;
      items.push({
        id: ev.id,
        kind: "termin",
        title: ev.time && ev.time !== "00:00" ? `${ev.time} ${ev.title}` : ev.title,
        detail: who ? `Kalender · ${who}` : "Eigener Kalender",
        href: "/plan",
      });
      continue;
    }
    const who = state.members.find((m) => m.id === ev.memberId)?.name;
    items.push({
      id: ev.id,
      kind: "termin",
      title: ev.time && ev.time !== "00:00" ? `${ev.time} ${ev.title}` : ev.title,
      detail: who ?? ev.detail ?? "Im Plan eingetragen.",
      href: "/plan",
    });
  }

  const meal = state.mealPlan.find((m) => m.dayLabel === "Heute");
  if (meal) {
    items.push({
      id: meal.id,
      kind: "essen",
      title: `Heute: ${meal.title}`,
      detail: meal.missing.length
        ? `Noch fehlen: ${meal.missing.join(", ")}`
        : meal.note || `${meal.minutes} Min.`,
      href: meal.recipeId ? `/essen/${meal.recipeId}` : "/einkauf/essensplan",
    });
  }

  const openShop = state.shoppingList.filter((i) => !i.checked);
  if (openShop.length > 0) {
    const lists = SHOP_LISTS.filter(
      (l) => itemsOnList(openShop, l.id).length > 0,
    ).map((l) => l.label);
    const names = openShop
      .slice(0, 3)
      .map((i) => i.name)
      .join(", ");
    items.push({
      id: "shop-open",
      kind: "einkauf",
      title:
        openShop.length === 1
          ? "1 Ding auf der Liste"
          : `${openShop.length} Dinge auf der Liste`,
      detail:
        (lists.length > 1 ? `${lists.join(" · ")} — ` : "") +
        names +
        (openShop.length > 3 ? " …" : ""),
      href: "/einkauf",
    });
  }

  const openRoutine = state.routines.find((r) => !r.done);
  if (openRoutine) {
    const who =
      state.members.find((m) => m.id === openRoutine.memberId)?.name ??
      openRoutine.assignee;
    items.push({
      id: openRoutine.id,
      kind: "haushalt",
      title: openRoutine.title,
      detail: who
        ? `${who} · ${openRoutine.dueLabel}`
        : openRoutine.dueLabel,
      href: "/zuhause",
    });
  }

  for (const doc of state.documents) {
    const warnFrom = monthsBefore(doc.expiresOn, doc.warnMonths);
    if (today >= warnFrom && today <= doc.expiresOn) {
      items.push({
        id: doc.id,
        kind: "frist",
        title: doc.title,
        detail: `Läuft ${formatDay(doc.expiresOn)} ab. ${doc.warnLabel}.`,
        href: "/plan",
      });
    }
  }

  return items.slice(0, 6);
}

export const agendaKindLabel: Record<AgendaKind, string> = {
  termin: "Termin",
  einkauf: "Einkauf",
  haushalt: "Zuhause",
  frist: "Frist",
  essen: "Essen",
  urlaub: "Urlaub",
  muell: "Müll",
  ferien: "Ferien",
};
