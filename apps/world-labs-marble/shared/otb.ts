export const OTB_DISPLAY_NAME = "On The Boulevard"

export const OTB_PROMPT =
  "Create a navigable 3D world of On The Boulevard Shopping Center, a single-story L-shaped strip retail center at 101–149 Arnould Blvd, Lafayette LA. Match the attached whole-center floor plan (tan/white units, light-blue covered walkway) and the nadir aerial of the parking field and Arnould Blvd. Target look: Mediterranean / Mission-style marketing render — peach stucco walls, reddish-brown clay tile roof accents, arched storefronts, palms, and a landscaped parking lot."

export const OTB_ADDRESS = "101–149 Arnould Blvd, Lafayette, LA"

export const OTB_DRIVE_VAULT = "G:\\My Drive\\00 OTB"

export type OtbReferenceAsset = {
  url: string
  name: string
  mime: string
  extension: string
  label: string
  driveSource: string
}

export const OTB_REFERENCE_ASSETS: OtbReferenceAsset[] = [
  {
    url: "/otb/floorplan-center.png",
    name: "drive-floorplan-whole-center.png",
    mime: "image/png",
    extension: "png",
    label: "Whole-center floor plan",
    driveSource: "Floor Plan Whole Center Final.png",
  },
  {
    url: "/otb/OTB-sat-base.jpg",
    name: "drive-georef-nadir.jpg",
    mime: "image/jpeg",
    extension: "jpg",
    label: "Georef nadir aerial",
    driveSource: "georef-fit-nadir.png",
  },
  {
    url: "/otb/spatial-isometric.png",
    name: "drive-marketing-style.png",
    mime: "image/png",
    extension: "png",
    label: "Isometric look / massing",
    driveSource:
      "Belle Realty SOT Documents/Style I would like to get the center to look like for marketing.png",
  },
]

export const OTB_THUMBNAIL_URL = "/otb/OTB-sat-base.jpg"
export const OTB_FLOORPLAN_URL = "/otb/floorplan-center.png"
export const OTB_STYLE_URL = "/otb/spatial-isometric.png"
