const { trace, context, SpanStatusCode } = require('@opentelemetry/api');

const createTracer = (tracerName) => {
    // return trace.getTracer(tracerName);

    return (req, res, next) => {
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

const createSpan = (spanName, parentSpan) => {
    // Get the tracer instance from the active context
    const tracer = trace.getTracer(context.active()?.tracerName);

    if(parentSpan) {
        // Start another span. If already started a span, so that'll  
        // be the parent span, and this will be a child span.
        const ctx = trace.setSpan(context.active(), parentSpan);
        return tracer.startSpan(spanName, undefined, ctx);
    }

    return tracer.startSpan(spanName);
}

const tracingError = (span, message) => {
    span.setStatus({code: SpanStatusCode.ERROR, message: message});
    span.end();
}

module.exports = { createTracer, getActiveParentSpan, createSpan, tracingError };
