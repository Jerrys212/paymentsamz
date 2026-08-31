"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updatePayment } from "@/actions/payments/update-payment";
import { Switch } from "@/components/ui/switch";

interface SettledSwitchProps {
    paymentId: string;
    settled: boolean;
}

export function SettledSwitch({ paymentId, settled }: SettledSwitchProps) {
    const [checked, setChecked] = useState(settled);
    const [isPending, startTransition] = useTransition();

    function handleCheckedChange(next: boolean) {
        setChecked(next);
        startTransition(async () => {
            const result = await updatePayment({ id: paymentId, settled: next });
            if (!result.success) {
                setChecked(!next);
                toast.error(result.message);
                return;
            }
            toast.success(next ? "Pago marcado como saldado." : "Pago marcado como pendiente.");
        });
    }

    return (
        <Switch
            checked={checked}
            onCheckedChange={handleCheckedChange}
            disabled={isPending}
            aria-label={checked ? "Marcar pago como pendiente" : "Marcar pago como saldado"}
        />
    );
}
