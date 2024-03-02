import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const createTracer = (tracerName: string) => {
    return (req: any, res: any, next: any) => {
        const tracer = trace.getTracer(tracerName);
        const span = tracer.startSpan(`${tracerName}`);
        
        context.with(trace.setSpan(context.active(), span), () => {
            next();
        });
    }
}

const getActiveParentSpan = () => {
    return trace.getSpan(context.active());
}

const createSpan = (spanName: string, parentSpan?: any) => {
    const activeContext = context.active();
    const tracer = trace.getTracer(activeContext?.tracerName!);

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
