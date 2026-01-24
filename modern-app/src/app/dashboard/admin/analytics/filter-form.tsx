"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  start?: string;
  end?: string;
  region?: string;
}

export default function FilterForm({ start, end, region }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ start: start || "", end: end || "", region: region || "" });

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (form.start) params.set("start", form.start);
        if (form.end) params.set("end", form.end);
        if (form.region) params.set("region", form.region);
        router.push(`/dashboard/admin/analytics?${params.toString()}`);
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="flex flex-col">
        <label className="text-sm" htmlFor="start">Start</label>
        <input
          id="start"
          type="date"
          value={form.start}
          onChange={e => setForm({ ...form, start: e.target.value })}
          className="border rounded px-2 py-1"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm" htmlFor="end">End</label>
        <input
          id="end"
          type="date"
          value={form.end}
          onChange={e => setForm({ ...form, end: e.target.value })}
          className="border rounded px-2 py-1"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm" htmlFor="region">Region</label>
        <input
          id="region"
          type="text"
          placeholder="e.g. SW"
          value={form.region}
          onChange={e => setForm({ ...form, region: e.target.value })}
          className="border rounded px-2 py-1"
        />
      </div>
      <Button type="submit" className="mt-4">Apply</Button>
    </form>
  );
}

