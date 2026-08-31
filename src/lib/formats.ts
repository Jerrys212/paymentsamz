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
    }).format(new Date(dateString));
}
