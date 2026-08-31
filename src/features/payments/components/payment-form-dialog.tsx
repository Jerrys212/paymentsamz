"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createInstallmentPayments } from "@/actions/payments/create-installment-payments";
import { createPayment } from "@/actions/payments/create-payment";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formats";
import { calculateInstallments } from "@/lib/installments";
import { PaymentFormSchema, type PaymentFormValues } from "@/lib/validations/payments";

const MONTH_OPTIONS = Array.from({ length: 13 }, (_, index) => index + 3); // 3..15

interface PaymentFormDialogProps {
    mode: "create" | "clone";
    defaultValues?: PaymentFormValues;
    trigger: ReactNode;
    tooltip?: string;
}

export function PaymentFormDialog({ mode, defaultValues, trigger, tooltip }: PaymentFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [deferToMonths, setDeferToMonths] = useState(false);
    const [months, setMonths] = useState(3);
    const [isPending, startTransition] = useTransition();

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(PaymentFormSchema),
        defaultValues: defaultValues ?? { name: "", total: 0 },
    });

    const watchedTotal = useWatch({ control: form.control, name: "total" });
    const installments = calculateInstallments(watchedTotal || 0, months);
    const regularAmount = installments[0]?.total ?? 0;
    const lastAmount = installments[months - 1]?.total ?? 0;
    const isEven = regularAmount === lastAmount;

    function resetForm() {
        form.reset(defaultValues ?? { name: "", total: 0 });
        setDeferToMonths(false);
        setMonths(3);
    }

    function onSubmit(values: PaymentFormValues) {
        startTransition(async () => {
            if (deferToMonths) {
                const result = await createInstallmentPayments({ name: values.name, total: values.total, months });
                if (!result.success) {
                    toast.error(result.message);
                    return;
                }
                toast.success(`Se crearon ${result.createdCount} pagos a ${result.months} meses sin intereses.`);
                resetForm();
                setOpen(false);
                return;
            }

            const result = await createPayment(values);
            if (!result.success) {
                for (const [field, messages] of Object.entries(result.errors)) {
                    if (field === "_form" || !messages?.length) continue;
                    form.setError(field as keyof PaymentFormValues, {
                        message: messages[0],
                    });
                }
                const formError = result.errors._form?.[0];
                if (formError) {
                    toast.error(formError);
                }
                return;
            }
            toast.success("Pago creado correctamente.");
            resetForm();
            setOpen(false);
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (next) resetForm();
            }}
        >
            <DialogTriggerButton trigger={trigger} tooltip={tooltip} />
            <DialogContent>
                <DialogHeader>
                    {mode === "clone" && defaultValues && (
                        <p className="text-[10px] tracking-[0.12em] uppercase" style={{ color: "var(--color-accent-700)" }}>
                            Clonar de {defaultValues.name}
                        </p>
                    )}
                    <DialogTitle>Nuevo pago</DialogTitle>
                    <DialogDescription>Ingresa el nombre y el total del pago.</DialogDescription>
                </DialogHeader>
                <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="payment-name">Nombre</Label>
                        <Input id="payment-name" aria-invalid={!!form.formState.errors.name} {...form.register("name")} />
                        {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="payment-total">Total (MXN)</Label>
                        <Input
                            id="payment-total"
                            type="number"
                            step="0.01"
                            className="tabular-nums"
                            aria-invalid={!!form.formState.errors.total}
                            {...form.register("total", { valueAsNumber: true })}
                        />
                        {form.formState.errors.total && <p className="text-xs text-destructive">{form.formState.errors.total.message}</p>}
                    </div>

                    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
                        <Label className="flex items-center gap-2 font-normal">
                            <Checkbox checked={deferToMonths} onCheckedChange={(checked) => setDeferToMonths(checked === true)} />
                            Diferir a meses sin intereses
                        </Label>
                        {deferToMonths && (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="payment-months">Número de meses</Label>
                                    <Select value={String(months)} onValueChange={(value) => setMonths(Number(value))}>
                                        <SelectTrigger id="payment-months" className="w-full">
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
                                <p className="text-sm text-muted-foreground">
                                    {isEven ? (
                                        <>
                                            {months} pagos de{" "}
                                            <span className="font-heading font-semibold text-foreground tabular-nums">{formatCurrency(regularAmount)}</span>{" "}
                                            c/u
                                        </>
                                    ) : (
                                        <>
                                            {months - 1} pagos de{" "}
                                            <span className="font-heading font-semibold text-foreground tabular-nums">{formatCurrency(regularAmount)}</span>{" "}
                                            y 1 pago de{" "}
                                            <span className="font-heading font-semibold text-foreground tabular-nums">{formatCurrency(lastAmount)}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {deferToMonths ? `Diferir a ${months} meses` : mode === "clone" ? "Crear copia" : "Guardar pago"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
