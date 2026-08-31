"use server";

import { z } from "zod";

import { updatePayment } from "@/actions/payments/update-payment";
import { ObjectIdSchema } from "@/lib/validations/payments";

const SettlePaymentsInputSchema = z.array(ObjectIdSchema).min(1, "Selecciona al menos un pago.");

export type SettlePaymentsResult =
    | { success: true; settledCount: number; requestedCount: number }
    | { success: false; message: string };

export async function settlePayments(ids: string[]): Promise<SettlePaymentsResult> {
    const parsed = SettlePaymentsInputSchema.safeParse(ids);
    if (!parsed.success) {
        return { success: false, message: "Selecciona al menos un pago para saldar." };
    }

    const results = await Promise.all(parsed.data.map((id) => updatePayment({ id, settled: true })));
    const settledCount = results.filter((result) => result.success).length;

    if (settledCount === 0) {
        const firstFailure = results.find((result) => !result.success);
        const message = firstFailure && !firstFailure.success ? firstFailure.message : "No se pudieron saldar los pagos seleccionados.";
        return { success: false, message };
    }

    return { success: true, settledCount, requestedCount: parsed.data.length };
}
