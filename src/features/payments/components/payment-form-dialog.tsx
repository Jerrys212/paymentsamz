"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createPayment } from "@/actions/payments/create-payment";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PaymentFormSchema, type PaymentFormValues } from "@/lib/validations/payments";

interface PaymentFormDialogProps {
    mode: "create" | "clone";
    defaultValues?: PaymentFormValues;
    trigger: ReactNode;
    tooltip?: string;
}

export function PaymentFormDialog({ mode, defaultValues, trigger, tooltip }: PaymentFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(PaymentFormSchema),
        defaultValues: defaultValues ?? { name: "", total: 0 },
    });

    function onSubmit(values: PaymentFormValues) {
        startTransition(async () => {
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
            form.reset({ name: "", total: 0 });
            setOpen(false);
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (next) {
                    form.reset(defaultValues ?? { name: "", total: 0 });
                }
            }}
        >
            {tooltip ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>{trigger}</DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{tooltip}</TooltipContent>
                </Tooltip>
            ) : (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            )}
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
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {mode === "clone" ? "Crear copia" : "Guardar pago"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
