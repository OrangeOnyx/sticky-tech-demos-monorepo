import type { A2uiMessage } from "../../shared/protocol.ts"
import { createSurface, updateComponents, updateData } from "./messages.ts"

const surfaceId = "showing"

function slot(id: string, when: string, host: string, path: string): A2uiMessage["updateComponents"] {
  return {
    surfaceId,
    components: [
      {
        id,
        component: "SlotCard",
        when,
        host,
        selected: { path },
        onPick: {
          event: {
            name: "pickSlot",
            context: { when, host },
          },
        },
      },
    ],
  }
}

const morning = slot("slot-morning", "Tue 10:00 AM", "Priya Sen", "/slots/morning")
const afternoon = slot("slot-afternoon", "Tue 2:30 PM", "Priya Sen", "/slots/afternoon")
const wednesday = slot("slot-wednesday", "Wed 9:15 AM", "Alex Moreau", "/slots/wednesday")

export const showingMessages: A2uiMessage[] = [
  createSurface(surfaceId),
  updateComponents(surfaceId, [
    { id: "root", component: "Column", children: ["banner", "heading"] },
    {
      id: "banner",
      component: "PropertyBanner",
      name: { path: "/property/name" },
      address: { path: "/property/address" },
      recordId: { path: "/recordId" },
    },
    {
      id: "heading",
      component: "Text",
      variant: "h2",
      text: "Showing request",
    },
  ]),
  updateData(surfaceId, "/", {
    recordId: "SR-220",
    property: {
      name: "Maple Row Lofts",
      address: "90 Linden Walk, Unit 4B",
    },
  }),
  updateComponents(surfaceId, [
    {
      id: "root",
      component: "Column",
      children: ["banner", "heading", "name", "email"],
    },
    {
      id: "name",
      component: "TextField",
      label: "Prospect",
      variant: "shortText",
      value: { path: "/prospect/name" },
    },
    {
      id: "email",
      component: "TextField",
      label: "Email",
      variant: "shortText",
      value: { path: "/prospect/email" },
    },
  ]),
  updateData(surfaceId, "/prospect", {
    name: "Jordan Hale",
    email: "jordan.hale@example.com",
  }),
  updateComponents(surfaceId, [
    {
      id: "root",
      component: "Column",
      children: [
        "banner",
        "heading",
        "name",
        "email",
        "slots-label",
        "slot-morning",
        "slot-afternoon",
        "slot-wednesday",
      ],
    },
    {
      id: "slots-label",
      component: "Text",
      variant: "h4",
      text: "Open windows",
    },
    ...(morning?.components ?? []),
    ...(afternoon?.components ?? []),
    ...(wednesday?.components ?? []),
  ]),
  updateData(surfaceId, "/slots", {
    morning: false,
    afternoon: false,
    wednesday: false,
  }),
  updateData(surfaceId, "/slots", {
    morning: false,
    afternoon: true,
    wednesday: false,
  }),
  updateComponents(surfaceId, [
    {
      id: "root",
      component: "Column",
      children: [
        "banner",
        "heading",
        "name",
        "email",
        "slots-label",
        "slot-morning",
        "slot-afternoon",
        "slot-wednesday",
        "confirm",
      ],
    },
    {
      id: "confirm",
      component: "Text",
      variant: "body",
      text: { path: "/confirm" },
    },
  ]),
  updateData(
    surfaceId,
    "/confirm",
    "Hold placed for Jordan Hale · Tue 2:30 PM with Priya Sen.",
  ),
]
