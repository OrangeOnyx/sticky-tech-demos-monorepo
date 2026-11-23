import type { A2uiMessage } from "./protocol.ts"

export const EMPTY_STREAM: readonly A2uiMessage[] = []

export function streamForTab(
  scenarioId: string,
  fixtureMessages: readonly A2uiMessage[] | undefined,
  liveMessages: readonly A2uiMessage[] | null,
): readonly A2uiMessage[] {
  if (scenarioId === "live") return liveMessages ?? EMPTY_STREAM
  return fixtureMessages ?? EMPTY_STREAM
}
