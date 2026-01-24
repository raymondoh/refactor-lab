"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

export interface ScheduleEvent {
  title: string;
  start: Date;
  end: Date;
}

export default function ScheduleCalendar({ events }: { events: ScheduleEvent[] }) {
  const [selected, setSelected] = useState<Date | undefined>();

  const datesWithEvents = useMemo(
    () => events.map(e => new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate())),
    [events]
  );

  const modifiers = { hasEvent: datesWithEvents };

  const eventsForSelectedDay = useMemo(
    () => (selected ? events.filter(e => e.start.toDateString() === selected.toDateString()) : []),
    [selected, events]
  );

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        modifiers={modifiers}
        modifiersClassNames={{ hasEvent: "bg-primary text-primary-foreground rounded-full" }}
      />
      {selected &&
        (eventsForSelectedDay.length > 0 ? (
          <ul className="space-y-2">
            {eventsForSelectedDay.map((e, idx) => (
              <li key={idx} className="p-2 border rounded">
                <div className="font-medium">{e.title}</div>
                <div className="text-sm text-muted-foreground">
                  {format(e.start, "p")} - {format(e.end, "p")}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No jobs for this day.</p>
        ))}
    </div>
  );
}
