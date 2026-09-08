export const OTB_DISPLAY_NAME = "On The Boulevard"

export const OTB_PROMPT =
  "Create a navigable 3D world of On The Boulevard Shopping Center, a single-story strip retail center at 101–149 Arnould Blvd, Lafayette LA, matching the attached floor plan and satellite context."

export const OTB_ADDRESS = "101–149 Arnould Blvd, Lafayette, LA"

export type OtbReferenceAsset = {
  url: string
  name: string
  mime: string
  extension: string
  label: string
}

export const OTB_REFERENCE_ASSETS: OtbReferenceAsset[] = [
  {
    url: "/otb/floorplan-center.png",
    name: "floorplan-center.png",
    mime: "image/png",
    extension: "png",
    label: "Center floor plan",
  },
  {
    url: "/otb/OTB-sat-base.jpg",
    name: "OTB-sat-base.jpg",
    mime: "image/jpeg",
    extension: "jpg",
    label: "Satellite base",
  },
]

export const OTB_THUMBNAIL_URL = "/otb/OTB-sat-base.jpg"
export const OTB_FLOORPLAN_URL = "/otb/floorplan-center.png"
