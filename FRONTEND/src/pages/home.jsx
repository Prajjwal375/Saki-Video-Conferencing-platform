import React, { useContext, useState, useRef, useEffect } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

function Card3D({ children, className, onClick, style }) {
    const cardRef = useRef(null)
    const glowRef = useRef(null)

    const handleMouseMove = (e) => {
        const card = cardRef.current
        if (!card) return
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cx = rect.width / 2
        const cy = rect.height / 2
        const rotX = ((y - cy) / cy) * -10
        const rotY = ((x - cx) / cx) * 10
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px) scale(1.02)`
        if (glowRef.current) {
            glowRef.current.style.opacity = '1'
            glowRef.current.style.background = `radial-gradient(200px circle at ${x}px ${y}px, rgba(255,255,255,0.12), transparent 60%)`
        }
    }

    const handleMouseLeave = () => {
        const card = cardRef.current
        if (!card) return
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)'
        if (glowRef.current) glowRef.current.style.opacity = '0'
    }

    return (
        <div
            ref={cardRef}
            className={className}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transition: 'transform 0.15s ease', position: 'relative', ...style }}
        >
            <div ref={glowRef} style={{
                position: 'absolute', inset: 0, borderRadius: 'inherit',
                opacity: 0, pointerEvents: 'none', zIndex: 1,
                transition: ' 0.2s'
            }} />
            {children}
        </div>
    )
}

function HomeComponent() {
    const navigate = useNavigate()
    const [meetingCode, setMeetingCode] = useState('')
    const [showJoin, setShowJoin] = useState(false)
    const [isJoining, setIsJoining] = useState(false)
    const [copied, setCopied] = useState(false)
    const [showProfile, setShowProfile] = useState(false)
    const { addToUserHistory } = useContext(AuthContext)
    const inputRef = useRef(null)
    const profileRef = useRef(null)

    // Read user info from localStorage
    const userName = localStorage.getItem('userName') || 'User'
    const userAvatar = localStorage.getItem('userAvatar') || ''
    const userInitial = userName.charAt(0).toUpperCase()

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfile(false)
            }
        }
        if (showProfile) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [showProfile])

    const handleSignOut = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('userName')
        localStorage.removeItem('userAvatar')
        navigate('/auth')
    }

    useEffect(() => {
        if (showJoin && inputRef.current) inputRef.current.focus()
    }, [showJoin])

    const handleJoin = async () => {
        if (!meetingCode.trim()) return
        setIsJoining(true)
        await addToUserHistory(meetingCode)
        navigate(`/room/${meetingCode}`)
    }

    const handleNewMeeting = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        navigate(`/room/${code}`)
    }

    const handleCopyCode = async () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        await navigator.clipboard?.writeText(code).catch(() => { })
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                :root {
                    --blue: #1a6ef5; --blue-dark: #1557cc; --blue-soft: rgba(26,110,245,0.1);
                    --purple: #7c4dff; --purple-soft: rgba(124,77,255,0.1);
                    --teal: #00b8a9; --teal-soft: rgba(0,184,169,0.1);
                    --rose: #f5365c; --rose-soft: rgba(245,54,92,0.1);
                    --green: #2dce89; --green-soft: rgba(45,206,137,0.12);
                    --bg: #f4f6fb; --bg2: #eef1f8; --card: #ffffff;
                    --text: #0f1729; --text2: #4a5568; --text3: #8a94a6;
                    --border: rgba(0,0,0,0.07);
                    --shadow: 0 4px 24px rgba(15,23,41,0.08);
                    --shadow-hover: 0 24px 64px rgba(15,23,41,0.16);
                }
                .pg { min-height:100vh; background:var(--bg); font-family:'Manrope',sans-serif; color:var(--text); overflow-x:hidden; position:relative; }
                .pg::before { content:''; position:fixed; inset:0; background:url('/background.png') center center / cover no-repeat; opacity:0.08; pointer-events:none; z-index:0; }
                .pg::after { content:''; position:fixed; inset:0; background:radial-gradient(ellipse 80% 60% at 80% 20%, rgba(26,110,245,0.04) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(124,77,255,0.03) 0%, transparent 60%); pointer-events:none; z-index:0; }
                .pg > * { position:relative; z-index:1; }

                /* NAV */
                .nav { position:sticky; top:0; z-index:100; display:flex; align-items:center; justify-content:space-between; padding:0 48px; height:64px; background:rgba(244,246,251,0.88); backdrop-filter:blur(20px); border-bottom:1px solid var(--border); }
                .nav-logo { display:flex; align-items:center; gap:10px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:1.2rem; color:var(--text); letter-spacing:-0.02em; text-decoration:none; }
                .nav-logo-box { width:34px; height:34px; border-radius:10px; background:var(--blue); display:flex; align-items:center; justify-content:center; }
                .nav-logo-box svg { width:18px; height:18px; fill:none; stroke:#fff; stroke-width:2; }
                .nav-right { display:flex; align-items:center; gap:8px; }
                .nav-pill { display:flex; align-items:center; gap:6px; padding:7px 16px; border-radius:999px; border:1px solid var(--border); background:var(--card); color:var(--text2); font-size:0.82rem; font-weight:600; cursor:pointer; transition:all 0.18s; font-family:'Manrope',sans-serif; }
                .nav-pill:hover { border-color:rgba(26,110,245,0.3); color:var(--blue); background:var(--blue-soft); }
                .nav-pill-primary { background:var(--blue); color:#fff; border-color:var(--blue); }
                .nav-pill-primary:hover { background:var(--blue-dark); color:#fff; border-color:var(--blue-dark); }
                .nav-avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,var(--blue),var(--purple)); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.8rem; font-weight:700; cursor:pointer; transition:transform 0.2s; overflow:hidden; flex-shrink:0; }
                .nav-avatar:hover { transform:scale(1.08); }
                .nav-avatar img { width:100%; height:100%; object-fit:cover; }

                /* PROFILE DROPDOWN */
                .profile-wrap { position:relative; }
                .profile-dd { position:absolute; top:calc(100% + 10px); right:0; width:290px; background:#fff; border-radius:16px; border:1px solid rgba(0,0,0,0.08); box-shadow:0 16px 48px rgba(15,23,41,0.14),0 2px 8px rgba(15,23,41,0.06); padding:0; overflow:hidden; z-index:200; opacity:0; transform:translateY(-8px) scale(0.97); animation:ddIn 0.2s cubic-bezier(0.16,1,0.3,1) forwards; }
                @keyframes ddIn { to { opacity:1; transform:translateY(0) scale(1); } }
                .profile-header { padding:20px 20px 16px; display:flex; align-items:center; gap:12px; border-bottom:1px solid rgba(0,0,0,0.06); }
                .profile-av { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,var(--blue),var(--purple)); display:flex; align-items:center; justify-content:center; color:#fff; font-size:1rem; font-weight:800; flex-shrink:0; overflow:hidden; }
                .profile-av img { width:100%; height:100%; object-fit:cover; }
                .profile-name { font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:0.95rem; color:var(--text); letter-spacing:-0.02em; }
                .profile-badge { display:inline-flex; align-items:center; gap:4px; margin-top:3px; padding:2px 8px; border-radius:999px; font-size:0.65rem; font-weight:700; }
                .profile-badge-local { background:var(--blue-soft); color:var(--blue); }
                .profile-badge-google { background:rgba(66,133,244,0.1); color:#4285F4; }
                .profile-menu { padding:8px; }
                .profile-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; border:none; background:none; width:100%; text-align:left; font-family:'Manrope',sans-serif; font-size:0.84rem; font-weight:600; color:var(--text2); cursor:pointer; transition:all 0.15s; }
                .profile-item:hover { background:var(--bg); color:var(--text); }
                .profile-item-ico { width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:0.9rem; flex-shrink:0; }
                .profile-sep { height:1px; background:rgba(0,0,0,0.06); margin:4px 8px; }
                .profile-item-danger { color:var(--rose); }
                .profile-item-danger:hover { background:var(--rose-soft); color:var(--rose); }

                /* HERO */
                .hero { display:flex; align-items:center; padding:72px 48px 0; gap:64px; max-width:1280px; margin:0 auto; min-height:calc(100vh - 64px); }
                .hero-left { flex:1; max-width:560px; }
                .hero-tag { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:999px; background:var(--blue-soft); border:1px solid rgba(26,110,245,0.2); color:var(--blue); font-size:0.75rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:24px; opacity:0; transform:translateY(16px); animation:fadeUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) forwards; }
                .hero-tag-dot { width:7px; height:7px; border-radius:50%; background:var(--blue); animation:blink 2s infinite; }
                @keyframes blink { 0%,100%{opacity:1;}50%{opacity:0.3;} }
                .hero-h1 { font-family:'Plus Jakarta Sans',sans-serif; font-size:clamp(2.4rem,4.5vw,3.6rem); font-weight:800; line-height:1.08; letter-spacing:-0.03em; color:var(--text); margin-bottom:20px; opacity:0; transform:translateY(20px); animation:fadeUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) forwards; }
                .hero-h1 span { background:linear-gradient(135deg,var(--blue) 0%,var(--purple) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
                .hero-sub { font-size:1.05rem; color:var(--text2); line-height:1.7; font-weight:400; margin-bottom:36px; max-width:460px; opacity:0; transform:translateY(20px); animation:fadeUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
                @keyframes fadeUp { to { opacity:1; transform:translateY(0); } }

                /* CTAs */
                .hero-ctas { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:48px; opacity:0; transform:translateY(20px); animation:fadeUp 0.6s 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
                .btn { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; border-radius:14px; border:none; font-family:'Plus Jakarta Sans',sans-serif; font-size:0.92rem; font-weight:700; cursor:pointer; transition:all 0.2s; }
                .btn-primary { background:var(--blue); color:#fff; box-shadow:0 4px 20px rgba(26,110,245,0.35); }
                .btn-primary:hover { background:var(--blue-dark); transform:translateY(-2px); box-shadow:0 8px 32px rgba(26,110,245,0.45); }
                .btn-outline { background:var(--card); color:var(--text); border:1.5px solid var(--border); box-shadow:var(--shadow); }
                .btn-outline:hover { border-color:rgba(26,110,245,0.3); color:var(--blue); background:var(--blue-soft); transform:translateY(-2px); }

                /* JOIN PANEL */
                .join-panel { display:flex; gap:10px; align-items:center; padding:14px 16px; background:var(--card); border:1.5px solid rgba(26,110,245,0.25); border-radius:18px; box-shadow:0 8px 32px rgba(26,110,245,0.12); margin-bottom:48px; animation:slideIn 0.3s cubic-bezier(0.16,1,0.3,1); }
                @keyframes slideIn { from{opacity:0;transform:translateY(-10px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);} }
                .join-input { flex:1; border:none; outline:none; background:transparent; font-family:'Manrope',sans-serif; font-size:0.95rem; color:var(--text); font-weight:600; letter-spacing:0.04em; }
                .join-input::placeholder { color:var(--text3); font-weight:400; }
                .join-submit { padding:10px 20px; border-radius:10px; border:none; background:var(--blue); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:0.85rem; font-weight:700; cursor:pointer; transition:all 0.18s; box-shadow:0 4px 14px rgba(26,110,245,0.3); }
                .join-submit:hover:not(:disabled) { background:var(--blue-dark); transform:scale(1.02); }
                .join-submit:disabled { opacity:0.5; cursor:not-allowed; }
                .join-close { width:32px; height:32px; border-radius:8px; border:1px solid var(--border); background:transparent; color:var(--text3); cursor:pointer; transition:all 0.15s; font-size:1rem; display:flex; align-items:center; justify-content:center; }
                .join-close:hover { background:var(--bg2); color:var(--text); }

                /* TRUST */
                .trust { display:flex; align-items:center; gap:20px; opacity:0; animation:fadeUp 0.6s 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
                .trust-item { display:flex; align-items:center; gap:7px; color:var(--text3); font-size:0.78rem; font-weight:600; }
                .trust-check { width:18px; height:18px; border-radius:50%; background:var(--green-soft); display:flex; align-items:center; justify-content:center; }
                .trust-check svg { width:10px; height:10px; stroke:var(--green); fill:none; stroke-width:2.5; }
                .trust-sep { width:1px; height:16px; background:var(--border); }

                /* HERO RIGHT */
                .hero-right { flex:1; display:flex; justify-content:center; align-items:center; position:relative; opacity:0; transform:translateX(30px); animation:fadeRight 0.8s 0.35s cubic-bezier(0.16,1,0.3,1) forwards; padding-bottom:72px; }
                @keyframes fadeRight { to{opacity:1;transform:translateX(0);} }
                .mock-wrap { position:relative; width:100%; max-width:520px; }
                .mock-screen { background:#1a1d2e; border-radius:22px; box-shadow:0 40px 80px rgba(15,23,41,0.22),0 0 0 1px rgba(255,255,255,0.06); overflow:hidden; animation:float 6s ease-in-out infinite; }
                @keyframes float { 0%,100%{transform:translateY(0px) rotate(-0.5deg);}50%{transform:translateY(-14px) rotate(0.5deg);} }
                .mock-topbar { background:#13151f; padding:12px 16px; display:flex; align-items:center; gap:10px; border-bottom:1px solid rgba(255,255,255,0.06); }
                .mock-dots { display:flex; gap:5px; }
                .mock-dot { width:8px; height:8px; border-radius:50%; }
                .mock-title { color:rgba(255,255,255,0.4); font-size:0.7rem; font-weight:600; flex:1; text-align:center; letter-spacing:0.05em; }
                .mock-grid { display:grid; grid-template-columns:1fr 1fr; gap:3px; padding:3px; }
                .mock-cell { border-radius:8px; display:flex; align-items:flex-end; padding:10px; position:relative; overflow:hidden; aspect-ratio:4/3; }
                .mock-cell-1 { background:linear-gradient(135deg,#2d4a8a,#1a2f5c); }
                .mock-cell-2 { background:linear-gradient(135deg,#3d2a5c,#251740); }
                .mock-cell-3 { background:linear-gradient(135deg,#1e3a4a,#0f2030); }
                .mock-cell-4 { background:linear-gradient(135deg,#3a2a1a,#201508); }
                .mock-av { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.85rem; font-weight:700; color:#fff; position:absolute; top:50%; left:50%; transform:translate(-50%,-60%); }
                .av1{background:linear-gradient(135deg,#2563eb,#7c3aed);}
                .av2{background:linear-gradient(135deg,#ec4899,#f97316);}
                .av3{background:linear-gradient(135deg,#10b981,#3b82f6);}
                .av4{background:linear-gradient(135deg,#f59e0b,#ef4444);}
                .mock-name { font-size:0.6rem; color:rgba(255,255,255,0.7); font-weight:600; z-index:1; }
                .mock-controls { background:#13151f; padding:10px 16px; display:flex; justify-content:center; gap:10px; border-top:1px solid rgba(255,255,255,0.06); }
                .mock-ctrl { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.78rem; }
                .ctrl-n { background:rgba(255,255,255,0.08); }
                .ctrl-r { background:rgba(239,68,68,0.3); }

                /* CHIPS */
                .chip { position:absolute; background:var(--card); border-radius:14px; padding:10px 14px; display:flex; align-items:center; gap:8px; box-shadow:0 8px 24px rgba(15,23,41,0.14); font-size:0.75rem; font-weight:600; color:var(--text); border:1px solid var(--border); white-space:nowrap; }
                .chip-ico { width:26px; height:26px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:0.82rem; }
                .chip-1 { bottom:50px; left:-28px; animation:cf1 4s ease-in-out infinite; }
                .chip-2 { top:24px; right:-16px; animation:cf2 5s ease-in-out infinite; }
                .chip-3 { bottom:16px; right:16px; animation:cf3 4.5s ease-in-out infinite; }
                @keyframes cf1{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
                @keyframes cf2{0%,100%{transform:translateY(0);}50%{transform:translateY(8px);}}
                @keyframes cf3{0%,100%{transform:translateY(0) rotate(-1deg);}50%{transform:translateY(-6px) rotate(1deg);}}

                /* SECTION */
                .section { max-width:1280px; margin:0 auto; padding:80px 48px; }
                .section-hd { text-align:center; margin-bottom:48px; }
                .section-hd h2 { font-family:'Plus Jakarta Sans',sans-serif; font-size:clamp(1.6rem,3vw,2.1rem); font-weight:800; letter-spacing:-0.03em; color:var(--text); margin-bottom:8px; }
                .section-hd p { color:var(--text2); font-size:1rem; }
                .cards-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
                .card3d { background:var(--card); border-radius:22px; border:1px solid var(--border); padding:28px 24px 24px; cursor:pointer; box-shadow:var(--shadow); overflow:hidden; transition:box-shadow 0.25s; }
                .card3d:hover { box-shadow:var(--shadow-hover); }
                .card-ico { width:52px; height:52px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:1.4rem; margin-bottom:18px; }
                .ico-b{background:var(--blue-soft);}
                .ico-p{background:var(--purple-soft);}
                .ico-t{background:var(--teal-soft);}
                .ico-r{background:var(--rose-soft);}
                .card-label { font-family:'Plus Jakarta Sans',sans-serif; font-size:1rem; font-weight:800; color:var(--text); margin-bottom:6px; letter-spacing:-0.01em; }
                .card-desc { font-size:0.82rem; color:var(--text3); line-height:1.55; margin-bottom:20px; }
                .card-cta { display:inline-flex; align-items:center; gap:5px; font-size:0.8rem; font-weight:700; color:var(--blue); transition:gap 0.18s; }
                .card3d:hover .card-cta { gap:9px; }
                .card-bar { position:absolute; bottom:0; left:0; right:0; height:3px; }
                .bar-b{background:linear-gradient(90deg,var(--blue),#60a5fa);}
                .bar-p{background:linear-gradient(90deg,var(--purple),#a78bfa);}
                .bar-t{background:linear-gradient(90deg,var(--teal),#34d399);}
                .bar-r{background:linear-gradient(90deg,var(--rose),#fb7185);}

                /* BANNER */
                .banner { max-width:1280px; margin:0 auto 80px; padding:0 48px; }
                .banner-inner { background:linear-gradient(135deg,#1a2b6b 0%,#0f1a44 40%,#1a1040 100%); border-radius:28px; padding:56px 64px; display:flex; align-items:center; justify-content:space-between; gap:32px; position:relative; overflow:hidden; }
                .b-glow1 { position:absolute; width:400px; height:400px; border-radius:50%; background:rgba(26,110,245,0.2); filter:blur(80px); top:-100px; right:100px; pointer-events:none; }
                .b-glow2 { position:absolute; width:300px; height:300px; border-radius:50%; background:rgba(124,77,255,0.15); filter:blur(60px); bottom:-80px; left:200px; pointer-events:none; }
                .banner-text { position:relative; z-index:1; }
                .banner-text h2 { font-family:'Plus Jakarta Sans',sans-serif; font-size:clamp(1.5rem,2.5vw,2rem); font-weight:800; color:#fff; letter-spacing:-0.025em; margin-bottom:8px; }
                .banner-text p { color:rgba(255,255,255,0.5); font-size:0.95rem; }
                .banner-ctas { display:flex; gap:12px; position:relative; z-index:1; flex-shrink:0; }
                .btn-w { background:#fff; color:var(--text); padding:13px 26px; border-radius:14px; border:none; font-family:'Plus Jakarta Sans',sans-serif; font-size:0.88rem; font-weight:700; cursor:pointer; transition:all 0.18s; box-shadow:0 4px 16px rgba(0,0,0,0.2); }
                .btn-w:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.25); }
                .btn-gw { background:rgba(255,255,255,0.1); color:#fff; padding:13px 26px; border-radius:14px; border:1px solid rgba(255,255,255,0.2); font-family:'Plus Jakarta Sans',sans-serif; font-size:0.88rem; font-weight:700; cursor:pointer; transition:all 0.18s; }
                .btn-gw:hover { background:rgba(255,255,255,0.18); transform:translateY(-2px); }

                /* FOOTER */
                .footer { border-top:1px solid var(--border); padding:24px 48px; display:flex; align-items:center; justify-content:space-between; max-width:1280px; margin:0 auto; color:var(--text3); font-size:0.78rem; }

                /* TOAST */
                .toast { position:fixed; bottom:32px; left:50%; transform:translateX(-50%); background:var(--text); color:#fff; padding:10px 22px; border-radius:999px; font-size:0.82rem; font-weight:600; z-index:999; animation:toastIn 0.3s cubic-bezier(0.16,1,0.3,1); }
                @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);} }

                @media(max-width:900px){
                    .nav{padding:0 20px;}
                    .hero{flex-direction:column;padding:48px 20px 0;gap:40px;min-height:auto;}
                    .hero-right{width:100%;padding-bottom:48px;}
                    .section{padding:60px 20px;}
                    .cards-grid{grid-template-columns:1fr 1fr;}
                    .banner{padding:0 20px;}
                    .banner-inner{flex-direction:column;padding:40px 32px;text-align:center;}
                    .banner-ctas{justify-content:center;}
                    .footer{padding:20px;flex-direction:column;gap:8px;text-align:center;}
                }
                @media(max-width:500px){
                    .cards-grid{grid-template-columns:1fr;}
                    .hero-ctas{flex-direction:column;}
                    .trust{flex-wrap:wrap;gap:12px;}
                }
            `}</style>

            <div className="pg">
                {/* NAV */}
                <nav className="nav">
                    <div className="nav-logo">
                        <div className="nav-logo-box">
                            <svg viewBox="0 0 24 24"><path d="M15 10l4.553-2.07A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                        </div>
                        Saki Call
                    </div>
                    <div className="nav-right">
                        <button className="nav-pill" onClick={() => navigate('/history')}>🕐 History</button>
                        <div className="profile-wrap" ref={profileRef}>
                            <div className="nav-avatar" onClick={() => setShowProfile(p => !p)}>
                                {userAvatar ? <img src={userAvatar} alt={userName} /> : userInitial}
                            </div>
                            {showProfile && (
                                <div className="profile-dd">
                                    <div className="profile-header">
                                        <div className="profile-av">
                                            {userAvatar ? <img src={userAvatar} alt={userName} /> : userInitial}
                                        </div>
                                        <div>
                                            <div className="profile-name">{userName}</div>
                                            <div className={`profile-badge ${userAvatar ? 'profile-badge-google' : 'profile-badge-local'}`}>
                                                {userAvatar ? (
                                                    <><svg width="10" height="10" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg> Google account</>
                                                ) : (
                                                    <>🔑 Email account</>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="profile-menu">
                                        <button className="profile-item" onClick={() => { setShowProfile(false); navigate('/history') }}>
                                            <div className="profile-item-ico" style={{background:'var(--blue-soft)'}}>📋</div>
                                            Meeting history
                                        </button>
                                        <button className="profile-item" onClick={() => { setShowProfile(false); }}>
                                            <div className="profile-item-ico" style={{background:'var(--purple-soft)'}}>⚙️</div>
                                            Settings
                                        </button>
                                        <div className="profile-sep" />
                                        <button className="profile-item profile-item-danger" onClick={handleSignOut}>
                                            <div className="profile-item-ico" style={{background:'var(--rose-soft)'}}>🚪</div>
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* HERO */}
                <section className="hero">
                    <div className="hero-left">
                        <div className="hero-tag"><span className="hero-tag-dot" />Now with HD Video</div>
                        <h1 className="hero-h1">Video calls with<br /><span>anyone, anytime</span></h1>
                        <p className="hero-sub">Connect, collaborate, and communicate — crystal-clear video meetings with real-time chat and seamless screen sharing.</p>

                        {showJoin ? (
                            <div className="join-panel">
                                <input ref={inputRef} className="join-input" placeholder="Enter meeting code  e.g. ABC123" value={meetingCode} onChange={e => setMeetingCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleJoin()} maxLength={12} />
                                <button className="join-submit" onClick={handleJoin} disabled={!meetingCode.trim() || isJoining}>{isJoining ? 'Joining…' : 'Join →'}</button>
                                <button className="join-close" onClick={() => { setShowJoin(false); setMeetingCode('') }}>✕</button>
                            </div>
                        ) : (
                            <div className="hero-ctas">
                                <button className="btn btn-primary" onClick={handleNewMeeting}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M15 10l4.553-2.07A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                                    Start a meeting
                                </button>
                                <button className="btn btn-outline" onClick={() => setShowJoin(true)}>
                                    <span style={{ fontWeight: 700, color: 'var(--text3)' }}>#</span> Join a meeting
                                </button>
                            </div>
                        )}

                        <div className="trust">
                            {['End-to-end encrypted', 'HD quality', 'No time limits'].map((t, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <div className="trust-sep" />}
                                    <div className="trust-item">
                                        <div className="trust-check"><svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" /></svg></div>
                                        {t}
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* MOCK SCREEN */}
                    <div className="hero-right">
                        <div className="mock-wrap">
                            <div className="mock-screen">
                                <div className="mock-topbar">
                                    <div className="mock-dots">
                                        <div className="mock-dot" style={{ background: '#ff5f57' }} />
                                        <div className="mock-dot" style={{ background: '#febc2e' }} />
                                        <div className="mock-dot" style={{ background: '#28c840' }} />
                                    </div>
                                    <span className="mock-title">Team Standup · 4 participants</span>
                                </div>
                                <div className="mock-grid">
                                    {[
                                        { cls: 'mock-cell-1', av: 'av1', n: 'Arjun S.', l: 'A' },
                                        { cls: 'mock-cell-2', av: 'av2', n: 'Priya M.', l: 'P' },
                                        { cls: 'mock-cell-3', av: 'av3', n: 'Rahul K.', l: 'R' },
                                        { cls: 'mock-cell-4', av: 'av4', n: 'Sneha T.', l: 'S' },
                                    ].map((p, i) => (
                                        <div key={i} className={`mock-cell ${p.cls}`}>
                                            <div className={`mock-av ${p.av}`}>{p.l}</div>
                                            <span className="mock-name">{p.n}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mock-controls">
                                    {['🎤', '📷', '🖥️'].map((ic, i) => <div key={i} className="mock-ctrl ctrl-n">{ic}</div>)}
                                    <div className="mock-ctrl ctrl-r">📞</div>
                                    {['💬', '⋯'].map((ic, i) => <div key={i} className="mock-ctrl ctrl-n">{ic}</div>)}
                                </div>
                            </div>

                            <div className="chip chip-1">
                                <div className="chip-ico" style={{ background: 'rgba(45,206,137,0.15)' }}>✅</div>
                                <div><div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 500 }}>Status</div><div>Connected · HD</div></div>
                            </div>
                            <div className="chip chip-2">
                                <div className="chip-ico" style={{ background: 'rgba(26,110,245,0.1)' }}>🔒</div>
                                <div><div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 500 }}>Security</div><div>E2E Encrypted</div></div>
                            </div>
                            <div className="chip chip-3">
                                <div className="chip-ico" style={{ background: 'rgba(245,54,92,0.1)' }}>🔴</div>
                                <div><div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 500 }}>Live now</div><div>4 in call</div></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FEATURE CARDS */}
                <section className="section">
                    <div className="section-hd">
                        <h2>Everything you need to connect</h2>
                        <p>Simple tools, powerful results</p>
                    </div>
                    <div className="cards-grid">
                        {[
                            { ico: '🎬', icoBg: 'ico-b', label: 'New Meeting', desc: 'Launch an instant HD video call with a single click. No setup needed.', cta: 'Start now', bar: 'bar-b', action: handleNewMeeting },
                            { ico: '🔗', icoBg: 'ico-p', label: 'Join Meeting', desc: 'Enter a room code and jump straight into an ongoing call instantly.', cta: 'Enter code', bar: 'bar-p', action: () => setShowJoin(true) },
                            { ico: '📋', icoBg: 'ico-t', label: 'Past Meetings', desc: 'Review every call you attended with full dates and room codes.', cta: 'View history', bar: 'bar-t', action: () => navigate('/history') },
                            { ico: '📤', icoBg: 'ico-r', label: 'Share Invite', desc: 'Generate a unique code and copy it to send to your participants.', cta: 'Copy code', bar: 'bar-r', action: handleCopyCode },
                        ].map((c, i) => (
                            <Card3D key={i} className="card3d" onClick={c.action}>
                                <div className={`card-ico ${c.icoBg}`}>{c.ico}</div>
                                <div className="card-label">{c.label}</div>
                                <div className="card-desc">{c.desc}</div>
                                <div className="card-cta">{c.cta} →</div>
                                <div className={`card-bar ${c.bar}`} />
                            </Card3D>
                        ))}
                    </div>
                </section>

                {/* BANNER */}
                <div className="banner">
                    <div className="banner-inner">
                        <div className="b-glow1" /><div className="b-glow2" />
                        <div className="banner-text">
                            <h2>Ready to start your first call?</h2>
                            <p>No downloads, no sign-ups for guests. Just share the link.</p>
                        </div>
                        <div className="banner-ctas">
                            <button className="btn-w" onClick={handleNewMeeting}>Start for free</button>
                            <button className="btn-gw" onClick={() => setShowJoin(true)}>Join a meeting</button>
                        </div>
                    </div>
                </div>

                <footer className="footer">
                    <span>© {new Date().getFullYear()} Apna Call · All rights reserved</span>
                    <span>Built with ❤️ for seamless connections</span>
                </footer>
            </div>

            {copied && <div className="toast">✓ Meeting code copied to clipboard!</div>}
        </>
    )
}

export default withAuth(HomeComponent)
