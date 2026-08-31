import { z } from "zod";

export const PaymentSchema = z.object({
    _id: z.string(),
    name: z.string(),
    total: z.number(),
    settled: z.boolean(),
    img: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type Payment = z.infer<typeof PaymentSchema>;

export const ListPaymentsResponseSchema = z.object({
    code: z.number(),
    message: z.string(),
    data: z.array(PaymentSchema),
});

export const CreatePaymentResponseSchema = z.object({
    code: z.number(),
    message: z.string(),
    data: PaymentSchema,
});

export const UpdatePaymentResponseSchema = z.object({
    code: z.number(),
    message: z.string(),
    data: PaymentSchema,
});

export const UploadImageResponseSchema = z.object({
    code: z.number(),
    message: z.string(),
    url: z.string(),
});
