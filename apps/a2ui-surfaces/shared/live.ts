import {
  PROPERTY_CATALOG_ID,
  PROTOCOL_VERSION,
  type A2uiMessage,
} from "./protocol.ts"

const PROMPT_LIMIT = 280

export function liveAgentEnabled(key: string | undefined | null): boolean {
  return typeof key === "string" && key.trim().length > 0
}

export function sanitizePrompt(prompt: string): string {
  const trimmed = prompt.replace(/\s+/g, " ").trim()
  if (!trimmed) return "What is open at Harbor Elm Court?"
  return trimmed.slice(0, PROMPT_LIMIT)
}

export function buildLiveStub(prompt: string): A2uiMessage[] {
  const reply = sanitizePrompt(prompt)
  const surfaceId = "live-stub"
  return [
    {
      version: PROTOCOL_VERSION,
      createSurface: { surfaceId, catalogId: PROPERTY_CATALOG_ID },
    },
    {
      version: PROTOCOL_VERSION,
      updateComponents: {
        surfaceId,
        components: [
          { id: "root", component: "Column", children: ["banner", "reply", "note"] },
          {
            id: "banner",
            component: "PropertyBanner",
            name: { path: "/property/name" },
            address: { path: "/property/address" },
            recordId: { path: "/recordId" },
          },
          {
            id: "reply",
            component: "Text",
            variant: "body",
            text: { path: "/reply" },
          },
          {
            id: "note",
            component: "Text",
            variant: "caption",
            text: "Stubbed reply. No model was called.",
          },
        ],
      },
    },
    {
      version: PROTOCOL_VERSION,
      updateDataModel: {
        surfaceId,
        path: "/",
        value: {
          recordId: "STUB-1",
          property: {
            name: "Harbor Elm Court",
            address: "418 Westbridge Ave, Suite 12",
          },
          reply,
        },
      },
    },
  ]
}
