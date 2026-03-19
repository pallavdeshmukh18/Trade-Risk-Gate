import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../schemas/user_schema.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const googleClient = new OAuth2Client();

function issueAuthToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            companyId: user.companyId,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
}

function buildAuthResponse(user) {
    return {
        token: issueAuthToken(user),
        name: user.name,
        email: user.email,
        picture: user.avatarUrl || null
    };
}

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function getFrontendCallbackUrl() {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return `${frontendUrl.replace(/\/$/, "")}/auth/callback`;
}

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        if (!user.passwordHash) {
            return res.status(400).json({ error: "This account uses Google sign-in" });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        res.json(buildAuthResponse(user));
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            const errorMessage = existing.passwordHash
                ? "User already exists"
                : "This email is already registered with Google sign-in";

            return res.status(400).json({ error: errorMessage });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email: normalizedEmail,
            passwordHash,
            authProvider: "local",
            role: "TRADER"
        });

        res.json({ message: "User registered", userId: user._id });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

router.get("/google", async (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).send("Google OAuth is not configured");
    }

    const callbackUrl = getFrontendCallbackUrl();
    const escapedClientId = JSON.stringify(process.env.GOOGLE_CLIENT_ID);
    const escapedCallbackUrl = JSON.stringify(callbackUrl);

    return res.type("html").send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Continue with Google</title>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #0e1018;
        color: white;
        font-family: Arial, Helvetica, sans-serif;
      }
      .card {
        width: min(92vw, 420px);
        padding: 32px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        background: rgba(20, 20, 26, 0.96);
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
      }
      #google-button {
        display: inline-flex;
        justify-content: center;
        margin-top: 20px;
      }
      .muted {
        color: rgba(255, 255, 255, 0.64);
        font-size: 14px;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Continue with Google</h1>
      <p class="muted">Choose your Google account to finish signing in to LowkeyLoss.</p>
      <div id="google-button"></div>
      <p class="muted" id="status"></p>
    </div>

    <script>
      const clientId = ${escapedClientId};
      const callbackUrl = ${escapedCallbackUrl};
      const statusNode = document.getElementById("status");

      const redirectWithError = (message) => {
        const url = new URL(callbackUrl);
        url.searchParams.set("error", message);
        window.location.href = url.toString();
      };

      const redirectWithAuth = (payload) => {
        const url = new URL(callbackUrl);
        url.searchParams.set("token", payload.token);
        if (payload.name) url.searchParams.set("name", payload.name);
        if (payload.email) url.searchParams.set("email", payload.email);
        if (payload.picture) url.searchParams.set("picture", payload.picture);
        window.location.href = url.toString();
      };

      const initializeGoogle = () => {
        if (!window.google?.accounts?.id) {
          statusNode.textContent = "Google sign-in is still loading...";
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            if (!credential) {
              redirectWithError("Google sign-in failed");
              return;
            }

            statusNode.textContent = "Completing Google sign-in...";

            try {
              const response = await fetch("/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Google sign-in failed");
              }

              redirectWithAuth(data);
            } catch (error) {
              redirectWithError(error.message || "Google sign-in failed");
            }
          },
        });

        window.google.accounts.id.renderButton(document.getElementById("google-button"), {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 320,
        });
      };

      window.addEventListener("load", initializeGoogle);
    </script>
  </body>
</html>`);
});

router.post("/google", async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: "Google credential is required" });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({ error: "Google OAuth is not configured" });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) {
            return res.status(401).json({ error: "Google account could not be verified" });
        }

        const normalizedEmail = normalizeEmail(payload.email);
        let user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            user = await User.create({
                name: payload.name || normalizedEmail.split("@")[0],
                email: normalizedEmail,
                googleId: payload.sub,
                avatarUrl: payload.picture,
                authProvider: "google",
                role: "TRADER"
            });
        } else {
            if (user.googleId && user.googleId !== payload.sub) {
                return res.status(409).json({ error: "This email is linked to a different Google account" });
            }

            user.name = user.name || payload.name || user.name;
            user.googleId = user.googleId || payload.sub;
            user.avatarUrl = payload.picture || user.avatarUrl;

            if (!user.passwordHash) {
                user.authProvider = "google";
            }

            await user.save();
        }

        res.json(buildAuthResponse(user));
    } catch (error) {
        console.error("Google auth error:", error);
        res.status(401).json({ error: "Google sign-in failed" });
    }
});

router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user?.userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            name: user.name,
            email: user.email,
            picture: user.avatarUrl || null,
        });
    } catch (error) {
        console.error("Auth profile error:", error);
        res.status(500).json({ error: "Failed to load user profile" });
    }
});

export default router;
