"use client"

import { useState } from "react"
import { AgentPanel } from "./components/agent-panel"
import { ShowingForm } from "./components/showing-form"
import { emptyShowing } from "./script/showing-script"

function ShowingDesk() {
  const [unit, setUnit] = useState(emptyShowing.unit)
  const [showingType, setShowingType] = useState(emptyShowing.showingType)
  const [date, setDate] = useState(emptyShowing.date)
  const [guest, setGuest] = useState(emptyShowing.guest)
  const [stops, setStops] = useState(emptyShowing.stops)

  function reset() {
    setUnit(emptyShowing.unit)
    setShowingType(emptyShowing.showingType)
    setDate(emptyShowing.date)
    setGuest(emptyShowing.guest)
    setStops([...emptyShowing.stops])
  }

  return (
    <div className="page">
      <header className="mast">
        <div>
          <p className="brand">Cypress Command</p>
          <h1>Schedule a showing</h1>
          <p className="lede">
            Assign a unit on the Harbor Annex desk. The form is UI SDK behavior, and the
            panel fills it through the agent bridge.
          </p>
        </div>
        <p className="stamp">Sample data · UI SDK 0.1.0-beta.13</p>
      </header>
      <div className="layout">
        <ShowingForm
          unit={unit}
          showingType={showingType}
          date={date}
          guest={guest}
          stops={stops}
          onUnitChange={setUnit}
          onShowingTypeChange={setShowingType}
          onDateChange={setDate}
          onGuestChange={setGuest}
          onStopsChange={setStops}
        />
        <AgentPanel onReset={reset} />
      </div>
    </div>
  )
}

export { ShowingDesk }
