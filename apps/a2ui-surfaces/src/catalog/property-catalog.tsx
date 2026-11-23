import { createComponentImplementation } from "@a2ui/react/v0_9"
import type { ReactCatalogComponent } from "@a2ui/react/v0_9"
import { Catalog } from "@a2ui/web_core/v0_9"
import { basicCatalog } from "@a2ui/web_core/v0_9/basic_catalog"
import {
  PriorityMarkApi,
  PropertyBannerApi,
  SlotCardApi,
} from "../../shared/catalog-api.ts"
import { PROPERTY_CATALOG_ID } from "../../shared/protocol.ts"

function text(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return fallback
}

export const PropertyBanner = createComponentImplementation(
  PropertyBannerApi,
  ({ props }) => (
    <header
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.15rem",
        padding: "0.75rem 1rem",
        background: "#ffffff",
        border: "1px solid #d5e0d8",
        borderLeft: "4px solid #1f6b45",
        borderRadius: "0.5rem",
      }}
    >
      <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.75rem", letterSpacing: "0.04em", color: "#3d4f46" }}>
        {text(props.recordId, "Record")}
      </span>
      <strong style={{ fontSize: "1.05rem", color: "#14241c" }}>{text(props.name, "Property")}</strong>
      <span style={{ fontSize: "0.875rem", color: "#3d4f46" }}>{text(props.address, "Address pending")}</span>
    </header>
  ),
)

export const PriorityMark = createComponentImplementation(
  PriorityMarkApi,
  ({ props }) => {
    const level = text(props.level, "routine")
    const urgent = level === "urgent"
    return (
      <p
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          margin: 0,
          padding: "0.35rem 0.7rem",
          borderRadius: "999px",
          background: urgent ? "#f8ecec" : "#e7f3ec",
          color: urgent ? "#6e2424" : "#1f6b45",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "0.5rem",
            height: "0.5rem",
            borderRadius: "999px",
            background: urgent ? "#8f2d2d" : "#1f6b45",
          }}
        />
        {text(props.caption, level)}
      </p>
    )
  },
)

export const SlotCard = createComponentImplementation(SlotCardApi, ({ props }) => {
  const selected = props.selected === true
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof props.onPick === "function") props.onPick()
      }}
      style={{
        display: "flex",
        width: "100%",
        justifyContent: "space-between",
        gap: "1rem",
        textAlign: "left",
        padding: "0.7rem 0.85rem",
        borderRadius: "0.5rem",
        border: selected ? "2px solid #1f6b45" : "1px solid #d5e0d8",
        background: selected ? "#e7f3ec" : "#ffffff",
        color: "#14241c",
        cursor: "pointer",
      }}
    >
      <span>
        <strong style={{ display: "block" }}>{text(props.when, "Window")}</strong>
        <span style={{ fontSize: "0.85rem", color: "#3d4f46" }}>{text(props.host, "Host")}</span>
      </span>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: selected ? "#1f6b45" : "#3d4f46" }}>
        {selected ? "Selected" : "Open"}
      </span>
    </button>
  )
})

export const propertyCatalog = new Catalog<ReactCatalogComponent>(
  PROPERTY_CATALOG_ID,
  "v0.9",
  [...basicCatalog.components.values(), PropertyBanner, PriorityMark, SlotCard],
  [...basicCatalog.functions.values()],
)
