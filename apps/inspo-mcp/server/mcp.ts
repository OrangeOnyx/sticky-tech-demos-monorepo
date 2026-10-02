const DEFAULT_ENDPOINT = "https://inspomcp.dev/api/mcp"

export function mcpEndpoint(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.INSPO_MCP_URL?.trim()
  return configured && configured.length > 0 ? configured : DEFAULT_ENDPOINT
}

export function designLiveEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.INSPO_DESIGN_LIVE?.trim().toLowerCase() === "true"
}

export function buildToolCall(id: number, name: string, args: Record<string, unknown>) {
  return {
    jsonrpc: "2.0" as const,
    id,
    method: "tools/call" as const,
    params: { name, arguments: args },
  }
}

export function parseMcpBody(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error("Inspo returned an empty body.")
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed) as unknown
  const dataLines = trimmed
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter((line) => line.length > 0 && line !== "[DONE]")
  const last = dataLines.at(-1)
  if (!last) throw new Error("Inspo returned no JSON event.")
  return JSON.parse(last) as unknown
}

export interface ToolText {
  text: string
}

export async function callTool(
  name: string,
  args: Record<string, unknown>,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<ToolText> {
  const response = await fetchImpl(mcpEndpoint(env), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify(buildToolCall(1, name, args)),
    signal: AbortSignal.timeout(30_000),
  })
  const raw = await response.text()
  if (!response.ok) {
    throw new Error(`Inspo MCP responded ${response.status}.`)
  }
  const payload = parseMcpBody(raw)
  if (!payload || typeof payload !== "object") {
    throw new Error("Inspo MCP response was not JSON.")
  }
  const record = payload as Record<string, unknown>
  if (record.error && typeof record.error === "object") {
    const message = (record.error as { message?: unknown }).message
    throw new Error(typeof message === "string" ? message : "Inspo MCP rejected the call.")
  }
  const result = record.result
  if (!result || typeof result !== "object") {
    throw new Error("Inspo MCP response had no result.")
  }
  const resultRecord = result as { isError?: unknown; content?: unknown }
  const content = Array.isArray(resultRecord.content) ? resultRecord.content : []
  const textPart = content.find(
    (part) =>
      part &&
      typeof part === "object" &&
      (part as { type?: unknown }).type === "text" &&
      typeof (part as { text?: unknown }).text === "string",
  ) as { text: string } | undefined
  if (!textPart) throw new Error(`Inspo ${name} returned no text.`)
  if (resultRecord.isError === true) throw new Error(textPart.text)
  return { text: textPart.text }
}
