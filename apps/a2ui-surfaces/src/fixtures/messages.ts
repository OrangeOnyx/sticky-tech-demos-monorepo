import {
  PROPERTY_CATALOG_ID,
  PROTOCOL_VERSION,
  type A2uiMessage,
  type ComponentDef,
} from "../../shared/protocol.ts"

export function createSurface(surfaceId: string): A2uiMessage {
  return {
    version: PROTOCOL_VERSION,
    createSurface: { surfaceId, catalogId: PROPERTY_CATALOG_ID },
  }
}

export function updateComponents(
  surfaceId: string,
  components: ComponentDef[],
): A2uiMessage {
  return {
    version: PROTOCOL_VERSION,
    updateComponents: { surfaceId, components },
  }
}

export function updateData(
  surfaceId: string,
  path: string,
  value: unknown,
): A2uiMessage {
  return {
    version: PROTOCOL_VERSION,
    updateDataModel: { surfaceId, path, value },
  }
}
