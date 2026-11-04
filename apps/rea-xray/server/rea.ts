import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import type { ReaReport } from "../shared/types.ts"

const execFileAsync = promisify(execFile)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export const reaBin = path.join(root, "node_modules/rea-agents/scripts/rea.mjs")
const MAX_BUFFER = 64 * 1024 * 1024

type ExecError = Error & {
  code?: number | string
  stdout?: string
  stderr?: string
  killed?: boolean
}

export async function runRea(args: string[]): Promise<ReaReport> {
  const command = args[0] ?? "rea"
  if (!existsSync(reaBin)) {
    return {
      command,
      exitCode: 127,
      body: {
        code: "rea_missing",
        message: "The rea-agents CLI is not installed. Run npm install in apps/rea-xray.",
      },
    }
  }

  let stdout = ""
  let stderr = ""
  let exitCode = 0
  try {
    const result = await execFileAsync(process.execPath, [reaBin, ...args], {
      cwd: root,
      encoding: "utf8",
      env: process.env,
      maxBuffer: MAX_BUFFER,
      timeout: 120_000,
      windowsHide: true,
    })
    stdout = result.stdout
    stderr = result.stderr
  } catch (error) {
    const failed = error as ExecError
    stdout = failed.stdout ?? ""
    stderr = failed.stderr ?? ""
    exitCode = typeof failed.code === "number" ? failed.code : 1
    if (failed.killed && !stdout.trim()) {
      return {
        command,
        exitCode,
        body: {
          code: "timeout",
          message: "REA did not finish within 120 seconds.",
        },
      }
    }
  }

  const body = parseStdout(stdout, stderr, exitCode)
  return { command, exitCode, body }
}

function parseStdout(stdout: string, stderr: string, exitCode: number): unknown {
  const trimmed = stdout.trim()
  if (!trimmed) {
    const detail = stderr.trim().slice(0, 500)
    return {
      code: "empty_output",
      message: detail || (exitCode === 0 ? "REA returned an empty result." : "REA failed without JSON."),
    }
  }
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return {
      code: "invalid_json",
      message: "REA stdout was not JSON.",
      remediation: trimmed.slice(0, 500),
    }
  }
}
