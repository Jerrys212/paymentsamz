import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
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
            <PageHeader
                eyebrow={`Pagos · ${period}`}
                action={
                    <PaymentFormDialog
                        mode="create"
                        trigger={
                            <Button>
                                <PlusIcon />
                                Nuevo pago
                            </Button>
                        }
                    />
                }
            />
            <PaymentsTable payments={payments} />
        </section>
    );
}
