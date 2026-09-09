import { describe, expect, test } from "bun:test"
import { nominatimSearchUrl, parseNominatimHits } from "./geocode"
import { lidarOpacityFromMix, USGS_HILLSHADE_TILE_URL } from "./tiles"

describe("parseNominatimHits", () => {
  test("maps a Nominatim result and reorders bbox to west,south,east,north", () => {
    const hits = parseNominatimHits([
      {
        place_id: 1,
        display_name: "Grand Canyon Village, Arizona, United States",
        lat: "36.0578070",
        lon: "-112.1281560",
        boundingbox: ["36.0040580", "36.1114390", "-112.2467480", "-112.0806040"],
      },
    ])

    expect(hits).toEqual([
      {
        id: "1",
        label: "Grand Canyon Village, Arizona, United States",
        lat: 36.057807,
        lon: -112.128156,
        bbox: [-112.246748, 36.004058, -112.080604, 36.111439],
      },
    ])
  })

  test("skips incomplete rows", () => {
    expect(parseNominatimHits([{ display_name: "Nowhere" }])).toEqual([])
    expect(parseNominatimHits({})).toEqual([])
  })
})

describe("nominatimSearchUrl", () => {
  test("scopes search to the US", () => {
    const url = nominatimSearchUrl("Yosemite Valley")
    expect(url).toContain("countrycodes=us")
    expect(url).toContain("q=Yosemite+Valley")
  })
})

describe("lidarOpacityFromMix", () => {
  test("clamps the slider percent to 0–1", () => {
    expect(lidarOpacityFromMix(0)).toBe(0)
    expect(lidarOpacityFromMix(50)).toBe(0.5)
    expect(lidarOpacityFromMix(100)).toBe(1)
    expect(lidarOpacityFromMix(-10)).toBe(0)
    expect(lidarOpacityFromMix(140)).toBe(1)
  })
})

describe("hillshade tiles", () => {
  test("encodes the raster function so MapLibre tokens stay intact", () => {
    expect(USGS_HILLSHADE_TILE_URL).toContain("{bbox-epsg-3857}")
    expect(USGS_HILLSHADE_TILE_URL).toContain("renderingRule=")
    expect(USGS_HILLSHADE_TILE_URL).not.toContain('{"rasterFunction"')
  })
})
