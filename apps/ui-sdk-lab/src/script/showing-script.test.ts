import { expect, test } from "vitest"
import { emptyShowing, filledShowing, orderAfterMove, showingScript } from "./showing-script"

test("the script names each control once, in fill order", () => {
  expect(showingScript.map((step) => step.ref)).toEqual([
    "Unit",
    "Showing type",
    "Showing date",
    "Guest",
    "Tour stops",
  ])
  expect(new Set(showingScript.map((step) => step.id)).size).toBe(showingScript.length)
})

test("the filled showing moves Keys to index 1", () => {
  expect(filledShowing.stops).toEqual(orderAfterMove(emptyShowing.stops, "keys", 1))
  expect(filledShowing.stops).toEqual(["lobby", "keys", "walk", "roof"])
})
