import Link from "next/link";
import type { ReactNode } from "react";

export interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  /** Current search params (e.g. `q`, `role`, `status`) to preserve across page links. */
  searchParams: Record<string, string | undefined>;
}

// Plain Server Component — Previous/Next are ordinary links to `?page=N`,
// so no client JS is needed just to paginate.
export function PaginationControls({ page, pageSize, total, searchParams }: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function hrefForPage(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-500">
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
      </p>
      <div className="flex gap-2">
        <PageLink disabled={page <= 1} href={hrefForPage(page - 1)}>
          Previous
        </PageLink>
        <PageLink disabled={page >= totalPages} href={hrefForPage(page + 1)}>
          Next
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({ disabled, href, children }: { disabled: boolean; href: string; children: ReactNode }) {
  if (disabled) {
    return (
      <span className="inline-flex h-8 cursor-not-allowed items-center rounded-md border border-gray-200 px-3 text-sm text-gray-300">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex h-8 items-center rounded-md border border-gray-300 px-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
    >
      {children}
    </Link>
  );
}
