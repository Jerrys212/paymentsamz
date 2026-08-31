"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiFetch, resolveActionErrorMessage } from "@/data/client";
import { UpdatePaymentResponseSchema, type Payment } from "@/data/payments/types";
import { env } from "@/lib/env";
import { ObjectIdSchema } from "@/lib/validations/payments";

const UpdatePaymentInputSchema = z
    .object({
        id: ObjectIdSchema,
        settled: z.boolean().optional(),
        img: z.string().optional(),
    })
    .refine((value) => value.settled !== undefined || value.img !== undefined, {
        message: "Se requiere al menos un campo para actualizar",
    });

export type UpdatePaymentInput = z.infer<typeof UpdatePaymentInputSchema>;

export type UpdatePaymentResult = { success: true; data: Payment } | { success: false; message: string };

export async function updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentResult> {
    const parsed = UpdatePaymentInputSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, message: "Datos inválidos para actualizar el pago." };
    }

    const { id, ...body } = parsed.data;

    try {
        const response = await apiFetch(`${env.API_URL}/api/payment/${id}`, UpdatePaymentResponseSchema, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        revalidatePath("/");
        return { success: true, data: response.data };
    } catch (error) {
        const message = resolveActionErrorMessage(error, "updatePayment", "No se pudo actualizar el pago. Intenta de nuevo.");
        return { success: false, message };
    }
}
