"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { deferPayment } from "@/actions/payments/defer-payment";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTriggerButton,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formats";
import { calculateInstallments } from "@/lib/installments";

const MONTH_OPTIONS = Array.from({ length: 13 }, (_, index) => index + 3); // 3..15

interface DeferPaymentDialogProps {
    paymentId: string;
    paymentName: string;
    paymentTotal: number;
    trigger: ReactNode;
}

export function DeferPaymentDialog({ paymentId, paymentName, paymentTotal, trigger }: DeferPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [months, setMonths] = useState(3);
    const [isPending, startTransition] = useTransition();

    const installments = calculateInstallments(paymentTotal, months);
    const regularAmount = installments[0].total;
    const lastAmount = installments[months - 1].total;
    const isEven = regularAmount === lastAmount;

    function handleConfirm() {
        startTransition(async () => {
            const result = await deferPayment({ paymentId, name: paymentName, total: paymentTotal, months });
            if (!result.success) {
                toast.error(result.message);
                return;
            }
            toast.success(`Se crearon ${result.createdCount} pagos a ${result.months} meses sin intereses.`);
            setOpen(false);
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTriggerButton trigger={trigger} tooltip="Diferir a meses sin intereses" />
            <DialogContent>
                <DialogHeader>
                    <p className="text-[10px] tracking-[0.12em] uppercase" style={{ color: "var(--color-accent-700)" }}>
                        {paymentName} · {formatCurrency(paymentTotal)}
                    </p>
                    <DialogTitle>Diferir a meses sin intereses</DialogTitle>
                    <DialogDescription>Se crea un pago nuevo por cada mensualidad y este pago se marca como saldado.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="defer-months">Número de meses</Label>
                        <Select value={String(months)} onValueChange={(value) => setMonths(Number(value))}>
                            <SelectTrigger id="defer-months" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTH_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={String(option)}>
                                        {option} meses
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-sm">
                        {isEven ? (
                            <p>
                                {months} pagos de <span className="font-heading font-semibold tabular-nums">{formatCurrency(regularAmount)}</span> c/u
                            </p>
                        ) : (
                            <p>
                                {months - 1} pagos de <span className="font-heading font-semibold tabular-nums">{formatCurrency(regularAmount)}</span> y 1
                                pago de <span className="font-heading font-semibold tabular-nums">{formatCurrency(lastAmount)}</span>
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button type="button" onClick={handleConfirm} disabled={isPending}>
                        Diferir pago
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
