require('dotenv').config();
require('express-async-errors');
const cors = require('cors');

// Swagger
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const path = require('path');

// extra security packages
const helmet = require('helmet');
const xss = require('xss-clean');

// tracer

const tracer = require('./tracer');
tracer('auth-service');

const express = require('express');
const app = express();

// connect db
const connectDB = require('./db/connect');
const authenticateUser = require('./middleware/authentication');

// routers
const authRouter = require('./routes/auth');
const jobRouter = require('./routes/jobs');

// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');
const { createTracer } = require('./middleware/custom-tracer');
const { getAllPosts } = require('./controllers/jobs');

app.set('trust proxy', 1);

// const calls = meter.createHistogram('http-calls');

// app.use((req,res,next)=>{
//     const startTime = Date.now();
//     req.on('end',()=>{
//         const endTime = Date.now();
//         calls.record(endTime-startTime,{
//             route: req.route?.path,
//             status: res.statusCode,
//             method: req.method
//         })
//     })
//     next();
// });

app.use(express.static(path.resolve(__dirname, './client/build')));
app.use(express.json());
app.use(helmet());

app.use(xss());

// enable CORS
app.use(cors());

app.get('/', (req, res) => {
    res.send('<h1>Jobster API</h1><a href="/api-docs">Documentation</a>');
});
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// app.get('/validate-user', async (req, res) => {
//     const ctx = propagation.extract(context.active(), req.headers);

//     const tracer = trace.getTracer('init-tracer');
//     // console.log('auth-service', req.headers);
//     // console.log('Extract span from context', trace.getSpan(ctx).spanContext());

//     const span = tracer.startSpan(
//         'validate-user',
//         {
//             attributes: {'http.url': req.url}
//         },
//         ctx
//     );
//     res.json({success: true});
//     span.end();
// });

app.get('/get-posts', createTracer('/get-posts'), getAllPosts);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', jobRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};

start();
