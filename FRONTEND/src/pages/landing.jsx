import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className='landingPageContainer'>
            {/* ── NAV ─────────────────────────────────────────────── */}
            <nav>
                <div className='navHeader'>
                    <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: 'linear-gradient(135deg,#1a6ef5,#7c4dff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginRight: 10, flexShrink: 0,
                        boxShadow: '0 4px 14px rgba(26,110,245,0.45)'
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 10l4.553-2.07A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14"/>
                            <rect x="3" y="6" width="12" height="12" rx="2"/>
                        </svg>
                    </div>
                    <h2>Saki Call</h2>
                </div>

                <div className='navlist'>
                    <p onClick={() => navigate('/auth')}>Features</p>
                    <p onClick={() => navigate('/auth')}>Join as Guest</p>
                    <p onClick={() => navigate('/auth')}>Register</p>
                    <div role='button' onClick={() => navigate('/auth')}>
                        <p>Login →</p>
                    </div>
                </div>
            </nav>

            {/* ── HERO ─────────────────────────────────────────────── */}
            <div className='landingMainContainer'>
                {/* Left */}
                <div>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '5px 14px', borderRadius: 999,
                        background: 'rgba(26,110,245,0.15)',
                        border: '1px solid rgba(26,110,245,0.3)',
                        color: '#60a5fa', fontSize: '0.72rem', fontWeight: 700,
                        letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 22,
                    }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#60a5fa', display: 'inline-block', animation: 'blink 2s infinite' }} />
                        HD Video · Zero Downloads
                    </div>

                    <h1>
                        <span style={{ color: '#fff' }}>Connect with</span>
                        <br />
                        <span style={{
                            background: 'linear-gradient(135deg,#60a5fa 0%,#a78bfa 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                        }}>anyone, anytime</span>
                    </h1>

                    <p>Crystal-clear video calls, real-time chat, and seamless screen sharing. No downloads, no friction — just connect.</p>

                    {/* Trust strip */}
                    <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:28, flexWrap:'wrap' }}>
                        {['🔒 End-to-end encrypted','📹 1080p HD quality','⏱ No time limits'].map((t,i) => (
                            <span key={i} style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.55)', fontSize:'0.78rem', fontWeight:600 }}>
                                {i > 0 && <span style={{ width:1, height:14, background:'rgba(255,255,255,0.15)', display:'inline-block' }} />}
                                {t}
                            </span>
                        ))}
                    </div>

                    <div role='button' onClick={() => navigate('/auth')}>
                        <p>Get Started Free</p>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </div>

                    {/* Social proof */}
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:24 }}>
                        <div style={{ display:'flex' }}>
                            {['#1a6ef5','#7c4dff','#00b8a9','#f5365c'].map((c,i) => (
                                <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:c, border:'2px solid rgba(13,21,38,0.8)', marginLeft: i===0?0:-8, zIndex:4-i }} />
                            ))}
                        </div>
                        <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.78rem', fontWeight:600 }}>
                            Trusted by <strong style={{ color:'rgba(255,255,255,0.85)' }}>10,000+</strong> users
                        </span>
                    </div>
                </div>

                {/* Right — mock video call UI */}
                <div>
                    <div style={{ position:'relative', width:'100%', maxWidth:460 }}>
                        <div style={{ background:'#1a1d2e', borderRadius:22, overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)', animation:'float 6s ease-in-out infinite' }}>
                            <div style={{ background:'#13151f', padding:'10px 14px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display:'flex', gap:5 }}>
                                    {['#ff5f57','#febc2e','#28c840'].map((c,i) => (
                                        <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:c }} />
                                    ))}
                                </div>
                                <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.68rem', fontWeight:600, flex:1, textAlign:'center', letterSpacing:'0.05em' }}>Team Standup · 4 participants</span>
                                <div style={{ background:'rgba(239,68,68,0.2)', color:'#f87171', fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:99, letterSpacing:'0.08em' }}>● LIVE</div>
                            </div>

                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, padding:3 }}>
                                {[
                                    { bg:'linear-gradient(135deg,#2d4a8a,#1a2f5c)', av:'linear-gradient(135deg,#2563eb,#7c3aed)', n:'Arjun S.', l:'A', host:true },
                                    { bg:'linear-gradient(135deg,#3d2a5c,#251740)', av:'linear-gradient(135deg,#ec4899,#f97316)', n:'Priya M.',  l:'P', host:false },
                                    { bg:'linear-gradient(135deg,#1e3a4a,#0f2030)', av:'linear-gradient(135deg,#10b981,#3b82f6)', n:'Rahul K.', l:'R', host:false },
                                    { bg:'linear-gradient(135deg,#3a2a1a,#201508)', av:'linear-gradient(135deg,#f59e0b,#ef4444)', n:'Sneha T.', l:'S', host:false },
                                ].map((p,i) => (
                                    <div key={i} style={{ background:p.bg, borderRadius:8, position:'relative', aspectRatio:'4/3', display:'flex', alignItems:'flex-end', padding:10, overflow:'hidden' }}>
                                        <div style={{ width:36, height:36, borderRadius:'50%', background:p.av, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:700, color:'#fff', position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-60%)' }}>{p.l}</div>
                                        <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.7)', fontWeight:600, zIndex:1 }}>{p.n}</span>
                                        {p.host && <span style={{ position:'absolute', top:8, right:8, background:'rgba(26,110,245,0.8)', color:'#fff', fontSize:'0.55rem', fontWeight:700, padding:'2px 6px', borderRadius:99 }}>HOST</span>}
                                    </div>
                                ))}
                            </div>

                            <div style={{ background:'#13151f', padding:'10px 16px', display:'flex', justifyContent:'center', gap:10, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                                {['🎤','📷','🖥️'].map((ic,i) => (
                                    <div key={i} style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', background:'rgba(255,255,255,0.08)' }}>{ic}</div>
                                ))}
                                <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', background:'rgba(239,68,68,0.3)' }}>📞</div>
                                {['💬','⋯'].map((ic,i) => (
                                    <div key={i} style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', background:'rgba(255,255,255,0.08)' }}>{ic}</div>
                                ))}
                            </div>
                        </div>

                        {/* Chips */}
                        <div style={{ position:'absolute', bottom:50, left:-28, background:'#fff', borderRadius:14, padding:'10px 14px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 24px rgba(15,23,41,0.14)', fontSize:'0.75rem', fontWeight:600, color:'#0f1729', border:'1px solid rgba(0,0,0,0.07)', whiteSpace:'nowrap', animation:'cf1 4s ease-in-out infinite' }}>
                            <div style={{ width:26, height:26, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(45,206,137,0.15)' }}>✅</div>
                            <div>
                                <div style={{ fontSize:'0.65rem', color:'#8a94a6', fontWeight:500 }}>Status</div>
                                <div>Connected · HD</div>
                            </div>
                        </div>

                        <div style={{ position:'absolute', top:24, right:-16, background:'#fff', borderRadius:14, padding:'10px 14px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 24px rgba(15,23,41,0.14)', fontSize:'0.75rem', fontWeight:600, color:'#0f1729', border:'1px solid rgba(0,0,0,0.07)', whiteSpace:'nowrap', animation:'cf2 5s ease-in-out infinite' }}>
                            <div style={{ width:26, height:26, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(26,110,245,0.1)' }}>🔒</div>
                            <div>
                                <div style={{ fontSize:'0.65rem', color:'#8a94a6', fontWeight:500 }}>Security</div>
                                <div>E2E Encrypted</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FEATURE STRIP ─────────────────────────────────────── */}
            <div style={{ display:'flex', justifyContent:'center', gap:0, padding:'2.5rem 3rem', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(13,21,38,0.6)', backdropFilter:'blur(12px)', flexWrap:'wrap', position:'relative', zIndex:5 }}>
                {[
                    { ico:'🎬', label:'Instant Meetings', desc:'One click to start' },
                    { ico:'🔗', label:'Share & Join',     desc:'Simple room codes' },
                    { ico:'💬', label:'Live Chat',        desc:'In-call messaging' },
                    { ico:'🖥️', label:'Screen Share',     desc:'Present anything'  },
                ].map((f,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'1rem 2.5rem', borderLeft: i>0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <span style={{ fontSize:'1.5rem' }}>{f.ico}</span>
                        <div>
                            <div style={{ fontWeight:700, fontSize:'0.88rem', color:'#fff', marginBottom:2 }}>{f.label}</div>
                            <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.45)' }}>{f.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}