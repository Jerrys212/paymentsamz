"use client";

import { useMemo, useState } from "react";

interface UsePaginationOptions {
    pageSize?: number;
}

export function usePagination<T>(items: T[], { pageSize = 10 }: UsePaginationOptions = {}) {
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const currentPage = Math.min(page, totalPages);

    const pageItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, currentPage, pageSize]);

    return {
        page: currentPage,
        setPage,
        totalPages,
        pageItems,
        hasPrevious: currentPage > 1,
        hasNext: currentPage < totalPages,
    };
}
