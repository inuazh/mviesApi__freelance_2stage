const token = require("jsonwebtoken");
require("dotenv").config();
const UnauthorizedError = require("../utils/errors/UnauthorizedError");

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports = (req, res, next) => {
  const { jwt } = req.cookies;

  if (!jwt) {
    return next(new UnauthorizedError("Необходима авторизация"));
  }

  let payload;

  try {
    payload = token.verify(
      jwt,
      NODE_ENV === "production" ? JWT_SECRET : "super-strong-secret"
    );
  } catch (err) {
    return next(new UnauthorizedError("Необходима авторизация"));
  }

  req.user = payload;

  return next();
};
