export interface BriefPreset {
  id: string
  label: string
  brief: string
}

export const PRESETS: BriefPreset[] = [
  {
    id: "dark-saas-pricing",
    label: "Dark SaaS pricing",
    brief: "minimal SaaS pricing page, dark, generous whitespace",
  },
  {
    id: "editorial-magazine",
    label: "Editorial magazine",
    brief: "calm editorial magazine homepage, light paper, serif headlines, generous margins",
  },
  {
    id: "uncatalogued",
    label: "Uncatalogued brief",
    brief: "underwater chess tournament for quantum bananas, fluorescent plaid",
  },
]
