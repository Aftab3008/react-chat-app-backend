import { compare, genSalt, hash } from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "./email.controller.js";

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

export const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send("Email and password are required");
    }
    const user = await User.create({ email, password });
    await user.save();
    const verificationToken = await createVerificationToken(user.id);
    sendVerificationEmail(email, verificationToken);
    res.status(201).send({
      message:
        "Registration successful. Please check your email for verification.",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and password are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found");
    }
    const auth = await compare(password, user.password);

    if (!auth) {
      return res.status(401).send("Invalid password");
    }

    if (!user.isVerified) {
      const verificationToken = await createVerificationToken(user.id);
      sendVerificationEmail(email, verificationToken);
      return res
        .status(202)
        .send({
          message: "Please verify your email",
          user: { id: user.id, email: user.email },
        });
    }

    const token = createToken(email, user.id);
    res.cookie("jwt", token, {
      maxAge: maxAge,
      secure: true,
      sameSite: "None",
    });

    return res.status(200).send({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
      },
    });
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};

export const checkAuth = async (req, res, next) => {
  try {
    const token = req.query.token || req.cookies.jwt;

    if (!token) {
      return res.status(401).send("Unauthorized");
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).send("Unauthorized");
      }

      const user = await User.findById(decoded.userId);

      return res.status(200).send({
        user: {
          id: user.id,
          email: user.email,
          profileSetup: user.profileSetup,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          color: user.color,
        },
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

const createVerificationToken = async (userId) => {
  const verificationToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await User.updateOne(
    { _id: userId },
    { verificationToken, verificationTokenExpires: expiresAt }
  );

  return verificationToken;
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).send("Invalid token");
    }

    const user = await User.findOne({
      verificationToken: token,
    });

    if (!user) {
      return res.status(400).send("User not found");
    }

    const now = new Date();
    if (now > user.verificationTokenExpires) {
      const verificationToken = await createVerificationToken(user.id);
      sendVerificationEmail(user.email, verificationToken);
      return res.status(202).send("Verification email sent");
    }
    user.isVerified = true;
    await user.save();
    const cookie = createToken(user.email, user.id);
    res.cookie("jwt", cookie, {
      maxAge: maxAge,
      secure: true,
      sameSite: "None",
    });
    return res.status(200).send({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const getUserInfo = async (req, res, next) => {
  try {
    const userData = await User.findById(req.userId);
    if (!userData) {
      return res.status(404).send("User not found");
    }
    return res.status(200).json({
      user: {
        id: userData.id,
        email: userData.email,
        profileSetup: userData.profileSetup,
        firstName: userData.firstName,
        lastName: userData.lastName,
        image: userData.image,
        color: userData.color,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const isUserVerified = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.query.email });
    if (!user) {
      return res.status(404).send("User not found");
    }
    return res.status(200).send(user.isVerified);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};
