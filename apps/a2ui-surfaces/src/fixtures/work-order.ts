import type { A2uiMessage } from "../../shared/protocol.ts"
import { createSurface, updateComponents, updateData } from "./messages.ts"

const surfaceId = "work-order"

export const workOrderMessages: A2uiMessage[] = [
  createSurface(surfaceId),
  updateComponents(surfaceId, [
    { id: "root", component: "Column", children: ["intro"] },
    {
      id: "intro",
      component: "Text",
      variant: "h3",
      text: "Opening work order WO-1842",
    },
  ]),
  updateComponents(surfaceId, [
    { id: "root", component: "Column", children: ["banner", "intro"] },
    {
      id: "banner",
      component: "PropertyBanner",
      name: { path: "/property/name" },
      address: { path: "/property/address" },
      recordId: { path: "/recordId" },
    },
  ]),
  updateData(surfaceId, "/", {
    recordId: "WO-1842",
    title: "Condensate leak",
    property: {
      name: "Harbor Elm Court",
      address: "418 Westbridge Ave, Suite 12",
    },
  }),
  updateComponents(surfaceId, [
    {
      id: "root",
      component: "Column",
      children: ["banner", "heading", "rule", "issue", "area"],
    },
    {
      id: "heading",
      component: "Text",
      variant: "h2",
      text: { path: "/title" },
    },
    { id: "rule", component: "Divider", axis: "horizontal" },
    {
      id: "issue",
      component: "TextField",
      label: "Issue",
      variant: "longText",
      value: { path: "/draft/issue" },
    },
    {
      id: "area",
      component: "TextField",
      label: "Where",
      variant: "shortText",
      value: { path: "/draft/area" },
    },
  ]),
  updateData(surfaceId, "/draft", {
    issue: "Condensate line dripping onto the closet floor.",
    area: "Mechanical closet, west wall",
  }),
  updateComponents(surfaceId, [
    {
      id: "root",
      component: "Column",
      children: ["banner", "heading", "rule", "priority", "issue", "area", "notes"],
    },
    {
      id: "priority",
      component: "PriorityMark",
      level: { path: "/priority/level" },
      caption: { path: "/priority/caption" },
    },
    {
      id: "notes",
      component: "TextField",
      label: "Notes for the vendor",
      variant: "longText",
      value: { path: "/priority/notes" },
    },
  ]),
  updateData(surfaceId, "/priority", {
    level: "urgent",
    caption: "Urgent · same day",
    notes: "Ask Northline Mechanical to bring a replacement pan.",
  }),
  updateComponents(surfaceId, [
    {
      id: "root",
      component: "Column",
      children: [
        "banner",
        "heading",
        "status",
        "rule",
        "priority",
        "issue",
        "area",
        "notes",
        "file",
      ],
    },
    {
      id: "file-label",
      component: "Text",
      text: { path: "/filing/buttonLabel" },
    },
    {
      id: "file",
      component: "Button",
      variant: "primary",
      child: "file-label",
      action: {
        event: {
          name: "fileWorkOrder",
          context: {
            recordId: { path: "/recordId" },
            issue: { path: "/draft/issue" },
          },
        },
      },
    },
    {
      id: "status",
      component: "Text",
      variant: "h3",
      text: { path: "/filing/status" },
    },
  ]),
  updateData(surfaceId, "/filing", {
    buttonLabel: "File work order",
    status: "Draft · not filed",
  }),
  updateData(surfaceId, "/filing", {
    buttonLabel: "Filed",
    status: "Filed · Northline Mechanical has WO-1842.",
  }),
]
