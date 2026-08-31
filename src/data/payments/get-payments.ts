import { z } from "zod";

import { ErrorTracker } from "@/adapters/error-tracking";
import { apiFetch, ApiError } from "@/data/client";
import { ListPaymentsResponseSchema, type Payment } from "@/data/payments/types";
import { env } from "@/lib/env";

export async function getPayments(): Promise<Payment[]> {
    try {
        const response = await apiFetch(`${env.API_URL}/api/payment`, ListPaymentsResponseSchema, { next: { revalidate: 300 } });
        return sortPayments(response.data);
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error instanceof z.ZodError) {
            ErrorTracker.captureException(error, { source: "getPayments" });
        }
        throw new Error("No se pudieron cargar los pagos. Intenta de nuevo más tarde.");
    }
}

function sortPayments(payments: Payment[]): Payment[] {
    return [...payments].sort((a, b) => {
        if (a.settled !== b.settled) return a.settled ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}
