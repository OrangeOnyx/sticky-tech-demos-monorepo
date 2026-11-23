import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { injectBasicCatalogStyles, setMarkdownRenderer } from "@a2ui/web_core/v0_9/basic_catalog"
import { renderMarkdown } from "@a2ui/markdown-it"
import App from "./App.tsx"
import "./index.css"

injectBasicCatalogStyles()
setMarkdownRenderer(renderMarkdown)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
