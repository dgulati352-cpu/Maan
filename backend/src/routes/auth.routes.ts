import { Router } from "express";
import { authenticateUser, requireAuth } from "../auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required." });
      return;
    }

    const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const result = await authenticateUser(email, password, clientIp);

    if (!result.success || !result.token) {
      res.status(401).json({ success: false, error: result.error || "Authentication failed." });
      return;
    }

    res.cookie("session_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600 * 1000,
      path: "/",
    });

    res.json({
      success: true,
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    console.error("[Auth API Login Error]", error);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.userSession,
  });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("session_token", { path: "/" });
  res.json({ success: true, message: "Logged out successfully." });
});

