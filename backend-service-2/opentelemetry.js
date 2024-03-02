const { NodeTracerProvider } = require('@opentelemetry/node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
// const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { BatchSpanProcessor } = require('@opentelemetry/tracing');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { MongooseInstrumentation } = require('@opentelemetry/instrumentation-mongoose');
// const { RedisInstrumentation } = require('@opentelemetry/instrumentation-redis');

function configureOpenTelemetry(serviceName) {
    // Create a tracer provider and register the Express instrumentation
    const provider = new NodeTracerProvider({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
            // Add other resource attributes as needed
            }),
        });
    provider.register();

    // Configure and register Jaeger exporter
    const traceExporter = new OTLPTraceExporter({
        url: 'http://jaeger:4318/v1/traces',
    });

    // Use BatchSpanProcessor
    const spanProcessor = new BatchSpanProcessor(traceExporter);
    provider.addSpanProcessor(spanProcessor);

    const expressInstrumentation = new ExpressInstrumentation(
        {
            requestHook: function (span, info) {
                if (info.layerType === ExpressLayerType.REQUEST_HANDLER) {
                    span.setAttribute(SemanticAttributes.HTTP_METHOD, info.request.method);
                    span.setAttribute(SemanticAttributes.HTTP_URL, info.request.baseUrl);
                }
            },
        }
    );

    // Register the Express instrumentation
    registerInstrumentations({
        tracerProvider: provider,
        instrumentations: [
            expressInstrumentation,
            new MongooseInstrumentation()
            // new ExpressInstrumentation(),
            // new RedisInstrumentation(),
        ],
        
    });

    return provider;
}

module.exports = configureOpenTelemetry;
