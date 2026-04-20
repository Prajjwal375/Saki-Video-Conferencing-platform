import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

const client = axios.create({
    baseURL: `${serverUrl}/api/v1/users`
});


export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const router = useNavigate();

    // ── Standard register ────────────────────────────────────────────────────
    const handleRegister = async (name, username, password) => {
        try {
            const request = await client.post("/register", { name, username, password });
            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    };

    // ── Standard login ───────────────────────────────────────────────────────
    const handleLogin = async (username, password) => {
        try {
            const request = await client.post("/login", { username, password });
            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                if (request.data.name)   localStorage.setItem("userName", request.data.name);
                if (request.data.avatar) localStorage.setItem("userAvatar", request.data.avatar);
                const redirect = sessionStorage.getItem("redirectAfterLogin") || "/home";
                sessionStorage.removeItem("redirectAfterLogin");
                router(redirect);
            }
        } catch (err) {
            throw err;
        }
    };

    // ── Google login ─────────────────────────────────────────────────────────
    const handleGoogleLogin = async (accessToken, userInfo) => {
        try {
            const request = await client.post("/google-login", { accessToken, userInfo });
            if (request.status === httpStatus.OK) {
                localStorage.setItem("token",      request.data.token);
                localStorage.setItem("userName",   request.data.name);
                localStorage.setItem("userAvatar", request.data.avatar || "");
                const redirect = sessionStorage.getItem("redirectAfterLogin") || "/home";
                sessionStorage.removeItem("redirectAfterLogin");
                router(redirect);
            }
        } catch (err) {
            throw err;
        }
    };

    // ── History ──────────────────────────────────────────────────────────────
    const getHistoryOfUser = async () => {
        try {
            const request = await client.get("/get_all_activity", {
                params: { token: localStorage.getItem("token") },
            });
            return request.data;
        } catch (err) {
            throw err;
        }
    };

    const addToUserHistory = async (meetingCode) => {
        try {
            const request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode,
            });
            return request;
        } catch (e) {
            throw e;
        }
    };

    const data = {
        userData, setUserData,
        handleRegister, handleLogin, handleGoogleLogin,
        getHistoryOfUser, addToUserHistory,
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);