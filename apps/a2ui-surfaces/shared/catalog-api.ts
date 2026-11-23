import { CommonSchemas } from "@a2ui/web_core/v0_9"
import { z } from "zod"

export const PropertyBannerApi = {
  name: "PropertyBanner",
  schema: z.object({
    name: CommonSchemas.DynamicString,
    address: CommonSchemas.DynamicString,
    recordId: CommonSchemas.DynamicString,
  }),
}

export const PriorityMarkApi = {
  name: "PriorityMark",
  schema: z.object({
    level: CommonSchemas.DynamicString,
    caption: CommonSchemas.DynamicString,
  }),
}

export const SlotCardApi = {
  name: "SlotCard",
  schema: z.object({
    when: CommonSchemas.DynamicString,
    host: CommonSchemas.DynamicString,
    selected: CommonSchemas.DynamicBoolean,
    onPick: CommonSchemas.Action,
  }),
}

export const propertyCatalogApis = [PropertyBannerApi, PriorityMarkApi, SlotCardApi]
