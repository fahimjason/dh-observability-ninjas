import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
// import { MongooseInstrumentation } from '@opentelemetry/instrumentation-mongoose';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';


function tracer(serviceName: string): void {
    const traceExporter = new OTLPTraceExporter({
        url: process.env.JAEGER_URI! as string, // Assuming JAEGER_URI is of type string
    });

    const sdk = new NodeSDK({
        traceExporter,
        serviceName: serviceName,
        instrumentations: [
            new ExpressInstrumentation(),
            // new MongooseInstrumentation(),
            new PgInstrumentation({
                enhancedDatabaseReporting: true
            }),
            new MongoDBInstrumentation({
                enhancedDatabaseReporting: true
            }),
        ],
    });

    sdk.start();
}

export = tracer;