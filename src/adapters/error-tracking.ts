export const ErrorTracker = {
    captureException(error: unknown, context?: Record<string, unknown>) {
        console.error("[ErrorTracker]", error, context ?? {});
    },
};
