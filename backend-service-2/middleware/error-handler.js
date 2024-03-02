const { StatusCodes } = require('http-status-codes');
// const { trace, context } = require('@opentelemetry/api');

const errorHandlerMiddleware = (err, req, res, next) => {
    console.log(err);

    let customError = {
        // set default
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        msg: err.message || 'Something went wrong try again later',
    };

    // if (err instanceof CustomAPIError) {
    //   return res.status(err.statusCode).json({ msg: err.message })
    // }

    if (err.name === 'ValidationError') {
        customError.msg = Object.values(err.errors).map((item) => item.message).join(',');
        customError.statusCode = 400;
    }

    if (err.code && err.code === 11000) {
        customError.msg = `Duplicate value entered for ${Object.keys(err.keyValue)} field, please choose another value`;
        customError.statusCode = 400
    }

    if (err.name === 'CastError') {
        customError.msg = `No item found with id : ${err.value}`;
        customError.statusCode = 404;
    }

    // const activeSpan = trace.getSpan(context.active());
    // console.log(activeSpan, customError);

    return res.status(customError.statusCode).json({ msg: customError.msg });
}

module.exports = errorHandlerMiddleware;
