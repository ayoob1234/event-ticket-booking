
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db");
const { sendEmail } = require("../services/emailService");

// REGISTER USER
const registerUser = async (req, res) => {
  
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Verify your Evently account",
        text:
          `Hi ${name.trim()},\n\n` +
          `Please verify your email using this link:\n${verificationLink}\n\n` +
          "This link expires in 30 minutes.\n\nEvently",
        html: `
          <h2>Welcome to Evently!</h2>
          <p>Hi ${name.trim()},</p>
          <p>Please verify your email address to activate your account.</p>
          <p><a href="${verificationLink}">Verify my email</a></p>
          <p>This link expires in 30 minutes.</p>
        `,
      });
    } catch (emailError) {
      console.error("Verification email failed:", emailError.message);

      return res.status(503).json({
        message:
          "Your account was created but the verification email could not be sent. Please try again later.",
        user: result.rows[0],
      });
    }

    return res.status(201).json({
      message:
        "Registration started. Check your email and verify your account within 30 minutes.",
      user: result.rows[0],
    });

};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash, role,
              mobile_number, email_verified
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile_number: user.mobile_number,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// VERIFY EMAIL

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    // Debug safely: never print the actual token
    console.log("Token received:", Boolean(token));
    console.log("Token type:", typeof token);
    console.log(
      "Token length:",
      typeof token === "string" ? token.length : 0
    );

    if (
      !token ||
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      return res.status(400).json({
        message: "Verification token is invalid or missing",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE verification_token_hash = $1
         AND verification_token_expires_at > CURRENT_TIMESTAMP
         AND email_verified = FALSE`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Verification link is invalid, expired, or already used",
      });
    }

    const user = result.rows[0];

    const updateResult = await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           verification_token_hash = NULL,
           verification_token_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND email_verified = FALSE
         AND verification_token_hash = $2
         AND verification_token_expires_at > CURRENT_TIMESTAMP
       RETURNING id`,
      [user.id, tokenHash]
    );

    if (updateResult.rows.length === 0) {
      return res.status(400).json({
        message: "Verification link is invalid, expired, or already used",
      });
    }

    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to Evently!",
        text:
          `Hi ${user.name},\n\n` +
          "Your email has been verified successfully. You can now log in to Evently.\n\n" +
          "Evently",
        html: `
          <h2>Welcome to Evently, ${user.name}!</h2>
          <p>Your email has been verified successfully.</p>
          <p>Your account is now active. You can log in to Evently.</p>
        `,
      });
    } catch (emailError) {
      console.error("Welcome email error:", emailError.message);
    }

    return res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error.message);

    return res.status(500).json({
      message: "Email verification failed. Please try again.",
    });
  }
};

//resendVerificationEmail
const resendVerificationEmail = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, email_verified
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET verification_token_hash = $1,
           verification_token_expires_at = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [tokenHash, expiresAt, user.id]
    );

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      return res.status(500).json({
        message: "Frontend URL is not configured",
      });
    }

    const verificationLink =
      `${frontendUrl}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your Evently account",
      text:
        `Hi ${user.name},\n\n` +
        `Please verify your email using this link:\n${verificationLink}\n\n` +
        "This link expires in 30 minutes.\n\nEvently",
      html: `
        <h2>Verify your Evently account</h2>
        <p>Hi ${user.name},</p>
        <p>Click below to verify your email address.</p>
        <p><a href="${verificationLink}">Verify my email</a></p>
        <p>This link expires in 30 minutes.</p>
      `,
    });

    return res.status(200).json({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error.message);

    return res.status(500).json({
      message: "Could not send verification email. Please try again.",
    });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  const genericMessage =
    "If an account exists with this email, a password reset link will be sent.";

  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE email = $1 AND email_verified = TRUE`,
      [email]
    );

    // Use the same response for unknown and unverified accounts.
    if (result.rows.length === 0) {
      return res.status(200).json({ message: genericMessage });
    }

    const user = result.rows[0];

    if (!process.env.FRONTEND_URL) {
      throw new Error("FRONTEND_URL is not configured");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET password_reset_token_hash = $1,
           password_reset_token_expires_at = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [resetTokenHash, expiresAt, user.id]
    );

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Evently password",
        text:
          `Hi ${user.name},\n\n` +
          `Use this link to reset your password:\n${resetLink}\n\n` +
          "This link expires in 15 minutes. If you did not request this, ignore this email.\n\nEvently",
        html: `
          <h2>Reset your Evently password</h2>
          <p>Hi ${user.name},</p>
          <p>Click below to choose a new password. This link expires in 15 minutes.</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
      });
    } catch (emailError) {
      await pool.query(
        `UPDATE users
         SET password_reset_token_hash = NULL,
             password_reset_token_expires_at = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND password_reset_token_hash = $2`,
        [user.id, resetTokenHash]
      );

      throw emailError;
    }

    return res.status(200).json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      message: "Could not process the request right now. Please try again.",
    });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      return res.status(400).json({
        message: "Reset token is invalid or missing",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1,
           password_reset_token_hash = NULL,
           password_reset_token_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE password_reset_token_hash = $2
         AND password_reset_token_expires_at > CURRENT_TIMESTAMP
         AND email_verified = TRUE
       RETURNING id`,
      [passwordHash, tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Reset link is invalid, expired, or already used",
      });
    }

    return res.status(200).json({
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);

    return res.status(500).json({
      message: "Could not reset password. Please try again.",
    });
  }
};

// GET PROFILE
const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, mobile_number, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const { name, email, mobile_number, password } = req.body;

    const currentResult = await pool.query(
      `SELECT id, name, email, role, mobile_number
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const currentUser = currentResult.rows[0];

    const updatedName =
      name !== undefined ? name.trim() : currentUser.name;

    const updatedEmail =
      email !== undefined
        ? email.trim().toLowerCase()
        : currentUser.email;

    const updatedMobile =
      mobile_number !== undefined
        ? (mobile_number.trim() || null)
        : currentUser.mobile_number;

    if (!updatedName || !updatedEmail) {
      return res.status(400).json({
        message: "Name and email cannot be empty",
      });
    }

    if (
      email !== undefined &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    if (
      mobile_number !== undefined &&
      updatedMobile !== null &&
      !/^[+\d\s()-]{7,20}$/.test(updatedMobile)
    ) {
      return res.status(400).json({
        message: "Please enter a valid mobile number",
      });
    }

    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
          message: "New password must be at least 8 characters long",
        });
      }
    }

    const duplicateEmail = await pool.query(
      `SELECT id
       FROM users
       WHERE email = $1 AND id <> $2`,
      [updatedEmail, req.user.id]
    );

    if (duplicateEmail.rows.length > 0) {
      return res.status(409).json({
        message: "This email is already used by another account",
      });
    }

    let query;
    let values;

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);

      query = `
        UPDATE users
        SET name = $1,
            email = $2,
            mobile_number = $3,
            password_hash = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, name, email, role, mobile_number, created_at, updated_at
      `;

      values = [
        updatedName,
        updatedEmail,
        updatedMobile,
        passwordHash,
        req.user.id,
      ];
    } else {
      query = `
        UPDATE users
        SET name = $1,
            email = $2,
            mobile_number = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, name, email, role, mobile_number, created_at, updated_at
      `;

      values = [
        updatedName,
        updatedEmail,
        updatedMobile,
        req.user.id,
      ];
    }

    const result = await pool.query(query, values);

    return res.status(200).json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Profile update error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "This email is already used by another account",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
};
