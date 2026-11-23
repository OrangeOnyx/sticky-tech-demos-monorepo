import { checkDirection, checkServer, mount } from "@ui-sdk/core/testing"
import { expect, test } from "vitest"
import { orderAfterMove } from "../script/showing-script"
import { tourStops } from "./tour-stops"

const labels = {
  lobby: "Meet at lobby",
  walk: "Walk the unit",
  roof: "Roof deck",
  keys: "Keys",
}

const markup = `<root aria-label="Tour stops"><item value="lobby">Meet at lobby</item><item value="walk">Walk the unit</item><item value="roof">Roof deck</item><item value="keys">Keys</item></root>`

test("moveStop puts Keys after the lobby", () => {
  const view = mount(
    tourStops,
    { defaultValue: ["lobby", "walk", "roof", "keys"], labels },
    markup,
  )
  try {
    expect(view.api.moveStop("Keys", 1)).toBe(true)
    expect(view.state.value).toEqual(orderAfterMove(["lobby", "walk", "roof", "keys"], "keys", 1))
  } finally {
    view.unmount()
  }
})

test("Space and arrows reorder a stop from the keyboard", async () => {
  const view = mount(
    tourStops,
    { defaultValue: ["lobby", "walk", "roof", "keys"], labels },
    markup,
  )
  try {
    await view.keys("Tab", "Space", "ArrowDown", "Space")
    expect(view.state.value[0]).not.toBe("lobby")
    expect(view.announced.length).toBeGreaterThan(0)
  } finally {
    view.unmount()
  }
})

test("renders on the server and works in both directions", async () => {
  checkServer(
    tourStops,
    { defaultValue: ["lobby", "walk"], labels },
    `<root aria-label="Tour stops"><item value="lobby">Meet at lobby</item><item value="walk">Walk the unit</item></root>`,
  )
  await checkDirection(
    tourStops,
    { defaultValue: ["lobby", "walk"], labels },
    `<root aria-label="Tour stops"><item value="lobby">Meet at lobby</item><item value="walk">Walk the unit</item></root>`,
  )
})
