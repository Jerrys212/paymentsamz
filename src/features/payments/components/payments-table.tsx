"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ListChecksIcon } from "lucide-react";
import { toast } from "sonner";

import { settlePayments } from "@/actions/payments/settle-payments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SettledSwitch } from "@/features/payments/components/settled-switch";
import { PaymentRowActions } from "@/features/payments/components/payment-row-actions";
import { ReceiptPreviewDialog } from "@/features/payments/components/receipt-preview-dialog";
import type { Payment } from "@/data/payments/types";
import { formatCurrency, formatDate } from "@/lib/formats";
import { usePagination } from "@/hooks/use-pagination";

const PAGE_SIZE = 10;

type PageItem = number | "ellipsis";

function getPageItems(page: number, totalPages: number): PageItem[] {
    const items: PageItem[] = [1];
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);

    if (left > 2) items.push("ellipsis");
    for (let i = left; i <= right; i++) items.push(i);
    if (right < totalPages - 1) items.push("ellipsis");
    if (totalPages > 1) items.push(totalPages);

    return items;
}

function ReceiptThumbnail({ payment }: { payment: Payment }) {
    if (!payment.img) {
        return <span className="text-muted-foreground">—</span>;
    }

    return (
        <ReceiptPreviewDialog
            src={payment.img}
            alt={`Comprobante de ${payment.name}`}
            trigger={
                <button
                    type="button"
                    className="cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    aria-label={`Ver comprobante de ${payment.name}`}
                >
                    <Image src={payment.img} alt="" width={38} height={27} className="halftone size-10 rounded-sm object-cover" />
                </button>
            }
        />
    );
}

function SettledStatus({ payment }: { payment: Payment }) {
    return (
        <div className="flex items-center gap-2">
            <SettledSwitch paymentId={payment._id} settled={payment.settled} />
            <span className={payment.settled ? "text-sm" : "text-sm text-muted-foreground"}>{payment.settled ? "Saldado" : "Pendiente"}</span>
        </div>
    );
}

interface PaymentsTableProps {
    payments: Payment[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
    const { page, setPage, totalPages, pageItems, hasPrevious, hasNext } = usePagination(payments, { pageSize: PAGE_SIZE });
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    const pendingPayments = payments.filter((payment) => !payment.settled);
    const selectedPayments = pendingPayments.filter((payment) => selectedIds.has(payment._id));
    const selectedTotal = selectedPayments.reduce((sum, payment) => sum + payment.total, 0);

    function toggleSelectionMode() {
        setSelectionMode((current) => !current);
        setSelectedIds(new Set());
    }

    function toggleSelected(id: string) {
        setSelectedIds((current) => {
            const next = new Set(current);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function handleBulkSettle() {
        const ids = selectedPayments.map((payment) => payment._id);
        startTransition(async () => {
            const result = await settlePayments(ids);
            if (!result.success) {
                toast.error(result.message);
                return;
            }
            toast.success(
                result.settledCount === result.requestedCount
                    ? `Se saldaron ${result.settledCount} pago${result.settledCount === 1 ? "" : "s"}.`
                    : `Se saldaron ${result.settledCount} de ${result.requestedCount} pagos seleccionados.`,
            );
            setSelectedIds(new Set());
            setSelectionMode(false);
        });
    }

    if (payments.length === 0) {
        return <p className="py-8 text-sm text-muted-foreground">Todavía no hay pagos registrados.</p>;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={toggleSelectionMode} disabled={!selectionMode && pendingPayments.length === 0}>
                    <ListChecksIcon />
                    {selectionMode ? "Cancelar selección" : "Saldar varios"}
                </Button>
            </div>

            {/* Mobile: cards — a table is unusable on a narrow screen */}
            <div className="flex flex-col gap-3 md:hidden">
                {pageItems.map((payment) => (
                    <Card key={payment._id} className="gap-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                {selectionMode && !payment.settled && (
                                    <Checkbox
                                        className="mt-1"
                                        checked={selectedIds.has(payment._id)}
                                        onCheckedChange={() => toggleSelected(payment._id)}
                                        aria-label={`Seleccionar ${payment.name} para saldar`}
                                    />
                                )}
                                <div>
                                    <p className="font-heading text-base font-semibold">{payment.name}</p>
                                    <p className="text-xs text-muted-foreground">Creado {formatDate(payment.createdAt)}</p>
                                </div>
                            </div>
                            <p className="font-heading text-base font-semibold tabular-nums">{formatCurrency(payment.total)}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <SettledStatus payment={payment} />
                            <ReceiptThumbnail payment={payment} />
                        </div>
                        <div className="flex justify-end border-t border-border pt-3">
                            <PaymentRowActions payment={payment} />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Desktop: table */}
            <Table className="hidden md:table">
                <TableHeader>
                    <TableRow>
                        {selectionMode && <TableHead className="w-10" />}
                        <TableHead className="w-[44%]">Pago</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Comprobante</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pageItems.map((payment) => (
                        <TableRow key={payment._id}>
                            {selectionMode && (
                                <TableCell>
                                    {!payment.settled && (
                                        <Checkbox
                                            checked={selectedIds.has(payment._id)}
                                            onCheckedChange={() => toggleSelected(payment._id)}
                                            aria-label={`Seleccionar ${payment.name} para saldar`}
                                        />
                                    )}
                                </TableCell>
                            )}
                            <TableCell className="whitespace-normal">
                                <span className="block font-heading text-base font-semibold">{payment.name}</span>
                                <span className="block text-xs text-muted-foreground">Creado {formatDate(payment.createdAt)}</span>
                            </TableCell>
                            <TableCell className="text-right text-base tabular-nums">{formatCurrency(payment.total)}</TableCell>
                            <TableCell>
                                <SettledStatus payment={payment} />
                            </TableCell>
                            <TableCell>
                                <ReceiptThumbnail payment={payment} />
                            </TableCell>
                            <TableCell className="text-right">
                                <PaymentRowActions payment={payment} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {selectionMode && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-3">
                    <p className="text-sm">
                        <strong>{selectedPayments.length}</strong> seleccionado{selectedPayments.length === 1 ? "" : "s"} ·{" "}
                        <span className="font-heading font-semibold tabular-nums">{formatCurrency(selectedTotal)}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())} disabled={selectedPayments.length === 0}>
                            Limpiar
                        </Button>
                        <Button size="sm" onClick={handleBulkSettle} disabled={selectedPayments.length === 0 || isPending}>
                            Saldar seleccionados
                        </Button>
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                {payments.length} {payments.length === 1 ? "pago" : "pagos"} · montos en pesos mexicanos (MXN)
            </p>

            {totalPages > 1 && (
                <Pagination className="justify-start">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                text="Anterior"
                                aria-label="Ir a la página anterior"
                                aria-disabled={!hasPrevious}
                                className={!hasPrevious ? "pointer-events-none opacity-50" : undefined}
                                onClick={(event) => {
                                    event.preventDefault();
                                    if (hasPrevious) setPage(page - 1);
                                }}
                            />
                        </PaginationItem>
                        {getPageItems(page, totalPages).map((item, index) =>
                            item === "ellipsis" ? (
                                <PaginationItem key={`ellipsis-${index}`}>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            ) : (
                                <PaginationItem key={item}>
                                    <PaginationLink
                                        href="#"
                                        isActive={item === page}
                                        aria-label={`Ir a la página ${item}`}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setPage(item);
                                        }}
                                    >
                                        {item}
                                    </PaginationLink>
                                </PaginationItem>
                            ),
                        )}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                text="Siguiente"
                                aria-label="Ir a la página siguiente"
                                aria-disabled={!hasNext}
                                className={!hasNext ? "pointer-events-none opacity-50" : undefined}
                                onClick={(event) => {
                                    event.preventDefault();
                                    if (hasNext) setPage(page + 1);
                                }}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
