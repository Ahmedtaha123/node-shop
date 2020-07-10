module.exports.errorHandlers = (err, next) => {
    const error = new Error(err);
    err.httpStatusCode = 500;
    return next(error);
};