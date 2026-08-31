# Payments — estado de la implementación

Este documento resume qué se construyó para reconstruir el frontend del módulo de
**Payments**, y cómo pedirle a **Claude Design** (skill `/design`) que nos ayude a
subirle el nivel visual a lo que ya funciona.

## 1. Contexto

El frontend original de este módulo se perdió. Solo sobrevivía el backend, documentado
en `instructions.md` (base URL `{API_URL}/api/payment`, backend real en
`https://invitations-yb1o.onrender.com`). Se reconstruyó el frontend completo desde cero
siguiendo la arquitectura definida en `CLAUDE.md`/`AGENTS.md`: Next.js 16 App Router,
Server Components + Server Actions, Zod como única fuente de validación, shadcn/ui +
Radix, Tailwind v4.

## 2. Qué quedó funcionando

**Flujos implementados** (backend real, sin mocks):

| Flujo             | Cómo                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Listar pagos      | Server Component (`app/page.tsx`) hace `GET /api/payment` y renderiza una tabla                                                            |
| Crear pago        | Dialog con formulario (react-hook-form + Zod) → Server Action `createPayment` → `POST /api/payment`                                        |
| Marcar saldado    | `Switch` en cada fila → Server Action `updatePayment` → `PATCH /api/payment/:id`                                                           |
| Clonar pago       | Mismo dialog de "crear", prellenado con `name`/`total` de la fila (sin volver a pedir el backend)                                          |
| Subir comprobante | Dialog con input de archivo → Server Action `uploadPaymentImage`: sube a `/api/payment/upload` y encadena el `PATCH` con la URL resultante |

**Estructura de archivos nueva** (por capa, según `CLAUDE.md`):

```
src/lib/env.ts                                   # API_URL validado con Zod
src/lib/formats.ts                               # formatCurrency (MXN)
src/lib/validations/payments.ts                  # PaymentFormSchema, ObjectIdSchema
src/adapters/error-tracking.ts                   # ErrorTracker mínimo
src/data/client.ts                               # apiFetch<T> — único punto de HTTP
src/data/payments/types.ts                       # Payment + schemas de respuesta del backend real
src/data/payments/get-payments.ts                # GET /api/payment
src/actions/payments/create-payment.ts           # POST /api/payment
src/actions/payments/update-payment.ts           # PATCH /api/payment/:id
src/actions/payments/upload-payment-image.ts     # POST /api/payment/upload + PATCH encadenado
src/features/payments/components/*.tsx           # PaymentsTable, SettledSwitch, PaymentFormDialog,
                                                  # UploadReceiptDialog, PaymentRowActions
app/page.tsx, app/loading.tsx, app/error.tsx     # ruta única "/"
app/layout.tsx                                   # <main>, <Toaster />
```

**Verificación hecha:**

- `pnpm exec tsc --noEmit` y `pnpm lint` limpios.
- `pnpm dev` (puerto 3001) probado contra el backend real: el listado carga los pagos
  reales, con montos en MXN y thumbnails de Cloudinary.
- El contrato de `PATCH /:id` se probó en vivo (toggle de `settled` y reversión) — coincide
  con el schema de Zod.
- El shape de error `400` de creación (`{errors:[{msg}]}` sin `message`) se probó y se
  ajustó `apiFetch` para extraer ese mensaje.
- **No probado en navegador todavía**: los tres diálogos (crear, clonar, subir
  comprobante) — falta abrir `http://localhost:3001` y probarlos a mano, o instalar la
  extensión de Claude in Chrome para que yo lo haga.

## 3. Lo que falta: estilo de primer nivel

Ahora mismo la UI usa el tema **por defecto** de shadcn (`radix-nova`, base color
`neutral`, grises en OKLCH) sin ninguna personalización de marca — es funcional pero
genérica. Falta:

- Paleta de marca (color primario, acentos, estados success/warning/destructive con
  intención, no solo el rojo default de shadcn).
- Tipografía con jerarquía (actualmente solo Geist Sans/Mono por defecto de Next).
- Estados vacíos, loading y de error con más personalidad (hoy son `Skeleton`s genéricos).
- Micro-interacciones (hover/focus en la tabla, transición al abrir diálogos, feedback
  visual al marcar saldado o subir comprobante).
- Modo oscuro real revisado (los tokens de `.dark` en `app/globals.css` son los que trae
  shadcn por defecto, sin ajustar).
- Layout responsive pensado para mobile real (hoy la tabla es una tabla HTML simple con
  scroll horizontal en pantallas chicas).

## 4. Cómo pedirle esto a Claude Design (`/design`)

`/design` genera un **canvas visual** (mockups en artboards, publicado como Artifact) —
no escribe código de producción directamente. El flujo recomendado es:

1. Pedirle a `/design` un mockup de alta fidelidad de las pantallas clave.
2. Revisar/ajustar el mockup en el canvas (colores, tipografía, spacing).
3. Traer esa dirección visual de vuelta a este repo: actualizar los tokens en
   `app/globals.css` (`--primary`, `--radius`, etc.) y los componentes shadcn/`src/features`
   para que coincidan.

Para que el resultado sea "de primer nivel" y no un mockup genérico, dale a `/design`
contexto específico de esta app, no solo "hazlo bonito". Un prompt que funciona bien:

> Diseña la interfaz de una app de control de pagos personales (estilo fintech/finanzas
> personales, no un dashboard corporativo genérico). Necesito estos artboards:
>
> 1. **Listado de pagos** — tabla/lista con: nombre del pago, monto en pesos mexicanos
>    (MXN), estado saldado/pendiente (toggle), thumbnail del comprobante si existe, y
>    acciones por fila (clonar, subir comprobante). Incluye el header con botón "Nuevo
>    pago" y un estado vacío cuando no hay pagos.
> 2. **Dialog "Nuevo pago" / "Clonar pago"** — formulario simple de 2 campos (nombre,
>    total) con validación inline.
> 3. **Dialog "Subir comprobante"** — input de archivo con preview de la imagen antes y
>    después de subir.
> 4. **Estado de carga** y **estado de error** de la pantalla principal.
>
> Dame variante en **modo claro y oscuro**. Quiero un estilo moderno, confiable, cálido
> (no frío/corporativo) — piensa en apps como las de banca personal o control de gastos
> bien cuidadas, con buena jerarquía tipográfica y un color de marca que le dé
> personalidad (hoy todo es gris neutro). Mobile-first: la tabla debe funcionar bien en
> una pantalla angosta. El copy es en español ("Nuevo pago", "Saldado", "Pendiente",
> "Subir comprobante").
>
> Contexto técnico (para que la dirección visual sea trasladable): la app usa
> shadcn/ui + Tailwind v4 con tokens CSS en `app/globals.css` (`--primary`,
> `--background`, `--radius`, etc.) — no hace falta que diseñes componentes desde cero,
> pero sí que la paleta/tipografía/espaciado que propongas sea clara para traducirla a
> esos tokens.

Después de tener el mockup, pídeme a mí (o dime tú) que traduzca esos tokens visuales a
`app/globals.css` y a los componentes en `src/features/payments/components/` — ese es el
paso que sí toca código de producción.
