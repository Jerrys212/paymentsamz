"use client";

import Image from "next/image";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { uploadPaymentImage } from "@/actions/payments/upload-payment-image";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formats";

interface UploadReceiptDialogProps {
    paymentId: string;
    paymentName: string;
    paymentTotal: number;
    currentImg: string;
    trigger: ReactNode;
    tooltip?: string;
}

export function UploadReceiptDialog({ paymentId, paymentName, paymentTotal, currentImg, trigger, tooltip }: UploadReceiptDialogProps) {
    const [open, setOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set("paymentId", paymentId);

        startTransition(async () => {
            const result = await uploadPaymentImage(formData);
            if (!result.success) {
                toast.error(result.message);
                return;
            }
            toast.success("Comprobante subido correctamente.");
            setPreviewUrl(null);
            setOpen(false);
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) setPreviewUrl(null);
            }}
        >
            <DialogTriggerButton trigger={trigger} tooltip={tooltip} />
            <DialogContent>
                <DialogHeader>
                    <p className="text-[10px] tracking-[0.12em] uppercase" style={{ color: "var(--color-accent-700)" }}>
                        {paymentName} · {formatCurrency(paymentTotal)}
                    </p>
                    <DialogTitle>Subir comprobante</DialogTitle>
                    <DialogDescription>Selecciona una imagen del comprobante de pago.</DialogDescription>
                </DialogHeader>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="payment-img">Imagen</Label>
                        <Input id="payment-img" name="img" type="file" accept="image/*" onChange={handleFileChange} />
                    </div>
                    {(previewUrl ?? currentImg) && (
                        <Image
                            src={previewUrl ?? currentImg}
                            alt="Vista previa del comprobante"
                            width={160}
                            height={160}
                            unoptimized={!!previewUrl}
                            className="halftone size-40 rounded-md object-cover"
                        />
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            Subir comprobante
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
