import { formatClickCmd, formatSetValueCmd } from "../../shared/commands.ts"
import type {
  ActionEnvelope,
  ErrorEnvelope,
  SnapshotEnvelope,
} from "../../shared/types.ts"

const version = "2.6" as const

function windowMeta(id: string) {
  return { id, title: "DemoNotes" }
}

export const welcomeSnapshot: SnapshotEnvelope = {
  version,
  ok: true,
  command: "snapshot",
  data: {
    app: "DemoNotes",
    snapshot_id: "s8f3k2p9",
    ref_count: 7,
    complete: true,
    window: windowMeta("w-demonotes-welcome"),
    tree: {
      role: "window",
      name: "DemoNotes",
      children: [
        {
          role: "group",
          children: [
            {
              role: "button",
              name: "New note",
              description: "Create a blank note",
              ref_id: "@s8f3k2p9:e1",
              available_actions: ["Click", "SetFocus"],
              native_id: { kind: "ax_identifier", value: "demonotes.new" },
            },
            {
              role: "button",
              name: "Save",
              ref_id: "@s8f3k2p9:e2",
              available_actions: ["Click", "SetFocus"],
              states: ["disabled"],
              native_id: { kind: "ax_identifier", value: "demonotes.save" },
            },
          ],
        },
        {
          role: "group",
          name: "Notes",
          children: [
            {
              role: "treeitem",
              name: "Welcome",
              ref_id: "@s8f3k2p9:e3",
              available_actions: ["Click"],
              states: ["selected"],
            },
            {
              role: "treeitem",
              name: "Grocery list",
              ref_id: "@s8f3k2p9:e4",
              available_actions: ["Click"],
            },
          ],
        },
        {
          role: "group",
          name: "Editor",
          children: [
            {
              role: "textfield",
              name: "Title",
              value: "Welcome",
              ref_id: "@s8f3k2p9:e5",
              available_actions: ["SetValue", "SetFocus"],
            },
            {
              role: "textfield",
              name: "Body",
              value: "Start here.",
              ref_id: "@s8f3k2p9:e6",
              available_actions: ["SetValue", "SetFocus"],
            },
            {
              role: "checkbox",
              name: "Pin",
              ref_id: "@s8f3k2p9:e7",
              available_actions: ["Check", "Uncheck"],
            },
          ],
        },
      ],
    },
  },
}

export const untitledSnapshot: SnapshotEnvelope = {
  version,
  ok: true,
  command: "snapshot",
  data: {
    app: "DemoNotes",
    snapshot_id: "n4w0te12",
    ref_count: 8,
    complete: true,
    window: windowMeta("w-demonotes-untitled"),
    tree: {
      role: "window",
      name: "DemoNotes",
      children: [
        {
          role: "group",
          children: [
            {
              role: "button",
              name: "New note",
              ref_id: "@n4w0te12:e1",
              available_actions: ["Click", "SetFocus"],
            },
            {
              role: "button",
              name: "Save",
              ref_id: "@n4w0te12:e2",
              available_actions: ["Click", "SetFocus"],
            },
          ],
        },
        {
          role: "group",
          name: "Notes",
          children: [
            {
              role: "treeitem",
              name: "Welcome",
              ref_id: "@n4w0te12:e3",
              available_actions: ["Click"],
            },
            {
              role: "treeitem",
              name: "Grocery list",
              ref_id: "@n4w0te12:e4",
              available_actions: ["Click"],
            },
            {
              role: "treeitem",
              name: "Untitled",
              ref_id: "@n4w0te12:e5",
              available_actions: ["Click"],
              states: ["selected"],
            },
          ],
        },
        {
          role: "group",
          name: "Editor",
          children: [
            {
              role: "textfield",
              name: "Title",
              ref_id: "@n4w0te12:e6",
              available_actions: ["SetValue", "SetFocus"],
            },
            {
              role: "textfield",
              name: "Body",
              ref_id: "@n4w0te12:e7",
              available_actions: ["SetValue", "SetFocus"],
            },
            {
              role: "checkbox",
              name: "Pin",
              ref_id: "@n4w0te12:e8",
              available_actions: ["Check", "Uncheck"],
            },
          ],
        },
      ],
    },
  },
}

export const recoverySnapshot: SnapshotEnvelope = {
  version,
  ok: true,
  command: "snapshot",
  data: {
    app: "DemoNotes",
    snapshot_id: "r3cov8k1",
    ref_count: 8,
    complete: true,
    window: windowMeta("w-demonotes-recovery"),
    tree: {
      role: "window",
      name: "DemoNotes",
      children: [
        {
          role: "group",
          children: [
            {
              role: "button",
              name: "New note",
              ref_id: "@r3cov8k1:e1",
              available_actions: ["Click", "SetFocus"],
            },
            {
              role: "button",
              name: "Save",
              ref_id: "@r3cov8k1:e2",
              available_actions: ["Click", "SetFocus"],
            },
          ],
        },
        {
          role: "group",
          name: "Notes",
          children: [
            {
              role: "treeitem",
              name: "Welcome",
              ref_id: "@r3cov8k1:e3",
              available_actions: ["Click"],
            },
            {
              role: "treeitem",
              name: "Grocery list",
              ref_id: "@r3cov8k1:e4",
              available_actions: ["Click"],
            },
            {
              role: "treeitem",
              name: "Untitled",
              ref_id: "@r3cov8k1:e5",
              available_actions: ["Click"],
              states: ["selected"],
            },
          ],
        },
        {
          role: "group",
          name: "Editor",
          children: [
            {
              role: "textfield",
              name: "Title",
              ref_id: "@r3cov8k1:e6",
              available_actions: ["SetValue", "SetFocus"],
            },
            {
              role: "textfield",
              name: "Body",
              ref_id: "@r3cov8k1:e7",
              available_actions: ["SetValue", "SetFocus"],
            },
            {
              role: "checkbox",
              name: "Pin",
              ref_id: "@r3cov8k1:e8",
              available_actions: ["Check", "Uncheck"],
            },
          ],
        },
      ],
    },
  },
}

export const clickNewOk: ActionEnvelope = {
  version,
  ok: true,
  command: "click",
  data: {
    action: "click",
    disposition: { delivery: "delivered_verified", retry: "unsafe" },
  },
}

export const staleBody: ErrorEnvelope = {
  version,
  ok: false,
  command: "set-value",
  error: {
    code: "STALE_REF",
    message: "Ref '@s8f3k2p9:e6' no longer matches a live element",
    suggestion:
      "Take a fresh snapshot and retry with a ref from that snapshot. Nothing was sent to the app.",
    recovery: {
      strategy: "refresh_snapshot_then_retry_original",
      retryable: true,
      requires_fresh_snapshot: true,
    },
    disposition: { delivery: "not_delivered", retry: "safe" },
    details: { kind: "saved_ref_absent" },
  },
}

export const treeFixtures = [
  {
    id: "welcome",
    label: "Welcome note",
    detail: "Before New note",
    snapshot: welcomeSnapshot,
  },
  {
    id: "untitled",
    label: "Untitled note",
    detail: "After New note",
    snapshot: untitledSnapshot,
  },
  {
    id: "recovery",
    label: "Recovery read",
    detail: "Fresh refs",
    snapshot: recoverySnapshot,
  },
] as const

export type ReplayStep = {
  id: string
  title: string
  command: string
  response: SnapshotEnvelope | ActionEnvelope | ErrorEnvelope
  snapshot: SnapshotEnvelope
  followUpCommand?: string
  caption: string
}

const staleCommand = formatSetValueCmd("@s8f3k2p9:e6", "Launch checklist")
const recoveredCommand = formatSetValueCmd("@r3cov8k1:e7", "Launch checklist")

export const replaySteps: ReplayStep[] = [
  {
    id: "observe-welcome",
    title: "Snapshot the open note",
    command: "agent-desktop snapshot --app DemoNotes -i",
    response: welcomeSnapshot,
    snapshot: welcomeSnapshot,
    caption: "First observation. Every ref below belongs to s8f3k2p9.",
  },
  {
    id: "click-new",
    title: "Click New note",
    command: formatClickCmd("@s8f3k2p9:e1"),
    response: clickNewOk,
    snapshot: untitledSnapshot,
    caption:
      "The click envelope does not include a tree. This is the UI after the click, still unverified until the next snapshot.",
  },
  {
    id: "observe-untitled",
    title: "Snapshot again to verify",
    command: "agent-desktop snapshot --app DemoNotes -i",
    response: untitledSnapshot,
    snapshot: untitledSnapshot,
    caption:
      "New snapshot id n4w0te12. The Body field is a new element, so it has a new ref.",
  },
  {
    id: "stale-body",
    title: "Set value with the old Body ref",
    command: staleCommand,
    response: staleBody,
    snapshot: untitledSnapshot,
    caption:
      "The old Body ref @s8f3k2p9:e6 does not match the live editor. Delivery is not_delivered, so nothing was typed.",
  },
  {
    id: "recover",
    title: "Fresh snapshot, then the new ref",
    command: "agent-desktop snapshot --app DemoNotes -i",
    response: recoverySnapshot,
    snapshot: recoverySnapshot,
    followUpCommand: recoveredCommand,
    caption:
      "Recovery read r3cov8k1. Use the Body ref from this snapshot, not the one from s8f3k2p9.",
  },
]
