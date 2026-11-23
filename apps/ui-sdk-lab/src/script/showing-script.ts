export type ScriptStep = {
  id: string
  title: string
  ref: string
  action: string
  args: unknown[]
}

export const showingScript: ScriptStep[] = [
  {
    id: "unit",
    title: "Assign Kiln 12",
    ref: "Unit",
    action: "setValue",
    args: ["Kiln 12"],
  },
  {
    id: "type",
    title: "Choose an in-person showing",
    ref: "Showing type",
    action: "setValue",
    args: ["In person"],
  },
  {
    id: "date",
    title: "Set the date to 4 Dec 2026",
    ref: "Showing date",
    action: "setValue",
    args: ["2026-12-04"],
  },
  {
    id: "guest",
    title: "Name the guest Mina Cho",
    ref: "Guest",
    action: "setValue",
    args: ["Mina Cho"],
  },
  {
    id: "stops",
    title: "Move Keys to just after the lobby",
    ref: "Tour stops",
    action: "moveStop",
    args: ["Keys", 1],
  },
]

export const emptyShowing = {
  unit: null as string | null,
  showingType: null as string | null,
  date: null as string | null,
  guest: "",
  stops: ["lobby", "walk", "roof", "keys"],
}

export function orderAfterMove(
  order: readonly string[],
  key: string,
  index: number,
): string[] {
  const next = order.filter((item) => item !== key)
  next.splice(index, 0, key)
  return next
}

export const filledShowing = {
  unit: "kiln-12",
  showingType: "in-person",
  date: "2026-12-04",
  guest: "Mina Cho",
  stops: orderAfterMove(emptyShowing.stops, "keys", 1),
}
