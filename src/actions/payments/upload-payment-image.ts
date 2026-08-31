"use server";

import { z } from "zod";

import { updatePayment, type UpdatePaymentResult } from "@/actions/payments/update-payment";
import { ErrorTracker } from "@/adapters/error-tracking";
import { ApiError, apiFetch } from "@/data/client";
import { UploadImageResponseSchema } from "@/data/payments/types";
import { env } from "@/lib/env";
import { ObjectIdSchema } from "@/lib/validations/payments";

export async function uploadPaymentImage(formData: FormData): Promise<UpdatePaymentResult> {
    const paymentId = ObjectIdSchema.safeParse(formData.get("paymentId"));
    if (!paymentId.success) {
        return { success: false, message: "Identificador de pago inválido." };
    }

    const file = formData.get("img");
    if (!(file instanceof File) || file.size === 0) {
        return { success: false, message: "No se seleccionó ninguna imagen." };
    }

    try {
        const uploadFormData = new FormData();
        uploadFormData.set("img", file);

        const uploadResponse = await apiFetch(`${env.API_URL}/api/payment/upload`, UploadImageResponseSchema, {
            method: "POST",
            body: uploadFormData,
        });

        return await updatePayment({ id: paymentId.data, img: uploadResponse.url });
    } catch (error) {
        if (error instanceof z.ZodError) {
            ErrorTracker.captureException(error, { source: "uploadPaymentImage" });
        }
        const message = error instanceof ApiError ? error.message : "No se pudo subir el comprobante. Intenta de nuevo.";
        return { success: false, message };
    }
}
