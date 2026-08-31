"use client";

import { CalendarClockIcon, CopyIcon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeferPaymentDialog } from "@/features/payments/components/defer-payment-dialog";
import { PaymentFormDialog } from "@/features/payments/components/payment-form-dialog";
import { UploadReceiptDialog } from "@/features/payments/components/upload-receipt-dialog";
import type { Payment } from "@/data/payments/types";

interface PaymentRowActionsProps {
    payment: Payment;
}

export function PaymentRowActions({ payment }: PaymentRowActionsProps) {
    return (
        <div className="flex justify-end gap-1">
            <PaymentFormDialog
                mode="clone"
                defaultValues={{ name: payment.name, total: payment.total }}
                tooltip="Clonar pago"
                trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Clonar pago ${payment.name}`}>
                        <CopyIcon />
                    </Button>
                }
            />
            {!payment.img && (
                <UploadReceiptDialog
                    paymentId={payment._id}
                    paymentName={payment.name}
                    paymentTotal={payment.total}
                    currentImg={payment.img}
                    tooltip="Subir comprobante"
                    trigger={
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[color:var(--color-accent-700)] hover:text-[color:var(--color-accent-700)]"
                            aria-label={`Subir comprobante para ${payment.name}`}
                        >
                            <UploadIcon />
                            {/* <span className="hidden sm:inline">Comprobante</span> */}
                        </Button>
                    }
                />
            )}
            {!payment.settled && (
                <DeferPaymentDialog
                    paymentId={payment._id}
                    paymentName={payment.name}
                    paymentTotal={payment.total}
                    trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={`Diferir a meses sin intereses ${payment.name}`}>
                            <CalendarClockIcon />
                        </Button>
                    }
                />
            )}
        </div>
    );
}
