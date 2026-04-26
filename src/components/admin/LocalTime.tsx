"use client";

/**
 * Renders a UTC timestamp in the browser's local timezone.
 *
 * Always use this component (never server-side toLocaleString()) when
 * displaying timestamps in admin pages. Server components run in UTC,
 * so calling toLocaleString() server-side produces UTC-relative output
 * that silently disagrees with client-rendered dates elsewhere in the UI.
 *
 * Pass the raw ISO string from the DB; this component formats it in
 * whatever timezone the admin's browser is set to.
 */
export function LocalTime({
  ts,
  fallback = "—",
}: {
  ts: string | null | undefined;
  fallback?: string;
}) {
  if (!ts) return <span>{fallback}</span>;

  const formatted = new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <time dateTime={ts} title={`UTC: ${new Date(ts).toUTCString()}`}>
      {formatted}
    </time>
  );
}
