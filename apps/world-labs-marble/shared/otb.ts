export const OTB_DISPLAY_NAME = "On The Boulevard"

export const OTB_PROMPT =
  "Create a navigable 3D world of On The Boulevard Shopping Center, a single-story L-shaped strip at 101–149 Arnould Blvd, Lafayette LA. Match the attached real photographs (Nov 2020): cream/beige board-and-batten fascia, white masonry columns, light-aqua covered walkway, dark brown shingle roof, concrete parking, THE PINK PAISLEY and Jason's Deli storefronts. Interiors are industrial-ceiling boutiques — polished concrete or hardwood, wood shoe walls, rope-hung racks, black track lighting. Do not restyle it as peach stucco with clay-tile roofs."

export const OTB_ADDRESS = "101–149 Arnould Blvd, Lafayette, LA"

export const OTB_DROPBOX_PACK =
  "Dropbox: On The Boulevard 53.jpg–99.jpg (Nov 2020) plus Drone Footage RAW/DJI_0030.MOV (~550MB, not in git)"

export type OtbAssetKind = "dropbox" | "drive"

export type OtbReferenceAsset = {
  url: string
  name: string
  mime: string
  extension: string
  label: string
  source: string
  kind: OtbAssetKind
}

function jpeg(
  url: string,
  name: string,
  label: string,
  source: string,
  kind: OtbAssetKind,
): OtbReferenceAsset {
  return { url, name, mime: "image/jpeg", extension: "jpg", label, source, kind }
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

export const OTB_LIBRARY_ASSETS: OtbReferenceAsset[] = [
  ...OTB_DROPBOX_ASSETS,
  ...OTB_DRIVE_ASSETS,
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
