import { Badge } from "@/components/ui/badge"
import { SheetPane } from "@/components/sheet-pane"

export default function App() {
  return (
    <div className="flex h-svh flex-col bg-background text-foreground">
      <header className="bg-ink text-stone">
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium tracking-[0.16em] text-sage uppercase">
              Cypress Command
            </p>
            <h1 className="text-lg font-medium tracking-tight">Harbor Court rent roll</h1>
            <p className="max-w-2xl text-sm text-sage">
              Editable Univer Sheet with twenty invented units. Summary formulas
              calculate occupancy and rent. Charts are not in the open-source preset.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Sample data</Badge>
            <Badge variant="outline" className="border-sage/40 text-stone">
              Apache-2.0 preset
            </Badge>
            <a
              className="text-sm text-stone underline underline-offset-4"
              href="https://github.com/dream-num/univer"
            >
              Univer
            </a>
          </div>
        </div>
      </header>
      <SheetPane />
    </div>
  )
}
