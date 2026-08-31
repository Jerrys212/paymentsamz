import { z } from "zod";

export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Identificador inválido");

export const PaymentFormSchema = z.object({
    name: z.string().trim().min(1, "El nombre es requerido"),
    total: z.number({ message: "El total debe ser un número" }).positive("El total debe ser mayor a cero"),
});

export type PaymentFormValues = z.infer<typeof PaymentFormSchema>;
