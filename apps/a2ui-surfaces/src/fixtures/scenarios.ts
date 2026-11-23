import type { A2uiMessage } from "../../shared/protocol.ts"
import { showingMessages } from "./showing.ts"
import { workOrderMessages } from "./work-order.ts"

export type Scenario = {
  id: string
  title: string
  detail: string
  messages: A2uiMessage[]
}

export const scenarios: Scenario[] = [
  {
    id: "work-order",
    title: "Work order",
    detail: "Harbor Elm Court",
    messages: workOrderMessages,
  },
  {
    id: "showing",
    title: "Showing request",
    detail: "Maple Row Lofts",
    messages: showingMessages,
  },
]
