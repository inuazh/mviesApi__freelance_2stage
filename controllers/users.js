const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
require("dotenv").config();
const NotFoundError = require("../utils/errors/NotFoundError");
const BadRequestError = require("../utils/errors/BadRequestError");
const mongoose = require("mongoose");
const ConflictError = require("../utils/errors/ConflictError");

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports.aboutUser = (req, res, next) => {
  const { _id } = req.user;
  User.findById(_id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError("Нет пользователя с таким id");
      }
      res.status(200).send({ user });
    })
    .catch(next);
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === "production" ? JWT_SECRET : "super-strong-secret",
        { expiresIn: "7d" }
      );
      res
        .status(200)
        .cookie("jwt", token, {
          maxAge: 3600000 * 24 * 7,
          httpOnly: true,
          sameSite: "none",
        })
        .send({ email });
    })
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  const { name, email, password } = req.body;

  bcrypt
    .hash(password, 10)
    .then((hash) =>
      User.create({
        name,
        email,
        password: hash,
      })
    )
    .then((user) => {
      res.status(200).send({ data: user });
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.ValidationError) {
        const message = Object.values(err.errors)
          .map((error) => error.message)
          .join("; ");
        next(new BadRequestError(message));
      } else if (err.code === 11000) {
        next(new ConflictError("Email уже зарегистрирован"));
      } else {
        next(err);
      }
    });
};

module.exports.updateUserInfo = (req, res, next) => {
  const { name, email } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    {
      new: true,
      runValidators: true,
    }
  )
    .then((user) => {
      if (!user) {
        throw new NotFoundError("Пользователь не найден");
      }
      res.send({ user });
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.ValidationError) {
        const message = Object.values(err.errors)
          .map((error) => error.message)
          .join("; ");
        next(new BadRequestError(message));
      } else {
        next(err);
      }
    });
};
