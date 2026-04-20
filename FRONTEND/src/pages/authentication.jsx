import * as React from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

export default function Authentication() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName]         = React.useState('');
    const [error, setError]       = React.useState('');
    const [message, setMessage]   = React.useState('');
    const [formState, setFormState] = React.useState(0); // 0 = sign in, 1 = sign up
    const [loading, setLoading]   = React.useState(false);
    const [showPass, setShowPass] = React.useState(false);
    const [toast, setToast]       = React.useState(false);

    const { handleRegister, handleLogin, handleGoogleLogin } = React.useContext(AuthContext);
    const navigate = useNavigate();

    // Google OAuth hook — opens Google popup, sends credential to our backend
    const [googleLoading, setGoogleLoading] = React.useState(false);
    const googleLoginHook = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleLoading(true);
            setError('');
            try {
                // Exchange access token for user info, then verify on backend
                // The @react-oauth/google library gives us an access_token here
                // We fetch userinfo and send the credential to the backend
                const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                }).then(r => r.json());

                // Build a simple credential object to send to backend
                // Backend will use google-auth-library to verify via access token
                await handleGoogleLogin(tokenResponse.access_token, userInfo);
            } catch (err) {
                setError(err?.response?.data?.message || 'Google login failed. Please try again.');
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: () => {
            setError('Google login was cancelled or failed.');
            setGoogleLoading(false);
        },
        flow: 'implicit',
    });

    const handleAuth = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (formState === 0) {
                await handleLogin(username, password);
            } else {
                if (!name.trim()) { setError('Please enter your full name.'); setLoading(false); return; }
                const result = await handleRegister(name, username, password);
                setMessage(result || 'Account created! Please sign in.');
                setToast(true);
                setTimeout(() => setToast(false), 4000);
                setFormState(0);
                setUsername(''); setPassword(''); setName('');
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => { if (e.key === 'Enter') handleAuth(); };

    const switchForm = (state) => {
        setFormState(state);
        setError(''); setUsername(''); setPassword(''); setName('');
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                @keyframes authFadeUp  { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
                @keyframes authFadeIn  { from{opacity:0;}to{opacity:1;} }
                @keyframes authSlide   { from{opacity:0;transform:translateX(16px);}to{opacity:1;transform:translateX(0);} }
                @keyframes authSpin    { to{transform:rotate(360deg);} }
                @keyframes authToast   { 0%{opacity:0;transform:translateY(12px);}10%{opacity:1;transform:translateY(0);}90%{opacity:1;}100%{opacity:0;transform:translateY(-8px);} }
                @keyframes authFloat   { 0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);} }
                @keyframes authPulse   { 0%,100%{opacity:0.6;}50%{opacity:1;} }

                .auth-page {
                    min-height: 100vh;
                    display: flex;
                    font-family: 'Manrope', sans-serif;
                    background: #f7f8fc;
                }

                /* ── LEFT BRAND PANEL ─────────────────────────────── */
                .auth-brand {
                    flex: 1.1;
                    background: linear-gradient(160deg, #0d1526 0%, #111827 55%, #0a1020 100%);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 2.5rem;
                    position: relative;
                    overflow: hidden;
                }
                .auth-brand::before {
                    content: '';
                    position: absolute;
                    width: 600px; height: 600px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(26,110,245,0.25) 0%, transparent 70%);
                    top: -200px; right: -150px;
                    animation: authFloat 8s ease-in-out infinite;
                    pointer-events: none;
                }
                .auth-brand::after {
                    content: '';
                    position: absolute;
                    width: 400px; height: 400px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(124,77,255,0.18) 0%, transparent 70%);
                    bottom: -100px; left: -80px;
                    animation: authFloat 10s ease-in-out infinite reverse;
                    pointer-events: none;
                }

                .auth-brand-logo {
                    display: flex; align-items: center; gap: 10px;
                    position: relative; z-index: 1;
                }
                .auth-brand-logo-box {
                    width: 38px; height: 38px; border-radius: 11px;
                    background: linear-gradient(135deg, #1a6ef5, #7c4dff);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 16px rgba(26,110,245,0.40);
                }
                .auth-brand-name {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-weight: 900; font-size: 1.2rem;
                    letter-spacing: -0.03em; color: #fff;
                }

                .auth-brand-center {
                    position: relative; z-index: 1;
                    animation: authFadeUp 0.8s 0.2s both;
                }
                .auth-brand-center h2 {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: clamp(1.8rem, 3vw, 2.6rem);
                    font-weight: 900; letter-spacing: -0.04em;
                    color: #fff; line-height: 1.1; margin-bottom: 16px;
                }
                .auth-brand-center h2 span {
                    background: linear-gradient(135deg, #60a5fa, #a78bfa);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .auth-brand-center p {
                    color: rgba(255,255,255,0.5);
                    font-size: 0.92rem; line-height: 1.7; max-width: 340px;
                }

                /* Feature pills */
                .auth-features {
                    display: flex; flex-direction: column; gap: 10px;
                    position: relative; z-index: 1; margin-top: 32px;
                }
                .auth-feat {
                    display: flex; align-items: center; gap: 12px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px; padding: 12px 16px;
                    color: rgba(255,255,255,0.75);
                    font-size: 0.82rem; font-weight: 600;
                    transition: background 0.2s;
                }
                .auth-feat:hover { background: rgba(255,255,255,0.09); }
                .auth-feat-ico {
                    width: 32px; height: 32px; border-radius: 9px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1rem; flex-shrink: 0;
                }

                .auth-brand-footer {
                    position: relative; z-index: 1;
                    color: rgba(255,255,255,0.25); font-size: 0.72rem;
                }

                /* ── RIGHT FORM PANEL ─────────────────────────────── */
                .auth-form-panel {
                    flex: 1;
                    display: flex; align-items: center; justify-content: center;
                    padding: 2rem;
                    background: #fff;
                    position: relative;
                }

                .auth-form-inner {
                    width: 100%; max-width: 400px;
                    animation: authFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
                }

                /* Header */
                .auth-form-head { margin-bottom: 28px; }
                .auth-form-head h1 {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 1.7rem; font-weight: 900;
                    letter-spacing: -0.035em; color: #0f1729; margin-bottom: 6px;
                }
                .auth-form-head p { color: #8a94a6; font-size: 0.88rem; }
                .auth-form-head p a, .auth-form-head p span {
                    color: #1a6ef5; font-weight: 700; cursor: pointer;
                    text-decoration: none;
                }
                .auth-form-head p a:hover, .auth-form-head p span:hover { text-decoration: underline; }

                /* Google button */
                .auth-google {
                    width: 100%;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    padding: 11px 16px;
                    border-radius: 12px;
                    border: 1.5px solid rgba(0,0,0,0.12);
                    background: #fff;
                    color: #0f1729;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 0.88rem; font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
                    transition: all 0.18s;
                    margin-bottom: 20px;
                }
                .auth-google:hover {
                    border-color: rgba(0,0,0,0.22);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
                    transform: translateY(-1px);
                }
                .auth-google-ico { width: 20px; height: 20px; flex-shrink: 0; }

                /* Divider */
                .auth-divider {
                    display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
                }
                .auth-divider-line { flex: 1; height: 1px; background: rgba(0,0,0,0.08); }
                .auth-divider-text { color: #b0b8c8; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }

                /* Field group */
                .auth-field-group { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
                .auth-field-wrap  { position: relative; }
                .auth-label {
                    display: block;
                    font-size: 0.78rem; font-weight: 700; color: #4a5568;
                    margin-bottom: 6px; letter-spacing: 0.01em;
                }
                .auth-input {
                    width: 100%; padding: 11px 14px;
                    border-radius: 11px;
                    border: 1.5px solid rgba(0,0,0,0.10);
                    background: #f8f9fc;
                    font-family: 'Manrope', sans-serif;
                    font-size: 0.9rem; color: #0f1729;
                    outline: none;
                    transition: all 0.18s;
                }
                .auth-input:focus {
                    border-color: #1a6ef5;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(26,110,245,0.10);
                }
                .auth-input::placeholder { color: #b0b8c8; }
                .auth-input.has-icon { padding-right: 44px; }

                .auth-pass-toggle {
                    position: absolute; right: 12px; top: 50%;
                    transform: translateY(-50%);
                    background: none; border: none; cursor: pointer;
                    color: #b0b8c8; padding: 4px; line-height: 1;
                    transition: color 0.15s;
                }
                .auth-pass-toggle:hover { color: #4a5568; }

                /* Error */
                .auth-error {
                    display: flex; align-items: flex-start; gap: 8px;
                    background: rgba(245,54,92,0.07);
                    border: 1px solid rgba(245,54,92,0.18);
                    border-radius: 10px;
                    padding: 10px 12px;
                    color: #d73561;
                    font-size: 0.82rem; font-weight: 600;
                    margin-bottom: 16px;
                    animation: authFadeIn 0.2s;
                }

                /* Submit button */
                .auth-submit {
                    width: 100%; padding: 13px;
                    border-radius: 12px; border: none;
                    background: linear-gradient(135deg, #1a6ef5, #7c4dff);
                    color: #fff;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 0.92rem; font-weight: 800;
                    cursor: pointer;
                    box-shadow: 0 6px 20px rgba(26,110,245,0.35);
                    transition: all 0.2s;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    position: relative; overflow: hidden;
                }
                .auth-submit::before {
                    content: '';
                    position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
                    transition: left 0.5s;
                }
                .auth-submit:hover::before { left: 100%; }
                .auth-submit:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(26,110,245,0.45);
                }
                .auth-submit:disabled { opacity: 0.65; cursor: not-allowed; }

                /* Spinner */
                .auth-spinner {
                    width: 16px; height: 16px; border-radius: 50%;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    animation: authSpin 0.7s linear infinite;
                    flex-shrink: 0;
                }

                /* Tab row */
                .auth-tabs {
                    display: flex; gap: 0;
                    background: #f3f4f8; border-radius: 12px;
                    padding: 4px; margin-bottom: 24px;
                }
                .auth-tab {
                    flex: 1; padding: 9px 14px;
                    border-radius: 9px; border: none;
                    background: transparent;
                    color: #8a94a6; font-size: 0.85rem; font-weight: 700;
                    cursor: pointer; transition: all 0.18s;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                }
                .auth-tab.active {
                    background: #fff; color: #0f1729;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }

                /* Terms */
                .auth-terms {
                    text-align: center; margin-top: 16px;
                    color: #b0b8c8; font-size: 0.74rem;
                }
                .auth-terms a { color: #8a94a6; text-decoration: none; }
                .auth-terms a:hover { color: #1a6ef5; }

                /* Toast */
                .auth-toast {
                    position: fixed; bottom: 28px; left: 50%;
                    transform: translateX(-50%);
                    background: #0f1729; color: #fff;
                    padding: 12px 24px; border-radius: 999px;
                    font-size: 0.82rem; font-weight: 700;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.25);
                    display: flex; align-items: center; gap: 8px;
                    white-space: nowrap; z-index: 999;
                    animation: authToast 4s ease forwards;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .auth-brand { display: none; }
                    .auth-form-panel { background: #f7f8fc; }
                }
            `}</style>

            <div className="auth-page">

                {/* ── LEFT BRAND PANEL ─────────────────────────────────── */}
                <div className="auth-brand">
                    {/* Logo */}
                    <div className="auth-brand-logo">
                        <div className="auth-brand-logo-box">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 10l4.553-2.07A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14"/>
                                <rect x="3" y="6" width="12" height="12" rx="2"/>
                            </svg>
                        </div>
                        <span className="auth-brand-name">Saki Call</span>
                    </div>

                    {/* Center copy */}
                    <div className="auth-brand-center">
                        <h2>
                            Your meetings,<br />
                            <span>reimagined.</span>
                        </h2>
                        <p>
                            HD video calls, real-time chat, and screen sharing — all in one place.
                            No downloads. No limits. Just connect.
                        </p>

                        <div className="auth-features">
                            {[
                                { ico: '🎬', bg: 'rgba(26,110,245,0.15)',  text: 'HD video & audio quality'       },
                                { ico: '🔒', bg: 'rgba(45,206,137,0.15)',  text: 'End-to-end encrypted calls'    },
                                { ico: '🖥️', bg: 'rgba(245,158,11,0.15)',  text: 'One-click screen sharing'      },
                                { ico: '💬', bg: 'rgba(124,77,255,0.15)',  text: 'In-call messaging & reactions' },
                            ].map((f, i) => (
                                <div key={i} className="auth-feat">
                                    <div className="auth-feat-ico" style={{ background: f.bg }}>{f.ico}</div>
                                    {f.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="auth-brand-footer">
                        © {new Date().getFullYear()} Saki Call · All rights reserved
                    </div>
                </div>

                {/* ── RIGHT FORM PANEL ─────────────────────────────────── */}
                <div className="auth-form-panel">
                    <div className="auth-form-inner">

                        {/* Header */}
                        <div className="auth-form-head">
                            <h1>{formState === 0 ? 'Welcome back 👋' : 'Create account'}</h1>
                            <p>
                                {formState === 0
                                    ? <>Don't have an account? <span onClick={() => switchForm(1)}>Sign up free</span></>
                                    : <>Already have an account? <span onClick={() => switchForm(0)}>Sign in</span></>
                                }
                            </p>
                        </div>

                        {/* Tab switcher */}
                        <div className="auth-tabs">
                            <button className={`auth-tab ${formState === 0 ? 'active' : ''}`} onClick={() => switchForm(0)}>
                                Sign In
                            </button>
                            <button className={`auth-tab ${formState === 1 ? 'active' : ''}`} onClick={() => switchForm(1)}>
                                Sign Up
                            </button>
                        </div>

                        {/* Google button */}
                        <button
                            className="auth-google"
                            onClick={() => { setError(''); googleLoginHook(); }}
                            disabled={googleLoading}
                        >
                            {googleLoading ? (
                                <><div className="auth-spinner" style={{borderTopColor:'#4285F4',borderColor:'rgba(66,133,244,0.2)'}}/> Connecting to Google…</>
                            ) : (
                                <>
                                    <svg className="auth-google-ico" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Continue with Google
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="auth-divider">
                            <div className="auth-divider-line" />
                            <span className="auth-divider-text">or continue with email</span>
                            <div className="auth-divider-line" />
                        </div>

                        {/* Fields */}
                        <div className="auth-field-group">
                            {formState === 1 && (
                                <div className="auth-field-wrap" key="name-field">
                                    <label className="auth-label">Full name</label>
                                    <input
                                        className="auth-input"
                                        type="text"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        onKeyDown={handleKey}
                                        autoFocus
                                    />
                                </div>
                            )}
                            <div className="auth-field-wrap">
                                <label className="auth-label">Username</label>
                                <input
                                    className="auth-input"
                                    type="text"
                                    placeholder="yourname"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    onKeyDown={handleKey}
                                    autoFocus={formState === 0}
                                />
                            </div>
                            <div className="auth-field-wrap">
                                <label className="auth-label">Password</label>
                                <input
                                    className={`auth-input has-icon`}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={handleKey}
                                />
                                <button className="auth-pass-toggle" type="button" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                                    {showPass ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="auth-error">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}>
                                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button className="auth-submit" onClick={handleAuth} disabled={loading}>
                            {loading ? (
                                <><div className="auth-spinner" /> {formState === 0 ? 'Signing in…' : 'Creating account…'}</>
                            ) : (
                                <>{formState === 0 ? 'Sign in' : 'Create account'} →</>
                            )}
                        </button>

                        {/* Terms */}
                        <p className="auth-terms">
                            By continuing, you agree to our{' '}
                            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="auth-toast">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dce89" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {message}
                </div>
            )}
        </>
    );
}