"use server";

import { z } from "zod";

import { createPayment } from "@/actions/payments/create-payment";
import { updatePayment } from "@/actions/payments/update-payment";
import { calculateInstallments } from "@/lib/installments";
import { ObjectIdSchema } from "@/lib/validations/payments";

const DeferPaymentInputSchema = z.object({
    paymentId: ObjectIdSchema,
    name: z.string().trim().min(1),
    total: z.number().positive(),
    months: z.number().int().min(3, "Mínimo 3 meses").max(15, "Máximo 15 meses"),
});

export type DeferPaymentInput = z.infer<typeof DeferPaymentInputSchema>;

export type DeferPaymentResult = { success: true; createdCount: number; months: number } | { success: false; message: string };

/**
 * The backend has no native "installments" concept — it's simulated by
 * creating one new Payment per month (via the existing create endpoint,
 * looped) and marking the original as settled once every installment
 * exists, so the original amount isn't double-counted alongside the plan.
 */
export async function deferPayment(input: DeferPaymentInput): Promise<DeferPaymentResult> {
    const parsed = DeferPaymentInputSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, message: "Datos inválidos para diferir el pago." };
    }

    const { paymentId, name, total, months } = parsed.data;
    const installments = calculateInstallments(total, months);

    const results = await Promise.all(
        installments.map((installment) =>
            createPayment({
                name: `${name} (MSI ${installment.index}/${months})`,
                total: installment.total,
            }),
        ),
    );

    const createdCount = results.filter((result) => result.success).length;

    if (createdCount < months) {
        if (createdCount === 0) {
            const firstFailure = results.find((result) => !result.success);
            const message = firstFailure && !firstFailure.success ? (firstFailure.errors._form?.[0] ?? undefined) : undefined;
            return { success: false, message: message ?? "No se pudieron crear los pagos diferidos." };
        }
        return {
            success: false,
            message: `Se crearon ${createdCount} de ${months} pagos antes de fallar. Revisa la lista e intenta de nuevo con los meses restantes.`,
        };
    }

    await updatePayment({ id: paymentId, settled: true });

    return { success: true, createdCount, months };
}
