"use server";

import { z } from "zod";

import { createPayment } from "@/actions/payments/create-payment";
import { calculateInstallments } from "@/lib/installments";

const CreateInstallmentPaymentsInputSchema = z.object({
    name: z.string().trim().min(1, "El nombre es requerido"),
    total: z.number().positive("El total debe ser mayor a cero"),
    months: z.number().int().min(3, "Mínimo 3 meses").max(15, "Máximo 15 meses"),
});

export type CreateInstallmentPaymentsInput = z.infer<typeof CreateInstallmentPaymentsInputSchema>;

export type CreateInstallmentPaymentsResult = { success: true; createdCount: number; months: number } | { success: false; message: string };

/**
 * The backend has no installments concept, so "N meses sin intereses" is
 * simulated by creating one new Payment per month, looped through the
 * existing create endpoint (there's no bulk-create endpoint) — one at a
 * time, in order. This is deliberately sequential rather than
 * Promise.all(...map...): firing all N creates at once let the backend
 * insert them out of order (createdAt no longer matched installment
 * index, so "7/14" could sort before "14/14") and occasionally dropped
 * one under the concurrent load. Awaiting each in turn fixes both.
 */
export async function createInstallmentPayments(input: CreateInstallmentPaymentsInput): Promise<CreateInstallmentPaymentsResult> {
    const parsed = CreateInstallmentPaymentsInputSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos para diferir el pago." };
    }

    const { name, total, months } = parsed.data;
    const installments = calculateInstallments(total, months);

    let createdCount = 0;
    let firstFailureMessage: string | undefined;

    for (const installment of installments) {
        const result = await createPayment({
            name: `${name} (MSI ${installment.index}/${months})`,
            total: installment.total,
        });

        if (!result.success) {
            firstFailureMessage = result.errors._form?.[0];
            break;
        }

        createdCount += 1;
    }

    if (createdCount === 0) {
        return { success: false, message: firstFailureMessage ?? "No se pudieron crear los pagos diferidos." };
    }

    if (createdCount < months) {
        return {
            success: false,
            message: `Se crearon ${createdCount} de ${months} pagos antes de fallar. Revisa la lista antes de reintentar.`,
        };
    }

    return { success: true, createdCount, months };
}
