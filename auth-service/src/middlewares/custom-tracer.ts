import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// Define a custom context key
const TRACER_NAME_KEY = Symbol();

const createTracer = (tracerName: string) => {
    return (req: any, res: any, next: any) => {
        const tracer = trace.getTracer(tracerName);
        const span = tracer.startSpan(`${tracerName}`);
        
        // Set the tracer name in the custom context
        context.with(
            context.active().setValue(TRACER_NAME_KEY, span),
            () => {
                next();
            }
        );
    }
}

const getActiveParentSpan = () => {
    return trace.getSpan(context.active());
}

const createSpan = (spanName: string, parentSpan?: any) => {
    const activeContext = context.active();
    const tracerName = (activeContext.getValue(TRACER_NAME_KEY) as string) || 'default';
    const tracer = trace.getTracer(tracerName);

    if(parentSpan) {
        const ctx = trace.setSpan(context.active(), parentSpan);
        return tracer.startSpan(spanName, undefined, ctx);
    }

    return tracer.startSpan(spanName);
}

const tracingError = (span: any, message: string) => {
    span.setStatus({code: SpanStatusCode.ERROR, message: message});
    span.end();
}

export { createTracer, getActiveParentSpan, createSpan, tracingError };
