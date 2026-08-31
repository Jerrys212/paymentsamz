"use client";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
    return (
        <section aria-label="Error" className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 py-10 sm:px-10 sm:py-14">
            <div>
                <p className="text-xs tracking-[0.14em] uppercase" style={{ color: "var(--color-accent-2-700)" }}>
                    Pagos · sin conexión con el servidor
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Control de pagos</h1>
            </div>
            <div className="h-[3px]" style={{ background: "var(--color-accent-2-700)" }} />
            <div className="flex max-w-md flex-col gap-4 py-4">
                <h2 className="text-xl font-semibold">No se pudieron cargar los pagos</h2>
                <p className="text-sm text-muted-foreground">
                    {error.message || "El servidor no respondió. Tus datos están a salvo; solo falló la lectura."}
                </p>
                <Button onClick={reset} className="w-fit">
                    Reintentar
                </Button>
            </div>
        </section>
    );
}
