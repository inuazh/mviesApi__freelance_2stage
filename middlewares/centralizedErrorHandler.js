module.exports = (err, req, res, next) => {
  const { message } = err;
  const statusCode = err.statusCode || 500;

  res.status(statusCode).send({
    message: statusCode === 500 ? "Попробуйте позже, на сервере произошла ошибка" : message,
  });
  return next();
};
