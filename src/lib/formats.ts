export function formatCurrency(total: number): string {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
    }).format(total);
}

export function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        // Pinned explicitly: without it this resolves to the runtime's local
        // timezone, which differs between the server (SSR, usually UTC) and
        // the browser (client hydration) — a date near UTC midnight can then
        // format to a different calendar day on each pass, causing a text
        // mismatch hydration error (React #418) for this "use client" table.
        timeZone: "America/Mexico_City",
    }).format(new Date(dateString));
}
