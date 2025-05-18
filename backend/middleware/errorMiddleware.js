    export const errorLogger = (err, req, res, next) => {
    console.error('Error:', {
        path: req.path,
        method: req.method,
        body: req.body,
        error: err.message
    });
    next(err);
};

