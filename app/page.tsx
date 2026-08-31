import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPayments } from "@/data/payments/get-payments";
import { PaymentFormDialog } from "@/features/payments/components/payment-form-dialog";
import { PaymentsTable } from "@/features/payments/components/payments-table";

export default async function Home() {
    const payments = await getPayments();

    const now = new Date();
    const monthName = new Intl.DateTimeFormat("es-MX", {
        month: "long",
    }).format(now);
    const period = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${now.getFullYear()}`;

    return (
        <section aria-label="Pagos" className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 py-10 sm:px-10 sm:py-14">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs tracking-[0.14em] uppercase" style={{ color: "var(--color-accent-700)" }}>
                        Pagos · {period}
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Control de pagos</h1>
                </div>
                <PaymentFormDialog
                    mode="create"
                    trigger={
                        <Button>
                            <PlusIcon />
                            Nuevo pago
                        </Button>
                    }
                />
            </header>
            <div className="h-[3px] bg-foreground" />
            <PaymentsTable payments={payments} />
        </section>
    );
}
