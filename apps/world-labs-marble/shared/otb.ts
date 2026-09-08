export const OTB_DISPLAY_NAME = "On The Boulevard"

export const OTB_PROMPT =
  "Create a navigable 3D world of On The Boulevard Shopping Center, a single-story L-shaped strip at 101–149 Arnould Blvd, Lafayette LA. Match the attached real photographs (Nov 2020): cream/beige board-and-batten fascia, white masonry columns, light-aqua covered walkway, dark brown shingle roof, concrete parking, THE PINK PAISLEY and Jason's Deli storefronts. Interiors are industrial-ceiling boutiques — polished concrete or hardwood, wood shoe walls, rope-hung racks, black track lighting. Do not restyle it as peach stucco with clay-tile roofs."

export const OTB_ADDRESS = "101–149 Arnould Blvd, Lafayette, LA"

export const OTB_DROPBOX_PACK =
  "Dropbox: On The Boulevard 53.jpg–99.jpg (Nov 2020) plus Drone Footage RAW/DJI_0030.MOV (~550MB, not in git)"

export type OtbAssetKind = "dropbox" | "drive" | "roof-brief" | "reference"

export type OtbReferenceAsset = {
  url: string
  name: string
  mime: string
  extension: string
  label: string
  source: string
  kind: OtbAssetKind
}

function still(
  url: string,
  name: string,
  label: string,
  source: string,
  kind: OtbAssetKind,
  mime = "image/jpeg",
  extension = "jpg",
): OtbReferenceAsset {
  return { url, name, mime, extension, label, source, kind }
}

function jpeg(
  url: string,
  name: string,
  label: string,
  source: string,
  kind: OtbAssetKind,
): OtbReferenceAsset {
  return still(url, name, label, source, kind)
}

function png(
  url: string,
  name: string,
  label: string,
  source: string,
  kind: OtbAssetKind,
): OtbReferenceAsset {
  return still(url, name, label, source, kind, "image/png", "png")
}

export const OTB_DROPBOX_ASSETS: OtbReferenceAsset[] = [
  jpeg(
    "/otb/otb-dropbox-53.jpg",
    "otb-dropbox-53.jpg",
    "Elevated golden-hour strip",
    "On The Boulevard 53.jpg",
    "dropbox",
  ),
  jpeg(
    "/otb/otb-dropbox-60.jpg",
    "otb-dropbox-60.jpg",
    "Politics wood shoe wall",
    "On The Boulevard 60.jpg",
    "dropbox",
  ),
  jpeg(
    "/otb/otb-dropbox-70.jpg",
    "otb-dropbox-70.jpg",
    "Politics boutique interior",
    "On The Boulevard 70.jpg",
    "dropbox",
  ),
  jpeg(
    "/otb/otb-dropbox-80.jpg",
    "otb-dropbox-80.jpg",
    "Pink Paisley mezzanine interior",
    "On The Boulevard 80.jpg",
    "dropbox",
  ),
  jpeg(
    "/otb/otb-dropbox-90.jpg",
    "otb-dropbox-90.jpg",
    "Streetwear rope-hung rack",
    "On The Boulevard 90.jpg",
    "dropbox",
  ),
  jpeg(
    "/otb/otb-dropbox-99.jpg",
    "otb-dropbox-99.jpg",
    "Pink Paisley storefront",
    "On The Boulevard 99.jpg",
    "dropbox",
  ),
]

/** Live Drive + PostShot bytes (not Atlas stand-ins). Selectable; not the default generate set. */
export const OTB_DRIVE_ASSETS: OtbReferenceAsset[] = [
  jpeg(
    "/otb/drive/floorplan-whole-center.jpg",
    "floorplan-whole-center.jpg",
    "Drive floor plan (whole center)",
    "Floor Plan Whole Center Final.png",
    "drive",
  ),
  jpeg(
    "/otb/drive/georef-fit-nadir.jpg",
    "georef-fit-nadir.jpg",
    "Nadir georef fit",
    "georef-fit-nadir.png",
    "drive",
  ),
  jpeg(
    "/otb/drive/drone.jpg",
    "drone.jpg",
    "Drive drone aerial",
    "Belle Realty SOT Documents/drone.png",
    "drive",
  ),
  jpeg(
    "/otb/drive/postshot-check.jpg",
    "postshot-check.jpg",
    "PostShot alignment check",
    "tools3dgs/otb-roof/postshot-check.png",
    "drive",
  ),
  jpeg(
    "/otb/drive/postshot-source-S1002525.jpg",
    "postshot-source-S1002525.jpg",
    "PostShot source S1002525",
    "tools3dgs/otb-roof/images/S1002525.JPG",
    "drive",
  ),
  jpeg(
    "/otb/drive/georef-fit.jpg",
    "georef-fit.jpg",
    "Georef fit overlay",
    "georef-fit.png",
    "drive",
  ),
  jpeg(
    "/otb/drive/mesh-align-check.jpg",
    "mesh-align-check.jpg",
    "Mesh align check",
    "mesh-align-check.png",
    "drive",
  ),
  jpeg(
    "/otb/drive/splat-align-preview.jpg",
    "splat-align-preview.jpg",
    "Splat align preview",
    "splat-align-preview.png",
    "drive",
  ),
  jpeg(
    "/otb/drive/oo-twin-showcase.jpg",
    "oo-twin-showcase.jpg",
    "Orange Ocean twin showcase",
    "OO-twin-showcase.png",
    "drive",
  ),
  jpeg(
    "/otb/drive/siteplan-a1.jpg",
    "siteplan-a1.jpg",
    "Site plan A1",
    "OTB-SitePlan-A1.png",
    "drive",
  ),
  jpeg(
    "/otb/drive/pylon-tenant-panels.jpg",
    "pylon-tenant-panels.jpg",
    "Pylon tenant panels",
    "Pylon Sign with Tenant Panels.png",
    "drive",
  ),
]

/** otb-command roof-brief stills. Selectable; not generate defaults. SVG flight track is reference-only. */
export const OTB_ROOF_BRIEF_ASSETS: OtbReferenceAsset[] = [
  jpeg(
    "/otb/roof-brief/01-membrane-failure-close.jpg",
    "01-membrane-failure-close.jpg",
    "Membrane failure (close)",
    "docs/roof-brief-assets/01-membrane-failure-close.jpg",
    "roof-brief",
  ),
  jpeg(
    "/otb/roof-brief/02-membrane-failure-wider.jpg",
    "02-membrane-failure-wider.jpg",
    "Membrane failure (wider)",
    "docs/roof-brief-assets/02-membrane-failure-wider.jpg",
    "roof-brief",
  ),
  jpeg(
    "/otb/roof-brief/03-membrane-failure-context-rtu-row.jpg",
    "03-membrane-failure-context-rtu-row.jpg",
    "Membrane failure (RTU row)",
    "docs/roof-brief-assets/03-membrane-failure-context-rtu-row.jpg",
    "roof-brief",
  ),
  jpeg(
    "/otb/roof-brief/04-thermal-anomaly.jpg",
    "04-thermal-anomaly.jpg",
    "Thermal anomaly",
    "docs/roof-brief-assets/04-thermal-anomaly.jpg",
    "roof-brief",
  ),
  jpeg(
    "/otb/roof-brief/05-thermal-rgb-companion.jpg",
    "05-thermal-rgb-companion.jpg",
    "Thermal RGB companion",
    "docs/roof-brief-assets/05-thermal-rgb-companion.jpg",
    "roof-brief",
  ),
  jpeg(
    "/otb/roof-brief/06-nadir-101-end-good-condition.jpg",
    "06-nadir-101-end-good-condition.jpg",
    "Nadir 101 end (good condition)",
    "docs/roof-brief-assets/06-nadir-101-end-good-condition.jpg",
    "roof-brief",
  ),
]

export const OTB_FLIGHT_TRACK = {
  url: "/otb/roof-brief/07-flight-track.svg",
  label: "Flight track (SVG)",
  source: "docs/roof-brief-assets/07-flight-track.svg",
}

export const OTB_SITE_REFERENCE_ASSETS: OtbReferenceAsset[] = [
  png(
    "/otb/reference/plat-full-72.png",
    "plat-full-72.png",
    "ALTA plat (full)",
    "reference/plat-full-72.png",
    "reference",
  ),
  png(
    "/otb/reference/plat-longbldg-1.png",
    "plat-longbldg-1.png",
    "Long building plat",
    "reference/plat-longbldg-1.png",
    "reference",
  ),
  png(
    "/otb/reference/hunt-liquor-left-1.png",
    "hunt-liquor-left-1.png",
    "Hunt liquor (left)",
    "reference/hunt-liquor-left-1.png",
    "reference",
  ),
  png(
    "/otb/reference/park-field-east-1.png",
    "park-field-east-1.png",
    "East parking field",
    "reference/park-field-east-1.png",
    "reference",
  ),
  png(
    "/otb/reference/park-field-west-1.png",
    "park-field-west-1.png",
    "West parking field",
    "reference/park-field-west-1.png",
    "reference",
  ),
  png(
    "/otb/reference/park-bank-notch-1.png",
    "park-bank-notch-1.png",
    "Bank notch parking",
    "reference/park-bank-notch-1.png",
    "reference",
  ),
]

export const OTB_ROOF_BRIEF_FEATURED_ASSETS: OtbReferenceAsset[] = [
  OTB_ROOF_BRIEF_ASSETS[0],
  OTB_ROOF_BRIEF_ASSETS[3],
  OTB_ROOF_BRIEF_ASSETS[5],
]

export const OTB_SITE_REFERENCE_FEATURED_ASSETS: OtbReferenceAsset[] = [
  OTB_SITE_REFERENCE_ASSETS[0],
  OTB_SITE_REFERENCE_ASSETS[1],
  OTB_SITE_REFERENCE_ASSETS[2],
]

export const OTB_ATLAS = {
  meshUrl: "/otb/atlas/OTB-mesh.glb",
  splatUrl: "/otb/atlas/OTB-splat.ksplat",
  meshLabel: "OTB-mesh.glb (~3MB)",
  splatLabel: "OTB-splat.ksplat (~17MB)",
}

export const OTB_LIBRARY_ASSETS: OtbReferenceAsset[] = [
  ...OTB_DROPBOX_ASSETS,
  ...OTB_DRIVE_ASSETS,
  ...OTB_ROOF_BRIEF_ASSETS,
  ...OTB_SITE_REFERENCE_ASSETS,
]

/** Floorplan, nadir, drone, and PostShot stills for the empty viewer. */
export const OTB_DRIVE_FEATURED_ASSETS: OtbReferenceAsset[] = OTB_DRIVE_ASSETS.slice(
  0,
  5,
)

/** 12s 720p preview — media reference only, never a Marble generate input. */
export const OTB_AERIAL_PREVIEW = {
  url: "/otb/drive/otb-aerial-google-2022-preview.mp4",
  label: "Google aerial 2022 (12s preview)",
  source: "OTB-aerial-google-2022.mp4",
}

/** Marble accepts at most 3 images. Default generate uses Dropbox exterior + two interiors. */
export const OTB_REFERENCE_ASSETS: OtbReferenceAsset[] = [
  OTB_DROPBOX_ASSETS[0],
  OTB_DROPBOX_ASSETS[2],
  OTB_DROPBOX_ASSETS[3],
]

export const OTB_THUMBNAIL_URL = "/otb/otb-dropbox-53.jpg"
export const OTB_PANO_URL = "/otb/otb-dropbox-99.jpg"
export const OTB_FLOORPLAN_URL = "/otb/floorplan-center.png"
