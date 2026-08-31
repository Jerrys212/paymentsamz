"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ReceiptPreviewDialogProps {
    src: string;
    alt: string;
    trigger: ReactNode;
}

export function ReceiptPreviewDialog({ src, alt, trigger }: ReceiptPreviewDialogProps) {
    return (
        <Dialog>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>{trigger}</DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Ver comprobante</TooltipContent>
            </Tooltip>
            <DialogContent className="max-w-2xl gap-0 p-2 sm:max-w-2xl">
                <DialogTitle className="sr-only">{alt}</DialogTitle>
                <Image src={src} alt={alt} width={900} height={900} className="max-h-[80vh] w-full rounded-md object-contain" />
            </DialogContent>
        </Dialog>
    );
}
