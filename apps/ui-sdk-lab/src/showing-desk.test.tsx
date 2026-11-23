import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test } from "vitest"
import { agent } from "./agent"
import { filledShowing } from "./script/showing-script"
import { ShowingDesk } from "./showing-desk"

test("typing in Unit filters the list", async () => {
  const user = userEvent.setup()
  render(<ShowingDesk />)
  await user.click(screen.getByRole("combobox", { name: "Unit" }))
  await user.type(screen.getByRole("combobox", { name: "Unit" }), "kil")
  expect(screen.getByRole("option", { name: /Kiln 12/ })).toBeTruthy()
  expect(screen.queryByRole("option", { name: /Lumen 204/ })).toBeNull()
  expect(screen.queryByRole("option", { name: /Cedar 88/ })).toBeNull()
})

test("clicking a filtered unit selects it", async () => {
  const user = userEvent.setup()
  render(<ShowingDesk />)
  const input = screen.getByRole("combobox", { name: "Unit" })
  await user.click(input)
  await user.type(input, "kil")
  await user.click(screen.getByRole("option", { name: /Kiln 12/ }))
  const unit = agent.snapshot().find((entry) => entry.label === "Unit" && !entry.offPage)
  expect(unit?.value, JSON.stringify(unit)).toBe("kiln-12")
})

test("reset during an in-flight step does not refill the form", async () => {
  const user = userEvent.setup()
  const original = agent.act.bind(agent)
  let release: () => Promise<void> = async () => {}
  agent.act = ((input: Parameters<typeof agent.act>[0]) =>
    new Promise((resolve, reject) => {
      release = () => original(input).then(resolve, reject)
    })) as typeof agent.act

  try {
    render(<ShowingDesk />)
    await user.click(screen.getByRole("button", { name: "Step" }))
    await user.click(screen.getByRole("button", { name: "Reset" }))
    await act(async () => {
      await release()
    })
    expect(document.querySelector(".status")?.textContent).toContain("Next: Assign Kiln 12")
    expect((screen.getByRole("combobox", { name: "Unit" }) as HTMLInputElement).value).toBe("")
    expect((screen.getByRole("textbox", { name: "Guest" }) as HTMLInputElement).value).toBe("")
    expect(document.querySelector(".receipt")?.textContent).toContain("The showing is empty")
    expect(screen.getByRole("heading", { name: "Last act" }).nextElementSibling?.textContent).toBe(
      "No step yet.",
    )
  } finally {
    agent.act = original
  }
})

test("an agent can find the form and fill a showing", async () => {
  render(<ShowingDesk />)

  const components = agent
    .snapshot()
    .filter((entry) => !entry.offPage && entry.component !== "more")

  for (const entry of components) {
    expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy()
  }

  const labels = components.map((entry) => entry.label)
  for (const label of ["Unit", "Showing type", "Showing date", "Guest", "Tour stops"]) {
    expect(labels, `${label} is missing from the snapshot`).toContain(label)
  }

  const result = await agent.act({
    steps: [
      { ref: "Unit", action: "setValue", args: ["Kiln 12"] },
      { ref: "Showing type", action: "setValue", args: ["In person"] },
      { ref: "Showing date", action: "setValue", args: ["2026-12-04"] },
      { ref: "Guest", action: "setValue", args: ["Mina Cho"] },
      { ref: "Tour stops", action: "moveStop", args: ["Keys", 1] },
    ],
  })

  expect(result.ok, result.error?.message).toBe(true)
  expect((screen.getByRole("combobox", { name: "Unit" }) as HTMLInputElement).value).toBe(
    "Kiln 12",
  )
  expect(screen.getByRole("combobox", { name: "Showing type" }).textContent).toContain(
    "In person",
  )
  expect((screen.getByRole("textbox", { name: "Guest" }) as HTMLInputElement).value).toBe(
    filledShowing.guest,
  )
  expect(document.querySelector(".receipt")?.textContent).toContain("Dec 4, 2026")
  expect(
    screen.getAllByRole("option").map((option) => option.textContent?.trim()),
  ).toEqual(["Meet at lobby", "Keys", "Walk the unit", "Roof deck"])
})
