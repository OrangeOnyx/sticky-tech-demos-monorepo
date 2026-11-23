import { useEffect, useRef, useState } from "react"
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core"
import sheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US"
import { createUniver, LocaleType, mergeLocales, type FUniver, type IWorkbookData } from "@univerjs/presets"
import "@univerjs/preset-sheets-core/lib/index.css"
import { Button } from "@/components/ui/button"
import {
  exportPayload,
  FIRST_DATA_ROW,
  formatInt,
  formatMoney,
  formatPercent,
  FORMULA_LAST_ROW,
  harborCourtWorkbook,
  PROPERTY_NAME,
  RENT_ROLL_SHEET,
  SUMMARY_FIRST_METRIC_ROW,
  SUMMARY_METRICS,
  SUMMARY_SHEET,
  summaryFromMetricColumn,
  unitsFromGrid,
  unitsToCsv,
  type SheetSummary,
} from "../../shared/harbor-court.ts"

type UniverApi = FUniver

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function workbookData() {
  return harborCourtWorkbook() as unknown as Partial<IWorkbookData>
}

function readUnits(api: UniverApi) {
  const sheet = api.getActiveWorkbook()?.getSheetByName(RENT_ROLL_SHEET)
  if (!sheet) return []
  const values = sheet.getRange(`A${FIRST_DATA_ROW}:F${FORMULA_LAST_ROW}`).getRawValues()
  return unitsFromGrid(values)
}

function readSummary(api: UniverApi): SheetSummary | null {
  const sheet = api.getActiveWorkbook()?.getSheetByName(SUMMARY_SHEET)
  if (!sheet) return null
  const endRow = SUMMARY_FIRST_METRIC_ROW + SUMMARY_METRICS.length - 1
  const values = sheet.getRange(`B${SUMMARY_FIRST_METRIC_ROW}:B${endRow}`).getRawValues()
  return summaryFromMetricColumn(values.map((row) => row[0]))
}

function download(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function formulaStrip(summary: SheetSummary | null): string {
  if (
    !summary ||
    summary.units == null ||
    summary.occupied == null ||
    summary.notice == null ||
    summary.vacant == null ||
    summary.inPlaceOccupancy == null ||
    summary.leasedOccupancy == null ||
    summary.monthlyRent == null
  ) {
    return "Reading Summary formulas…"
  }
  return `Sheet formulas: ${formatInt(summary.units)} units · ${formatInt(summary.occupied)} occupied · ${formatInt(summary.notice)} notice · ${formatInt(summary.vacant)} vacant · ${formatPercent(summary.inPlaceOccupancy)} in place · ${formatPercent(summary.leasedOccupancy)} leased · ${formatMoney(summary.monthlyRent, 0)} monthly rent`
}

export function SheetPane() {
  const hostRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<UniverApi | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<SheetSummary | null>(null)
  const [status, setStatus] = useState(
    `Editing ${PROPERTY_NAME}. Reset restores the invented fixture.`,
  )

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const container = document.createElement("div")
    container.style.height = "100%"
    container.style.width = "100%"
    host.append(container)

    let univer: { dispose: () => void } | null = null
    let listener: { dispose: () => void } | null = null
    let timer = 0
    let alive = true
    let generation = 0

    const refresh = async () => {
      const api = apiRef.current
      if (!api) return
      const token = ++generation
      try {
        await Promise.race([api.getFormula().onCalculationResultApplied(), delay(1200)])
      } catch {
        // The formula engine rejects when nothing is waiting to calculate.
      }
      if (!alive || token !== generation || apiRef.current !== api) return
      let next = readSummary(api)
      if (next?.monthlyRent == null) {
        await delay(400)
        if (!alive || token !== generation || apiRef.current !== api) return
        next = readSummary(api)
      }
      setSummary(next)
      setReady(true)
    }

    try {
      const created = createUniver({
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: mergeLocales(sheetsCoreEnUS),
        },
        presets: [
          UniverSheetsCorePreset({
            container,
            header: true,
            toolbar: true,
            formulaBar: true,
            disableTextFormatAlert: true,
            disableTextFormatMark: true,
          }),
        ],
      })
      univer = created.univer
      apiRef.current = created.univerAPI
      created.univerAPI.createWorkbook(workbookData())
      listener = created.univerAPI.addEvent(created.univerAPI.Event.CommandExecuted, () => {
        window.clearTimeout(timer)
        timer = window.setTimeout(() => {
          void refresh()
        }, 250)
      })
      void refresh()
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Univer failed to start"
      queueMicrotask(() => {
        if (!alive) return
        setError(message)
        setStatus("The sheet did not start.")
      })
    }

    return () => {
      alive = false
      window.clearTimeout(timer)
      listener?.dispose()
      apiRef.current = null
      const instance = univer
      queueMicrotask(() => {
        instance?.dispose()
        container.remove()
      })
    }
  }, [])

  async function exportJson() {
    const api = apiRef.current
    if (!api) return
    const payload = exportPayload(readUnits(api), readSummary(api), new Date().toISOString())
    download(
      "harbor-court-rent-roll.json",
      `${JSON.stringify(payload, null, 2)}\n`,
      "application/json",
    )
    setStatus(`Exported ${payload.units.length} units to harbor-court-rent-roll.json.`)
  }

  function exportCsv() {
    const api = apiRef.current
    if (!api) return
    const units = readUnits(api)
    download("harbor-court-rent-roll.csv", unitsToCsv(units), "text/csv")
    setStatus(`Exported ${units.length} units to harbor-court-rent-roll.csv.`)
  }

  function reset() {
    const api = apiRef.current
    if (!api) return
    const id = api.getActiveWorkbook()?.getId()
    if (id) api.disposeUnit(id)
    api.createWorkbook(workbookData())
    setSummary(null)
    setStatus("Restored the invented Harbor Court fixture.")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b bg-stone px-4 py-2">
        <Button type="button" variant="outline" disabled={!ready} onClick={reset}>
          Reset data
        </Button>
        <Button type="button" disabled={!ready} onClick={() => void exportJson()}>
          Export JSON
        </Button>
        <Button type="button" variant="outline" disabled={!ready} onClick={exportCsv}>
          Export CSV
        </Button>
        <p className="min-w-0 text-sm text-muted-foreground" aria-live="polite" data-testid="formula-strip">
          {error ?? formulaStrip(summary)}
        </p>
      </div>
      {error ? (
        <p className="px-4 py-6 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div ref={hostRef} className="univer-host min-h-0 flex-1" />
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  )
}
