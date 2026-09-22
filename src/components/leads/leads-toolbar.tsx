"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LEAD_STATUS_VALUES, LEAD_SOURCE_VALUES } from "@/lib/leads/validation";

function sourceLabel(source: string) {
  return source === "cold_outreach" ? "Cold outreach" : source.charAt(0).toUpperCase() + source.slice(1);
}

export function LeadsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    });
  }

  // Debounce free-text search so every keystroke doesn't trigger a
  // navigation; status/source selects update immediately since they're
  // discrete choices, not typed input. Skipping the no-op case (search
  // hasn't actually changed from the URL's current `q`) matters on mount:
  // without it, this effect always fires once anyway and `updateParam`
  // unconditionally strips `page`, silently bouncing a direct/shared/
  // reloaded `?page=3` link back to page 1.
  useEffect(() => {
    if (search === (searchParams.get("q") ?? "")) return;
    const handle = setTimeout(() => {
      updateParam("q", search || null);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    // flex-wrap (rather than forcing a single row) matters at in-between
    // widths — e.g. tablet, or desktop with the sidebar taking real estate —
    // where the two sm:w-44 selects alone can approach the toolbar's full
    // width: without wrap, the search box (flex-1) doesn't shrink out of
    // existence, but its *content* does, leaving an unusably narrow input.
    // min-w on the search wrapper is the other half of that fix — it gives
    // flex-wrap an actual floor to wrap around instead of one to shrink past.
    <div className="flex flex-col flex-wrap gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
      <div className="relative min-w-[12rem] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name, company, or email…"
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <Select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(event) => updateParam("status", event.target.value || null)}
        className="sm:w-44"
      >
        <option value="">All statuses</option>
        {LEAD_STATUS_VALUES.map((status) => (
          <option key={status} value={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </option>
        ))}
      </Select>
      <Select
        defaultValue={searchParams.get("source") ?? ""}
        onChange={(event) => updateParam("source", event.target.value || null)}
        className="sm:w-44"
      >
        <option value="">All sources</option>
        {LEAD_SOURCE_VALUES.map((source) => (
          <option key={source} value={source}>
            {sourceLabel(source)}
          </option>
        ))}
      </Select>
    </div>
  );
}
