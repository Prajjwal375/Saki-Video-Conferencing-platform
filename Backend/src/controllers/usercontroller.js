import httpStatus from "http-status";
import { User } from "../models/usermodel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Meeting } from "../models/meetingmodel.js";

// ─── LOGIN USER ───────────────────────────────────────────────────────────────
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: "Please provide username and password",
        });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "User not found",
            });
        }

        if (user.authProvider === "google") {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "This account uses Google Sign-In. Please use the Google button.",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid username or password",
            });
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();

        return res.status(httpStatus.OK).json({
            message: "Login successful",
            token,
            name: user.name,
            avatar: user.avatar,
        });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Something went wrong: ${e.message}`,
        });
    }
};

// ─── REGISTER USER ────────────────────────────────────────────────────────────
const register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: "Please provide name, username, and password",
        });
    }

    try {
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({
                message: "Username already taken",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            username,
            password: hashedPassword,
            authProvider: "local",
        });

        await newUser.save();

        return res.status(httpStatus.CREATED).json({
            message: "Account created successfully! Please sign in.",
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Something went wrong: ${error.message}`,
        });
    }
};

// ─── GOOGLE LOGIN ─────────────────────────────────────────────────────────────
// Frontend sends: { accessToken, userInfo: { sub, email, name, picture } }
// We verify the access token against Google's tokeninfo endpoint,
// then find-or-create the user in MongoDB.
const googleLogin = async (req, res) => {
    const { accessToken, userInfo } = req.body;

    if (!accessToken || !userInfo) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: "Google accessToken and userInfo are required",
        });
    }

    try {
        // Verify access token with Google tokeninfo endpoint
        const verifyRes = await fetch(
            `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
        );
        const verifyData = await verifyRes.json();

        if (verifyData.error) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid Google access token",
            });
        }

        const { sub: googleId, email, name, picture } = userInfo;

        // Sanitize email prefix → username
        const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");

        // Find by googleId first, then by email as fallback
        let user = await User.findOne({ googleId });

        if (!user) {
            // Check if someone already registered with that username
            const existing = await User.findOne({ username: baseUsername });
            const finalUsername = existing ? `${baseUsername}_g` : baseUsername;

            user = new User({
                name,
                username: finalUsername,
                googleId,
                avatar: picture || null,
                authProvider: "google",
                password: null,
            });
            await user.save();
        } else {
            // Keep avatar up to date
            if (picture && user.avatar !== picture) {
                user.avatar = picture;
            }
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();

        return res.status(httpStatus.OK).json({
            message: "Google login successful",
            token,
            name: user.name,
            username: user.username,
            avatar: user.avatar,
        });
    } catch (e) {
        console.error("Google login error:", e.message);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Something went wrong: ${e.message}`,
        });
    }
};

// ─── GET USER HISTORY ─────────────────────────────────────────────────────────
const getUserHistory = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Token is required" });
    }

    try {
        const user = await User.findOne({ token });

        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const meetings = await Meeting.find({ user_id: user.username });
        return res.status(httpStatus.OK).json(meetings);
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Something went wrong: ${e.message}`,
        });
    }
};

// ─── ADD TO HISTORY ───────────────────────────────────────────────────────────
const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    if (!token || !meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: "Token and meeting code are required",
        });
    }

    try {
        const user = await User.findOne({ token });

        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code,
        });

        await newMeeting.save();

        return res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Something went wrong: ${e.message}`,
        });
    }
};

export { login, register, googleLogin, getUserHistory, addToHistory };