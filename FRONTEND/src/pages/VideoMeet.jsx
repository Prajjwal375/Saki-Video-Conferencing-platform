import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

const server_url = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";
const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
let connections = {};

/* ═══════════════════════════════════════════════════════════════
   ICON COMPONENTS (replacing MUI dependency for consistency)
   ═══════════════════════════════════════════════════════════════ */
const Ico = ({ d, size = 20, color = "currentColor", sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const MicOn = () => <Ico d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />;
const MicOff = () => <><Ico d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" /><Ico d="M17 16.95A7 7 0 015 12v-2m14 0v2c0 .5-.05.99-.16 1.46M12 19v4M8 23h8" /></>;
const CamOn = () => <><Ico d="M23 7l-7 5 7 5V7z" /><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg></>;
const CamOff = () => <Ico d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10M1 1l22 22" />;
const ScreenIco = () => <Ico d="M2 3h20v14H2zM8 21h8M12 17v4" />;
const EndCall = () => <Ico d="M23 16.92A16.84 16.84 0 0012 20 16.84 16.84 0 011 16.92l3-3a2 2 0 012.18-.45l2.74.91a2 2 0 001.85-.33l3.46-3.46a2 2 0 00-.33-1.85l-.91-2.74A2 2 0 0113.92 4l3-3" />;
const ChatIco = () => <Ico d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />;
const SendIco = () => <Ico d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />;

export default function VideoMeetComponent() {
    const navigate = useNavigate();
    const { roomId } = useParams();

    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const localVideoref = useRef(null);
    const videoRef = useRef([]);
    const chatEndRef = useRef(null);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState(false);
    const [screen, setScreen] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([]);
    const [showShare, setShowShare] = useState(false);
    const [copiedWhat, setCopiedWhat] = useState(null);
    const shareRef = useRef(null);

    useEffect(() => { getPermissions(); return () => cleanupConnections(); }, []);
    useEffect(() => { if (video !== undefined && audio !== undefined && !askForUsername) getUserMedia(); }, [video, audio, askForUsername]);
    useEffect(() => { if (screen !== undefined && !askForUsername) { screen ? getDisplayMedia() : getUserMedia(); } }, [screen, askForUsername]);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => {
        const handleClick = (e) => { if (shareRef.current && !shareRef.current.contains(e.target)) setShowShare(false); };
        if (showShare) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showShare]);

    const handleCopy = async (text, label) => {
        try { await navigator.clipboard.writeText(text); } catch (e) { }
        setCopiedWhat(label);
        setTimeout(() => setCopiedWhat(null), 2000);
    };

    const roomLink = `${window.location.origin}/room/${roomId}`;

    const cleanupConnections = () => {
        try { socketRef.current?.disconnect(); } catch (e) { console.log(e); }
        try { Object.values(connections).forEach(p => p?.close()); } catch (e) { console.log(e); }
        connections = {};
        try { window.localStream?.getTracks().forEach(t => t.stop()); } catch (e) { console.log(e); }
    };

    const getPermissions = async () => {
        try {
            const vs = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
            if (vs) { setVideoAvailable(true); vs.getTracks().forEach(t => t.stop()); } else setVideoAvailable(false);
            const as = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
            if (as) { setAudioAvailable(true); as.getTracks().forEach(t => t.stop()); } else setAudioAvailable(false);
            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
            const ms = await navigator.mediaDevices.getUserMedia({ video: !!vs, audio: !!as }).catch(() => null);
            if (ms) { window.localStream = ms; if (localVideoref.current) localVideoref.current.srcObject = ms; setVideo(!!vs); setAudio(!!as); }
        } catch (e) { console.log(e); }
    };

    const silence = () => { const c = new AudioContext(), o = c.createOscillator(), d = o.connect(c.createMediaStreamDestination()); o.start(); c.resume(); return Object.assign(d.stream.getAudioTracks()[0], { enabled: false }); };
    const black = ({ width = 640, height = 480 } = {}) => { const c = Object.assign(document.createElement("canvas"), { width, height }); c.getContext("2d").fillRect(0, 0, width, height); return Object.assign(c.captureStream().getVideoTracks()[0], { enabled: false }); };
    const createBlackSilenceStream = () => new MediaStream([black(), silence()]);
    const attachLocalStream = (s) => { window.localStream = s; if (localVideoref.current) localVideoref.current.srcObject = s; };

    const replaceTracksForPeers = async (stream) => {
        for (const id in connections) {
            if (id === socketIdRef.current) continue;
            const peer = connections[id]; if (!peer) continue;
            const senders = peer.getSenders();
            stream.getTracks().forEach(track => {
                const s = senders.find(s => s.track?.kind === track.kind);
                s ? s.replaceTrack(track).catch(e => console.log(e)) : peer.addTrack(track, stream);
            });
            try { const d = await peer.createOffer(); await peer.setLocalDescription(d); socketRef.current.emit("signal", id, JSON.stringify({ sdp: peer.localDescription })); } catch (e) { console.log(e); }
        }
    };

    const getUserMediaSuccess = async (stream) => {
        try { window.localStream?.getTracks().forEach(t => t.stop()); } catch (e) { console.log(e); }
        attachLocalStream(stream); await replaceTracksForPeers(stream);
        stream.getTracks().forEach(t => { t.onended = () => { setVideo(false); setAudio(false); const f = createBlackSilenceStream(); attachLocalStream(f); replaceTracksForPeers(f); }; });
    };

    const getUserMedia = async () => {
        try {
            if ((video && videoAvailable) || (audio && audioAvailable)) { const s = await navigator.mediaDevices.getUserMedia({ video: video && videoAvailable, audio: audio && audioAvailable }); await getUserMediaSuccess(s); }
            else { const f = createBlackSilenceStream(); attachLocalStream(f); await replaceTracksForPeers(f); }
        } catch (e) { console.log(e); }
    };

    const getDisplayMediaSuccess = async (stream) => {
        try { window.localStream?.getTracks().forEach(t => t.stop()); } catch (e) { console.log(e); }
        attachLocalStream(stream); await replaceTracksForPeers(stream);
        stream.getTracks().forEach(t => { t.onended = () => { setScreen(false); getUserMedia(); }; });
    };

    const getDisplayMedia = async () => {
        try { if (navigator.mediaDevices.getDisplayMedia) { const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); await getDisplayMediaSuccess(s); } } catch (e) { console.log(e); }
    };

    const gotMessageFromServer = async (fromId, message) => {
        const signal = JSON.parse(message);
        if (fromId === socketIdRef.current || !connections[fromId]) return;
        try {
            if (signal.sdp) { await connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)); if (signal.sdp.type === "offer") { const d = await connections[fromId].createAnswer(); await connections[fromId].setLocalDescription(d); socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: connections[fromId].localDescription })); } }
            if (signal.ice) await connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
        } catch (e) { console.log(e); }
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages(p => [...p, { sender, data }]);
        if (socketIdSender !== socketIdRef.current) setNewMessages(p => p + 1);
    };

    const createPeerConnection = (socketListId) => {
        if (connections[socketListId]) return connections[socketListId];
        const peer = new RTCPeerConnection(peerConfigConnections);
        peer.onicecandidate = (e) => { if (e.candidate) socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: e.candidate })); };
        peer.ontrack = (event) => {
            const remoteStream = event.streams[0]; if (!remoteStream) return;
            setVideos(prev => {
                const existing = prev.find(v => v.socketId === socketListId);
                const updated = existing ? prev.map(v => v.socketId === socketListId ? { ...v, stream: remoteStream } : v) : [...prev, { socketId: socketListId, stream: remoteStream, autoplay: true, playsInline: true }];
                videoRef.current = updated; return updated;
            });
        };
        if (window.localStream) window.localStream.getTracks().forEach(t => peer.addTrack(t, window.localStream));
        else { const f = createBlackSilenceStream(); attachLocalStream(f); f.getTracks().forEach(t => peer.addTrack(t, f)); }
        connections[socketListId] = peer; return peer;
    };

    const connectToSocketServer = () => {
        socketRef.current = io(server_url, { transports: ["websocket", "polling"] });
        socketRef.current.on("signal", gotMessageFromServer);
        socketRef.current.on("connect", () => { socketIdRef.current = socketRef.current.id; socketRef.current.emit("join-call", roomId); });
        socketRef.current.on("chat-message", addMessage);
        socketRef.current.on("user-left", (id) => { if (connections[id]) { connections[id].close(); delete connections[id]; } setVideos(p => p.filter(v => v.socketId !== id)); });
        socketRef.current.on("user-joined", async (id, clients) => {
            for (const sid of clients) { if (!connections[sid]) createPeerConnection(sid); }
            if (id === socketIdRef.current) { for (const id2 in connections) { if (id2 === socketIdRef.current) continue; try { const d = await connections[id2].createOffer(); await connections[id2].setLocalDescription(d); socketRef.current.emit("signal", id2, JSON.stringify({ sdp: connections[id2].localDescription })); } catch (e) { console.log(e); } } }
        });
    };

    const getMedia = () => { setVideo(videoAvailable); setAudio(audioAvailable); connectToSocketServer(); };
    const handleEndCall = () => { try { window.localStream?.getTracks().forEach(t => t.stop()); } catch (e) { console.log(e); } cleanupConnections(); navigate("/home"); };
    const sendMsg = () => { if (!message.trim() || !socketRef.current) return; socketRef.current.emit("chat-message", message, username); setMessage(""); };
    const connect = () => { if (!username.trim()) return; setAskForUsername(false); getMedia(); };

    /* ── Grid layout helper (Zoom-style) ── */
    const getGridStyle = (count) => {
        if (count === 0) return { gridTemplateColumns: '1fr' };
        if (count === 1) return { gridTemplateColumns: '1fr' };
        if (count === 2) return { gridTemplateColumns: '1fr 1fr' };
        if (count <= 4) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
        if (count <= 6) return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr' };
        return { gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr' };
    };

    const totalParticipants = videos.length + 1; // +1 for self

    /* ═══════════════════════════════════════════════════════════════
       INLINE STYLES
       ═══════════════════════════════════════════════════════════════ */
    const S = {
        // Control button
        ctrl: (active, danger) => ({
            width: 48, height: 48, borderRadius: 14, border: 'none',
            background: danger ? '#dc2626' : active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.08)',
            color: (!danger && !active) ? '#dc2626' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.18s', position: 'relative',
        }),
        ctrlLabel: { position: 'absolute', bottom: -18, fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, whiteSpace: 'nowrap' },
    };

    /* ═══════════════════════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════════════════════ */
    return (
        <div style={{ fontFamily: "'Manrope','Plus Jakarta Sans',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');
                .lobby-glow { animation: lobbyPulse 4s ease-in-out infinite alternate; }
                @keyframes lobbyPulse { 0% { opacity:0.4; transform:scale(1); } 100% { opacity:0.7; transform:scale(1.1); } }
                .lobby-input:focus { border-color: #fff !important; box-shadow: 0 0 0 4px rgba(255,255,255,0.06), 0 0 20px rgba(255,255,255,0.05) !important; }
                .ctrl-btn:hover { transform: scale(1.08); background: rgba(255,255,255,0.14) !important; }
                .ctrl-btn:active { transform: scale(0.95); }
                .chat-slide { animation: chatSlide 0.25s cubic-bezier(0.16,1,0.3,1); }
                @keyframes chatSlide { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
                .vid-tile { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
                .vid-tile:hover { z-index:2; box-shadow: 0 0 0 2px rgba(255,255,255,0.2); }
            `}</style>

            {askForUsername ? (
                /* ════════════════ LOBBY ════════════════ */
                <div style={{
                    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
                    background: '#0a0a0f', color: '#fff', overflow: 'hidden'
                }}>
                    {/* Ambient glows */}
                    <div className="lobby-glow" style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', top: -200, right: -100, pointerEvents: 'none' }} />
                    <div className="lobby-glow" style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%)', bottom: -100, left: -80, pointerEvents: 'none', animationDelay: '2s' }} />

                    {/* Top bar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 28px', height: 56, flexShrink: 0,
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)', zIndex: 20
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 10l4.553-2.07A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14" /><rect x="3" y="6" width="12" height="12" rx="2" />
                                </svg>
                            </div>
                            <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 900, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>Saki Call</span>
                        </div>

                        {/* Right side: Share + Back */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Share button with dropdown */}
                            <div ref={shareRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowShare(s => !s)}
                                    className="ctrl-btn share-3d-btn"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        background: showShare
                                            ? 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(168,85,247,0.35))'
                                            : 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.15))',
                                        border: showShare ? '1px solid rgba(168,85,247,0.55)' : '1px solid rgba(168,85,247,0.28)',
                                        color: '#fff', padding: '8px 20px', borderRadius: 14,
                                        fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
                                        fontFamily: "'Plus Jakarta Sans'", transition: 'all 0.2s',
                                        letterSpacing: '-0.01em',
                                        boxShadow: showShare
                                            ? '0 0 28px rgba(168,85,247,0.45), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)'
                                            : '0 2px 14px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)',
                                        backdropFilter: 'blur(12px)',
                                    }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                    </svg>
                                    Invite
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                        style={{ transform: showShare ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>

                                {showShare && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                                        width: 348,
                                        background: 'rgba(12,14,24,0.94)',
                                        backdropFilter: 'blur(32px)',
                                        border: '1px solid rgba(168,85,247,0.2)',
                                        borderRadius: 22,
                                        boxShadow: '0 36px 90px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.02), 0 0 60px rgba(99,102,241,0.08)',
                                        padding: '22px',
                                        animation: 'shareIn 0.25s cubic-bezier(0.16,1,0.3,1)',
                                        zIndex: 100,
                                        overflow: 'hidden',
                                    }}>
                                        <style>{`
                                            @keyframes shareIn { from { opacity:0; transform:translateY(-10px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
                                            .share-3d-btn:hover { transform: perspective(450px) rotateX(-5deg) rotateY(5deg) translateY(-3px) scale(1.05) !important; box-shadow: 0 0 36px rgba(168,85,247,0.55), 0 10px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.15) !important; border-color: rgba(168,85,247,0.7) !important; }
                                            .share-3d-btn:active { transform: scale(0.96) !important; }
                                            .s-copy-btn:hover { background: rgba(168,85,247,0.2) !important; border-color: rgba(168,85,247,0.45) !important; color: #c084fc !important; transform: scale(1.04); }
                                            .s-copy-btn:active { transform: scale(0.96); }
                                        `}</style>

                                        {/* Decorative glow orb */}
                                        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', top: -80, right: -50, pointerEvents: 'none' }} />
                                        {/* Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, position: 'relative' }}>
                                            <div style={{
                                                width: 42, height: 42, borderRadius: 13,
                                                background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.25))',
                                                border: '1px solid rgba(168,85,247,0.3)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 0 18px rgba(99,102,241,0.18)',
                                            }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(196,132,252,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.03em', backgroundImage: 'linear-gradient(135deg,#e0e7ff,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Invite People</div>
                                                <div style={{ fontSize: '0.71rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 2 }}>Share link or room code</div>
                                            </div>
                                        </div>

                                        {/* Room Link */}
                                        <div style={{ marginBottom: 12 }}>
                                            <div style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.28)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Meeting link</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px' }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                                                </svg>
                                                <span style={{ flex: 1, fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Manrope'" }}>{roomLink}</span>
                                                <button className="s-copy-btn" onClick={() => handleCopy(roomLink, 'link')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: copiedWhat === 'link' ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(255,255,255,0.1)', background: copiedWhat === 'link' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)', color: copiedWhat === 'link' ? '#34d399' : 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                                                    {copiedWhat === 'link' ? (<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>) : (<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> Copy</>)}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 14px' }}>
                                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.18)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>or use code</span>
                                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                                        </div>

                                        {/* Room Code — hero display */}
                                        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
                                            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.1))', border: '1px solid rgba(168,85,247,0.18)', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%)', pointerEvents: 'none', borderRadius: 16 }} />
                                                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.2))', border: '1px solid rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(196,132,252,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                                                    </svg>
                                                </div>
                                                <div style={{ flex: 1, position: 'relative' }}>
                                                    <div style={{ fontSize: '0.61rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Room Code</div>
                                                    <div style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.14em', backgroundImage: 'linear-gradient(135deg,#fff 40%,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{roomId}</div>
                                                </div>
                                                <button className="s-copy-btn" onClick={() => handleCopy(roomId, 'code')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, border: copiedWhat === 'code' ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(168,85,247,0.3)', background: copiedWhat === 'code' ? 'rgba(52,211,153,0.15)' : 'rgba(168,85,247,0.15)', color: copiedWhat === 'code' ? '#34d399' : '#c084fc', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", whiteSpace: 'nowrap', transition: 'all 0.15s', position: 'relative' }}>
                                                    {copiedWhat === 'code' ? (<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>) : (<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> Copy Code</>)}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info tip */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <span style={{ fontSize: '0.82rem' }}>💡</span>
                                            <span style={{ fontSize: '0.71rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.55, fontWeight: 500 }}>Guests log in first, then enter the code or open the link to join.</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => navigate('/home')} className="ctrl-btn" style={{
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                color: 'rgba(255,255,255,0.45)', padding: '8px 18px', borderRadius: 12,
                                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Manrope'",
                                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.18s',
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                Back
                            </button>
                        </div>
                    </div>

                    {/* Main */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 48px', gap: 56, overflow: 'hidden' }}>
                        {/* Camera preview */}
                        <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxHeight: '100%' }}>
                            <div style={{
                                width: '100%', maxWidth: 820, aspectRatio: '16/9',
                                borderRadius: 20, overflow: 'hidden',
                                background: '#111118', position: 'relative',
                                border: '1px solid rgba(255,255,255,0.06)',
                                boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px rgba(255,255,255,0.02)',
                            }}>
                                <video
                                    ref={(node) => { localVideoref.current = node; if (node && window.localStream) node.srcObject = window.localStream; }}
                                    autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }}
                                />
                                {!video && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111118', gap: 12 }}>
                                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
                                            {(username || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: 600 }}>Camera is off</span>
                                    </div>
                                )}
                                {/* Room badge */}
                                <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '6px 14px', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                                    {roomId}
                                </div>
                                {/* You badge */}
                                {video && <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>You</div>}
                            </div>

                            {/* Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '8px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                                <button className="ctrl-btn" onClick={() => setAudio(a => !a)} style={S.ctrl(audio, false)}>
                                    {audio ? <MicOn /> : <MicOff />}
                                    <span style={S.ctrlLabel}>{audio ? 'Mute' : 'Unmute'}</span>
                                </button>
                                <button className="ctrl-btn" onClick={() => setVideo(v => !v)} style={S.ctrl(video, false)}>
                                    {video ? <CamOn /> : <CamOff />}
                                    <span style={S.ctrlLabel}>{video ? 'Stop' : 'Start'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Join form */}
                        <div style={{ flex: '0 0 330px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <h1 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 10 }}>
                                    Ready to<br />join?
                                </h1>
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem', lineHeight: 1.65 }}>
                                    Enter your name below. Other participants will see this during the meeting.
                                </p>
                            </div>

                            {/* Room code */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0 }}>🔗</div>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Room code</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans'", letterSpacing: '0.05em' }}>{roomId}</div>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Display name</label>
                                <input className="lobby-input" type="text" placeholder="Your name..." value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && connect()}
                                    autoFocus
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '0.95rem', fontFamily: "'Manrope'", outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* Join */}
                            <button onClick={connect} className="ctrl-btn" style={{
                                width: '100%', padding: '14px 20px', borderRadius: 14, border: 'none',
                                background: !username.trim() ? 'rgba(255,255,255,0.06)' : '#fff',
                                color: !username.trim() ? 'rgba(255,255,255,0.2)' : '#0a0a0f',
                                fontSize: '0.95rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans'",
                                cursor: username.trim() ? 'pointer' : 'not-allowed',
                                boxShadow: username.trim() ? '0 8px 32px rgba(255,255,255,0.1)' : 'none',
                                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.07A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14" /><rect x="3" y="6" width="12" height="12" rx="2" /></svg>
                                Join now
                            </button>

                            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                                {[{ n: '🔒', t: 'Encrypted' }, { n: '⚡', t: 'HD quality' }, { n: '∞', t: 'No limits' }].map((b, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
                                        <span>{b.n}</span>{b.t}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ════════════════ MEETING VIEW ════════════════ */
                <div style={{
                    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
                    background: '#0a0a0f', color: '#fff', overflow: 'hidden',
                    fontFamily: "'Manrope','Plus Jakarta Sans',sans-serif"
                }}>
                    {/* Top info bar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 20px', height: 48, flexShrink: 0,
                        background: 'rgba(255,255,255,0.02)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth="2.5"><path d="M15 10l4.553-2.07A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14" /><rect x="3" y="6" width="12" height="12" rx="2" /></svg>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: "'Plus Jakarta Sans'" }}>Saki Call</span>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontWeight: 600, marginLeft: 8 }}>|</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600, marginLeft: 8 }}>{roomId}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.15)' }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399' }}>{totalParticipants} in call</span>
                            </div>
                        </div>
                    </div>

                    {/* Main area: grid + chat */}
                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        {/* Video grid */}
                        <div style={{
                            flex: 1, display: 'grid',
                            ...getGridStyle(totalParticipants),
                            gap: 6, padding: 6,
                            overflow: 'hidden'
                        }}>
                            {/* Self video tile (always first) */}
                            <div className="vid-tile" style={{
                                borderRadius: 14, overflow: 'hidden',
                                background: '#111118', position: 'relative',
                                border: '1px solid rgba(255,255,255,0.06)',
                                minHeight: 0
                            }}>
                                <video
                                    ref={(node) => { localVideoref.current = node; if (node && window.localStream) node.srcObject = window.localStream; }}
                                    autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }}
                                />
                                {!video && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111118', gap: 8 }}>
                                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                                            {username.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                )}
                                <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 6, padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    {!audio && <span style={{ color: '#f87171', fontSize: '0.6rem' }}>🔇</span>}
                                    {username} (You)
                                </div>
                            </div>

                            {/* Remote video tiles */}
                            {videos.map((v, i) => (
                                <div key={v.socketId} className="vid-tile" style={{
                                    borderRadius: 14, overflow: 'hidden',
                                    background: '#111118', position: 'relative',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    minHeight: 0
                                }}>
                                    <video
                                        data-socket={v.socketId}
                                        ref={(ref) => { if (ref && v.stream) ref.srcObject = v.stream; }}
                                        autoPlay playsInline
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 6, padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                                        Participant {i + 1}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chat panel */}
                        {showChat && (
                            <div className="chat-slide" style={{
                                width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
                                background: 'rgba(255,255,255,0.02)',
                                borderLeft: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: "'Plus Jakarta Sans'" }}>Chat</span>
                                    <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                                </div>
                                <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {messages.length === 0 && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', textAlign: 'center', marginTop: 40 }}>No messages yet</p>}
                                    {messages.map((m, i) => (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{m.sender}</span>
                                            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{m.data}</div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <input value={message} onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                                        placeholder="Type a message..."
                                        style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '0.82rem', fontFamily: "'Manrope'", outline: 'none', boxSizing: 'border-box' }}
                                    />
                                    <button onClick={sendMsg} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: message.trim() ? '#fff' : 'rgba(255,255,255,0.06)', color: message.trim() ? '#0a0a0f' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                                        <SendIco />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom controls */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '12px 20px', gap: 8, flexShrink: 0,
                        background: 'rgba(255,255,255,0.02)',
                        borderTop: '1px solid rgba(255,255,255,0.04)'
                    }}>
                        <button className="ctrl-btn" onClick={() => setAudio(a => !a)} style={{ ...S.ctrl(audio), background: audio ? 'rgba(255,255,255,0.06)' : 'rgba(220,38,38,0.15)' }}>
                            {audio ? <MicOn /> : <MicOff />}
                        </button>
                        <button className="ctrl-btn" onClick={() => setVideo(v => !v)} style={{ ...S.ctrl(video), background: video ? 'rgba(255,255,255,0.06)' : 'rgba(220,38,38,0.15)' }}>
                            {video ? <CamOn /> : <CamOff />}
                        </button>
                        {screenAvailable && (
                            <button className="ctrl-btn" onClick={() => setScreen(s => !s)} style={{ ...S.ctrl(!screen), background: screen ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)', color: screen ? '#34d399' : '#fff' }}>
                                <ScreenIco />
                            </button>
                        )}
                        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)', margin: '0 6px' }} />
                        <button className="ctrl-btn" onClick={() => { setShowChat(c => !c); if (!showChat) setNewMessages(0); }} style={{ ...S.ctrl(true), background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
                            <ChatIco />
                            {newMessages > 0 && <div style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#dc2626', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{newMessages}</div>}
                        </button>
                        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)', margin: '0 6px' }} />
                        <button className="ctrl-btn" onClick={handleEndCall} style={{ ...S.ctrl(true, true), width: 64, borderRadius: 14, background: '#dc2626' }}>
                            <EndCall />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}