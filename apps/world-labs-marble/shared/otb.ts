export const OTB_DISPLAY_NAME = "On The Boulevard"

export const OTB_PROMPT =
  "Create a navigable 3D world of On The Boulevard Shopping Center, a single-story L-shaped strip at 101–149 Arnould Blvd, Lafayette LA. Match the attached real photographs (Nov 2020): cream/beige board-and-batten fascia, white masonry columns, light-aqua covered walkway, dark brown shingle roof, concrete parking, THE PINK PAISLEY and Jason's Deli storefronts. Interiors are industrial-ceiling boutiques — polished concrete or hardwood, wood shoe walls, rope-hung racks, black track lighting. Do not restyle it as peach stucco with clay-tile roofs."

export const OTB_ADDRESS = "101–149 Arnould Blvd, Lafayette, LA"

export const OTB_DROPBOX_PACK =
  "Dropbox: On The Boulevard 53.jpg–99.jpg (Nov 2020) plus Drone Footage RAW/DJI_0030.MOV (~550MB, not in git)"

export type OtbReferenceAsset = {
  url: string
  name: string
  mime: string
  extension: string
  label: string
  source: string
}

export const OTB_LIBRARY_ASSETS: OtbReferenceAsset[] = [
  {
    url: "/otb/otb-dropbox-53.jpg",
    name: "otb-dropbox-53.jpg",
    mime: "image/jpeg",
    extension: "jpg",
    label: "Elevated golden-hour strip",
    source: "On The Boulevard 53.jpg",
  },
  {
    url: "/otb/otb-dropbox-60.jpg",
    name: "otb-dropbox-60.jpg",
    mime: "image/jpeg",
    extension: "jpg",
    label: "Politics wood shoe wall",
    source: "On The Boulevard 60.jpg",
  },
  {
    url: "/otb/otb-dropbox-70.jpg",
    name: "otb-dropbox-70.jpg",
    mime: "image/jpeg",
    extension: "jpg",
    label: "Politics boutique interior",
    source: "On The Boulevard 70.jpg",
  },
  {
    url: "/otb/otb-dropbox-80.jpg",
    name: "otb-dropbox-80.jpg",
    mime: "image/jpeg",
    extension: "jpg",
    label: "Pink Paisley mezzanine interior",
    source: "On The Boulevard 80.jpg",
  },
  {
    url: "/otb/otb-dropbox-90.jpg",
    name: "otb-dropbox-90.jpg",
    mime: "image/jpeg",
    extension: "jpg",
    label: "Streetwear rope-hung rack",
    source: "On The Boulevard 90.jpg",
  },
  {
    url: "/otb/otb-dropbox-99.jpg",
    name: "otb-dropbox-99.jpg",
    mime: "image/jpeg",
    extension: "jpg",
    label: "Pink Paisley storefront",
    source: "On The Boulevard 99.jpg",
  },
]

/** Marble accepts at most 3 images. Default generate uses exterior + two interiors. */
export const OTB_REFERENCE_ASSETS: OtbReferenceAsset[] = [
  OTB_LIBRARY_ASSETS[0],
  OTB_LIBRARY_ASSETS[2],
  OTB_LIBRARY_ASSETS[3],
]

export const OTB_THUMBNAIL_URL = "/otb/otb-dropbox-53.jpg"
export const OTB_PANO_URL = "/otb/otb-dropbox-99.jpg"
export const OTB_FLOORPLAN_URL = "/otb/floorplan-center.png"
