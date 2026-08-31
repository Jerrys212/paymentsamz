"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
    return (
        <section aria-label="Error" className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 py-10 sm:px-10 sm:py-14">
            <PageHeader eyebrow="Pagos · sin conexión con el servidor" variant="error" />
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
