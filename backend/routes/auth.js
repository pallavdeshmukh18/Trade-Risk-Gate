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

function getFrontendUrl() {
    return (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
}

function getBackendUrl() {
    return (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");
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

router.get("/google", (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).send("Google OAuth is not configured");
    }

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: `${getBackendUrl()}/auth/google/callback`,
        response_type: "code",
        scope: "profile email",
    });

    const redirectURL = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.redirect(redirectURL);
});

router.get("/google/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${getFrontendUrl()}/login?error=Missing%20Google%20auth%20code`);
    }

    return res.redirect(`${getFrontendUrl()}/dashboard`);
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
