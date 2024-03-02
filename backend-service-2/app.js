require('dotenv').config();
require('express-async-errors');
const cors = require('cors');
const axios = require('axios');

// Swagger
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const path = require('path');

// extra security packages
const helmet = require('helmet');
const xss = require('xss-clean');

// tracer
const { trace, context, propagation } = require('@opentelemetry/api');
const tracer = require('./tracer');
tracer('backend-service-2');

const express = require('express');
const app = express();

// connect db
const connectDB = require('./db/connect');
const authenticateUser = require('./middleware/authentication');

const { getPosts } = require('./controllers/jobs');

app.get('/posts', getPosts);

// routers
const authRouter = require('./routes/auth');
const jobRouter = require('./routes/jobs');

// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

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

// app.use((req,res,next) => {
//     const tracer = trace.getTracer('express-tracer');
//     const span = tracer.startSpan('job-service');

//     span.setAttribute('service', 'job-service');
    
//     context.with(trace.setSpan(context.active(), span), () => {
//         next();
//     });
// });

// app.get('/get-user', async (req, res) => {
//     const parentSpan = trace.getSpan(context.active());

//     try{
//         const user = {
//             id: 1,
//             name: 'user',
//             email: 'user@mail.com'
//         };

//         if(parentSpan) {
//             parentSpan.setAttributes(user);
//         }

//         const validateResponse = await context.with(
//             trace.setSpan(context.active(), parentSpan),
//             async() => {
//                 const carrier = {};
//                 propagation.inject(context.active(), carrier); 
//                 parentSpan.end();
//                 return axios.get('http://localhost:5000/validate-user', {
//                     headers: carrier
//                 });
//             }
//         );

        

//         console.log('job-service', validateResponse.data); 

//         // res.send(user).json();
//         res.json(user);
//     } catch(e) {
//         console.log("Error:", e.message)
//         if(parentSpan) {
//             // console.log(parentSpan)
//             parentSpan.recordException(e)
//         }
//         return;
//     }
// });

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', authenticateUser, jobRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5009;

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
