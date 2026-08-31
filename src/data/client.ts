import { z } from "zod";

import { ErrorTracker } from "@/adapters/error-tracking";

const ApiErrorBodySchema = z.object({
    code: z.number().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
    errors: z.array(z.object({ msg: z.string().optional() })).optional(),
});

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

async function extractErrorMessage(res: Response): Promise<string> {
    const fallback = "No se pudo completar la solicitud. Intenta de nuevo.";
    try {
        const json: unknown = await res.json();
        const parsed = ApiErrorBodySchema.safeParse(json);
        if (!parsed.success) return fallback;
        if (parsed.data.message) return parsed.data.message;
        const firstFieldError = parsed.data.errors?.[0]?.msg;
        if (firstFieldError) return firstFieldError;
        return fallback;
    } catch {
        return fallback;
    }
}

export async function apiFetch<T>(url: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
        throw new ApiError(res.status, await extractErrorMessage(res));
    }
    const json: unknown = await res.json();
    return schema.parse(json);
}

/**
 * Shared catch-block logic for Server Actions calling `apiFetch`: reports
 * schema-contract mismatches (`ZodError`) to the error tracker, and derives a
 * user-facing (Spanish) message from an `ApiError`, falling back otherwise.
 */
export function resolveActionErrorMessage(error: unknown, source: string, fallback: string): string {
    if (error instanceof z.ZodError) {
        ErrorTracker.captureException(error, { source });
    }
    return error instanceof ApiError ? error.message : fallback;
}
