"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, resolveActionErrorMessage } from "@/data/client";
import { CreatePaymentResponseSchema, type Payment } from "@/data/payments/types";
import { env } from "@/lib/env";
import { PaymentFormSchema } from "@/lib/validations/payments";

export type CreatePaymentResult = { success: true; data: Payment } | { success: false; errors: Record<string, string[] | undefined> };

export async function createPayment(input: unknown): Promise<CreatePaymentResult> {
    const parsed = PaymentFormSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    try {
        const response = await apiFetch(`${env.API_URL}/api/payment`, CreatePaymentResponseSchema, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
        });
        revalidatePath("/");
        return { success: true, data: response.data };
    } catch (error) {
        const message = resolveActionErrorMessage(error, "createPayment", "No se pudo crear el pago. Intenta de nuevo.");
        return { success: false, errors: { _form: [message] } };
    }
}
