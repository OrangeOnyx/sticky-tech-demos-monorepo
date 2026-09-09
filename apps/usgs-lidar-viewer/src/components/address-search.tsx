import { useState, type FormEvent } from "react"
import { LoaderCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  GeocodeError,
  searchAddress,
  type GeocodeHit,
} from "@/lib/geocode"

type AddressSearchProps = {
  disabled?: boolean
  onSelect: (hit: GeocodeHit) => void
}

export function AddressSearch({ disabled, onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<GeocodeHit[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = query.trim()
    if (!nextQuery) {
      setStatus("Type a US address or place name.")
      setHits([])
      return
    }

    setPending(true)
    setStatus(null)

    try {
      const nextHits = await searchAddress(nextQuery)
      setHits(nextHits)

      if (nextHits.length === 0) {
        setStatus("No US matches. Try a fuller address or a nearby town.")
        return
      }

      if (nextHits.length === 1) {
        onSelect(nextHits[0])
        setHits([])
      }
    } catch (error) {
      setHits([])
      setStatus(
        error instanceof GeocodeError
          ? error.message
          : "Could not reach Nominatim. Check the network and try again.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <form className="flex items-center gap-2" onSubmit={onSubmit}>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a US address…"
          aria-label="US address"
          autoComplete="off"
          disabled={disabled || pending}
        />
        <Button type="submit" disabled={disabled || pending} size="sm">
          {pending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Search />
          )}
          Search
        </Button>
      </form>

      {status ? (
        <p className="text-xs text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}

      {hits.length > 1 ? (
        <ul className="overflow-hidden rounded-lg border border-border bg-card/95 text-sm">
          {hits.map((hit) => (
            <li key={hit.id} className="border-b border-border last:border-b-0">
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  onSelect(hit)
                  setHits([])
                  setQuery(hit.label)
                }}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
