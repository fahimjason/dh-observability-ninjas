const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
// const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { MongooseInstrumentation } = require('@opentelemetry/instrumentation-mongoose');
const { MongoDBInstrumentation } = require('@opentelemetry/instrumentation-mongodb');
const { RedisInstrumentation } = require('@opentelemetry/instrumentation-redis');

function tracer(serviceName) {

    const traceExporter = new OTLPTraceExporter({
        url: process.env.JAEGER_URI,
    });

    const sdk = new NodeSDK({
        traceExporter,
        serviceName: serviceName,
        instrumentations: [
            new ExpressInstrumentation(),
            new MongooseInstrumentation(),
            new MongoDBInstrumentation({
                enhancedDatabaseReporting: true
            }),
            new RedisInstrumentation(),
        ],
    });


    sdk.start();

    // return meter;
}

module.exports = tracer;
