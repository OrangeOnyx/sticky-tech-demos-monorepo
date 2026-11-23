"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
} from "@ui-sdk/react/combobox"
import {
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
  DatePicker,
  DatePickerContent,
  DatePickerHint,
  DatePickerInput,
  DatePickerTrigger,
} from "@ui-sdk/react/date-picker"
import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select"
import { labelFor, showingTypes, stopLabels, units, type Unit } from "../fixtures/showing"
import type { WriteDetails } from "../script/act-gate"
import { TourStopsView } from "./tour-stops-view"

type ShowingFormProps = {
  unit: string | null
  showingType: string | null
  date: string | null
  guest: string
  stops: string[]
  onUnitChange: (value: string | null, details?: WriteDetails) => void
  onShowingTypeChange: (value: string | null, details?: WriteDetails) => void
  onDateChange: (value: string | null, details?: WriteDetails) => void
  onGuestChange: (value: string, details?: WriteDetails) => void
  onStopsChange: (value: string[], details?: WriteDetails) => void
}

function Caret() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`))
}

function ShowingForm({
  unit,
  showingType,
  date,
  guest,
  stops,
  onUnitChange,
  onShowingTypeChange,
  onDateChange,
  onGuestChange,
  onStopsChange,
}: ShowingFormProps) {
  const ready = Boolean(unit && showingType && date && guest.trim())
  const stopLine = stops.map((id) => stopLabels[id] ?? id).join(" → ")

  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault()
      }}
    >
      <Field name="unit">
        <FieldLabel>Unit</FieldLabel>
        <Combobox
          items={units}
          itemToLabel={(value) => labelFor(units, value)}
          value={unit}
          onValueChange={onUnitChange}
          required
        >
          <div className="control-row">
            <ComboboxInput placeholder="Search units" autoComplete="off" />
            <ComboboxTrigger aria-label="Show units">
              <Caret />
            </ComboboxTrigger>
          </div>
          <ComboboxContent>
            <ComboboxEmpty>No units match that search.</ComboboxEmpty>
            <ComboboxList>
              {(state) =>
                (state.items as Unit[]).map((item) => (
                  <ComboboxItem key={item.value} value={item.value} label={item.label}>
                    <span className="item-copy">
                      <span>{item.label}</span>
                      <span className="meta">
                        {item.building} · {item.beds}
                      </span>
                    </span>
                    <ComboboxItemIndicator>✓</ComboboxItemIndicator>
                  </ComboboxItem>
                ))
              }
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>Type a few letters, then press Enter.</FieldDescription>
      </Field>

      <Field name="showingType">
        <FieldLabel>Showing type</FieldLabel>
        <Select
          items={showingTypes}
          placeholder="Select a type"
          value={showingType}
          onValueChange={onShowingTypeChange}
          required
        >
          <SelectTrigger>
            <SelectValue />
            <Caret />
          </SelectTrigger>
          <SelectContent>
            {showingTypes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field name="showingDate">
        <FieldLabel>Showing date</FieldLabel>
        <DatePicker
          value={date}
          onValueChange={(value, details) => {
            onDateChange(typeof value === "string" ? value : null, details)
          }}
          required
        >
          <div className="control-row">
            <DatePickerInput />
            <DatePickerTrigger>Open calendar</DatePickerTrigger>
          </div>
          <DatePickerHint />
          <DatePickerContent>
            <div className="calendar-nav">
              <CalendarPrevious>Previous month</CalendarPrevious>
              <CalendarHeading />
              <CalendarNext>Next month</CalendarNext>
            </div>
            <CalendarGrid>
              <CalendarWeekdays>
                {(index) => <CalendarWeekday index={index} />}
              </CalendarWeekdays>
              <CalendarWeeks>
                {(cell) => <CalendarDay value={cell.date} />}
              </CalendarWeeks>
            </CalendarGrid>
          </DatePickerContent>
        </DatePicker>
      </Field>

      <Field name="guest">
        <FieldLabel>Guest</FieldLabel>
        <Input
          value={guest}
          placeholder="Guest name"
          autoComplete="off"
          onValueChange={onGuestChange}
          required
        />
        <FieldDescription>Invented for this demo. Nothing is saved.</FieldDescription>
      </Field>

      <div className="stops">
        <div className="stops-heading" id="tour-stops-label">
          Tour stops
        </div>
        <p className="hint" id="tour-stops-hint">
          Drag a stop, or focus it and press Space, then the arrow keys, then Space again.
        </p>
        <TourStopsView
          aria-labelledby="tour-stops-label"
          aria-describedby="tour-stops-hint"
          labels={stopLabels}
          value={stops}
          onValueChange={onStopsChange}
        />
      </div>

      <p className="receipt" role="status">
        {ready ? (
          <>
            {guest.trim()} sees {labelFor(units, unit)} on {formatDate(date ?? "")},{" "}
            {labelFor(showingTypes, showingType).toLocaleLowerCase()}. Stops: {stopLine}.
          </>
        ) : (
          "The showing is empty until a unit, type, date, and guest are set."
        )}
      </p>
    </form>
  )
}

export { ShowingForm }
export type { ShowingFormProps }
