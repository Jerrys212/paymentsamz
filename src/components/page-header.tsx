import type { ReactNode } from "react";

interface PageHeaderProps {
    eyebrow: ReactNode;
    action?: ReactNode;
    /** Accent used for the eyebrow text and the divider below the header. */
    variant?: "default" | "error";
}

/**
 * Shared "Control de pagos" title block + accent divider used by the home
 * page, its loading skeleton, and its error boundary so all three states
 * render an identical header shell.
 */
export function PageHeader({ eyebrow, action, variant = "default" }: PageHeaderProps) {
    const accentColor = variant === "error" ? "var(--color-accent-2-700)" : "var(--color-accent-700)";

    return (
        <>
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs tracking-[0.14em] uppercase" style={{ color: accentColor }}>
                        {eyebrow}
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Control de pagos</h1>
                </div>
                {action}
            </header>
            {variant === "error" ? (
                <div className="h-[3px]" style={{ background: accentColor }} />
            ) : (
                <div className="h-[3px] bg-foreground" />
            )}
        </>
    );
}
