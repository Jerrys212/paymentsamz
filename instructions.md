# Módulo de Payments — Especificación para reconstruir el Front

Documentación generada a partir del backend actual (`src/controllers/Payment.Controller.ts`,
`src/models/Payment.ts`, `src/routes/paymentRouter.ts`) para reconstruir el frontend perdido.

## Base URL

```
{API_URL}/api/payment
```

El backend expone además `GET /health` para verificar disponibilidad de la API.

## Modelo de datos (`Payment`)

```ts
interface Payment {
    _id: string;
    name: string; // requerido
    total: number; // requerido, numérico
    settled: boolean; // default: false — indica si el pago ya se saldó
    img: string; // default: "" — URL de la imagen del comprobante (Cloudinary)
    createdAt: string; // timestamps automáticos (Mongoose)
    updatedAt: string;
}
```

Notas:

- `versionKey` está desactivado (no hay `__v`).
- No hay relación con `guests`/`invites` en el modelo actual — `Payment` es independiente.

## Endpoints

### 1. Crear pago — `POST /api/payment`

**Body (JSON):**

```json
{
    "name": "string (requerido)",
    "total": "number (requerido)"
}
```

`settled` e `img` se pueden enviar también en el body al crear (el controller hace
`new Payment(req.body)`), pero **la validación de ruta solo exige `name` y `total`**.

**Respuestas:**

- `201`
    ```json
    {
        "code": 201,
        "message": "Invitación creada correctamente",
        "data": {/* Payment */}
    }
    ```
- `400` — validación fallida (name vacío o total no numérico):
    ```json
    {
        "code": 400,
        "errors": [/* express-validator errors */]
    }
    ```
    o si falta name/total desde el controller:
    ```json
    { "code": 400, "message": "Nombre y total son requeridos" }
    ```
- `500` — error de servidor:
    ```json
    { "code": 500, "message": "Error al crear pago", "error": "..." }
    ```

> Nota: el mensaje de éxito dice "Invitación creada correctamente" (copy heredado, probablemente
> un descuido al copiar del módulo de invites). Vale la pena corregirlo en el front o pedir que
> se corrija en back.

### 2. Actualizar pago — `PATCH /api/payment/:id`

`:id` debe ser un Mongo ObjectId válido.

**Body (JSON)** — al menos uno de los dos campos:

```json
{
    "settled": true,
    "img": "https://res.cloudinary.com/..."
}
```

**Respuestas:**

- `200`
    ```json
    {
        "code": 200,
        "message": "Pago actualizado correctamente",
        "data": {/* Payment actualizado */}
    }
    ```
- `400` — id inválido, o ni `settled` ni `img` enviados:
    ```json
    {
        "code": 400,
        "message": "Se requiere al menos un campo para actualizar (settled o img)"
    }
    ```
- `404`
    ```json
    { "code": 404, "message": "Pago no encontrado" }
    ```
- `500`
    ```json
    { "code": 500, "message": "Error al actualizar pago", "error": "..." }
    ```

### 3. Obtener un pago — `GET /api/payment/:id`

`:id` debe ser un Mongo ObjectId válido. Pensado para prellenar el formulario cuando el usuario
"clona" un pago existente.

**Respuestas:**

- `200`
    ```json
    {
        "code": 200,
        "message": "Pago obtenido correctamente",
        "data": {/* Payment */}
    }
    ```
- `400` — id inválido:
    ```json
    {
        "code": 400,
        "errors": [/* express-validator errors */]
    }
    ```
- `404`
    ```json
    { "code": 404, "message": "Pago no encontrado" }
    ```
- `500`
    ```json
    { "code": 500, "message": "Error al obtener pago", "error": "..." }
    ```

### 4. Listar pagos — `GET /api/payment`

Sin parámetros de query, sin paginación ni filtros — devuelve **todos** los pagos.

**Respuesta `200`:**

```json
{
    "code": 200,
    "message": "Invitaciones obtenidas correctamente",
    "data": [/* Payment[] */]
}
```

(mismo copy heredado "Invitaciones" en vez de "Pagos")

`500`:

```json
{ "code": 500, "message": "Error al obtener invitaciones", "error": "..." }
```

### 5. Subir imagen de comprobante — `POST /api/payment/upload`

- Content-Type: `multipart/form-data`
- Campo del archivo: **`img`** (nombre exacto requerido por `formidable`)
- No acepta múltiples archivos (`multiples: false`)
- Sube a Cloudinary en la carpeta `payments` con un `public_id` generado vía `uuid()`

**Respuesta `200`:**

```json
{
    "code": 200,
    "message": "Imagen subida correctamente",
    "url": "https://res.cloudinary.com/.../payments/<uuid>.jpg"
}
```

**Errores `400`:**

- `{ "code": 400, "message": "Error al procesar la imagen" }` — error de formidable parseando el form
- `{ "code": 400, "message": "No se recibió ninguna imagen" }` — no llegó el campo `img`
- `{ "code": 400, "message": "Error al subir la imagen a Cloudinary" }` — falla al subir

**`500`:**

```json
{ "code": 500, "message": "Error de servidor", "error": "..." }
```

> Este endpoint **no** actualiza el `Payment` automáticamente — solo sube el archivo y devuelve
> la `url`. El flujo esperado en el front es:
>
> 1. `POST /api/payment/upload` con el archivo → obtener `url`.
> 2. `PATCH /api/payment/:id` con `{ "img": url }` para asociarla al pago.

## Flujo de uso sugerido para el front

1. **Listado de pagos** (`GET /api/payment`): tabla/lista con `name`, `total`, `settled` (badge o switch), thumbnail de `img` si existe.
2. **Crear pago** (`POST /api/payment`): formulario con `name` (texto) y `total` (número).
3. **Marcar como saldado** (`PATCH /api/payment/:id` con `{ settled: true/false }`): toggle/switch en la lista o detalle.
4. **Subir comprobante**:
    - Input de archivo → `POST /api/payment/upload` (form-data, campo `img`).
    - Con la `url` devuelta, disparar `PATCH /api/payment/:id` con `{ img: url }`.
    - Mostrar preview de la imagen subida.
5. **Clonar pago**: `GET /api/payment/:id` para traer los datos del pago original y prellenar el formulario de creación (el usuario ajusta `name`/`total` y crea uno nuevo con `POST /api/payment`).

## Validaciones a replicar en el front

| Campo                        | Regla                                   |
| ---------------------------- | --------------------------------------- |
| `name` (crear)               | requerido, no vacío                     |
| `total` (crear)              | requerido, numérico                     |
| `id` (actualizar)            | debe ser Mongo ObjectId válido          |
| `settled` (actualizar)       | opcional, booleano                      |
| `img` (actualizar)           | opcional, string                        |
| al menos un campo en `PATCH` | `settled` o `img` deben venir presentes |

## Consideraciones adicionales

- No hay endpoint de **borrado** (`DELETE`) en este módulo — solo create, update parcial, obtener por id, listar y subir imagen. Si el front anterior tenía borrado, no hay soporte actual en el backend para replicarlo sin agregar una ruta nueva.
- No hay autenticación/autorización aplicada a estas rutas (`paymentRouter` no usa middleware de auth).
- CORS está configurado globalmente en `src/config/cors.ts` — revisar que el dominio del nuevo front esté permitido ahí.
- El formato de respuesta es consistente en todo el módulo: `{ code, message, data? / errors? / error? / url? }`.
