"use client";

import { useSyncExternalStore } from "react";

function partOfDay() {
  const h = new Date().getHours();
  return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** "Good morning, Alex" in the viewer's own time zone (rendered on the client). */
export function Greeting({ name }: { name: string }) {
  const greeting = useSyncExternalStore(
    () => () => {},
    partOfDay,
    () => "Hello"
  );
  const first = name.split(/\s|@/)[0];
  return (
    <p className="text-sm text-[var(--muted)]">
      {greeting}
      {first ? `, ${first}` : ""}
    </p>
  );
}
