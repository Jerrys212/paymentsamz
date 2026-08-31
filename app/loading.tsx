import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <section aria-label="Pagos" className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 py-10 sm:px-10 sm:py-14">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs tracking-[0.14em] uppercase" style={{ color: "var(--color-accent-700)" }}>
                        Pagos
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Control de pagos</h1>
                </div>
                <Skeleton className="h-8 w-32" />
            </header>
            <div className="h-[3px] bg-foreground" />
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <span className="size-2 animate-pulse rounded-full" style={{ background: "var(--color-accent)" }} />
                <span>Cargando pagos…</span>
            </div>
            <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-4 border-b border-border py-4 last:border-0"
                        style={{ opacity: 1 - index * 0.15 }}
                    >
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="ml-auto h-4 w-20" />
                    </div>
                ))}
            </div>
        </section>
    );
}
