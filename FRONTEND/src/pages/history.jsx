import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext)
    const [meetings, setMeetings] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('previous') // upcoming, previous, personal
    const [copiedId, setCopiedId] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser()
                // Sort by descending date
                const sorted = history.sort((a,b) => new Date(b.date) - new Date(a.date))
                setMeetings(sorted)
            } catch {
                // silent fail
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [])

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const today = new Date()
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
        if (isToday) return 'Today'
        const isYesterday = new Date(today.setDate(today.getDate()-1)).getDate() === date.getDate() && today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()
        if(isYesterday) return 'Yesterday'
        return date.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        })
    }

    const formatTime = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        })
    }

    const handleCopy = async (code) => {
        await navigator.clipboard?.writeText(code).catch(() => {})
        setCopiedId(code)
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <div className="z-platform">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                
                .z-platform {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background-color: #1a1c1e;
                    color: #ffffff;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                /* Top Navigation */
                .z-topbar {
                    height: 52px;
                    background-color: #121315;
                    border-bottom: 1px solid #2d2f34;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 20px;
                }

                .z-topbar-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .z-logo {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 1.05rem;
                    color: #fff;
                    text-decoration: none;
                }

                .z-logo-icon {
                    width: 28px;
                    height: 28px;
                    background: #2D8CFF;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .z-back-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    background: transparent;
                    border: none;
                    color: #a0a4ab;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .z-back-btn:hover { background: #2d2f34; color: #fff; }

                /* Main Layout */
                .z-main {
                    display: flex;
                    flex: 1;
                    height: calc(100vh - 52px);
                    overflow: hidden;
                }

                /* Sidebar */
                .z-sidebar {
                    width: 240px;
                    background-color: #1a1c1e;
                    border-right: 1px solid #2d2f34;
                    display: flex;
                    flex-direction: column;
                    padding: 16px 8px;
                    flex-shrink: 0;
                }

                .z-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    border-radius: 6px;
                    border: none;
                    background: transparent;
                    color: #a0a4ab;
                    font-family: inherit;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.15s ease;
                    margin-bottom: 4px;
                }
                .z-nav-item svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; overflow: visible; }
                
                .z-nav-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #e5e7eb;
                }

                .z-nav-item.active {
                    background: rgba(45, 140, 255, 0.15);
                    color: #2D8CFF;
                }

                /* Content Area */
                .z-content {
                    flex: 1;
                    background-color: #1a1c1e;
                    overflow-y: auto;
                    padding: 32px 48px;
                }

                .z-header {
                    margin-bottom: 24px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    border-bottom: 1px solid #2d2f34;
                    padding-bottom: 16px;
                }

                .z-header h1 {
                    font-size: 1.6rem;
                    font-weight: 600;
                    color: #fff;
                    letter-spacing: -0.01em;
                }
                
                .z-header-controls {
                    display: flex;
                    gap: 12px;
                }
                
                .z-btn-primary {
                    background: #2D8CFF;
                    color: #fff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .z-btn-primary:hover { background: #1a73e8; }

                /* Empty State */
                .z-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 50vh;
                    text-align: center;
                }
                .z-empty svg { width: 64px; height: 64px; color: #4b4d54; margin-bottom: 16px; }
                .z-empty h2 { font-size: 1.2rem; font-weight: 500; color: #e5e7eb; margin-bottom: 8px; }
                .z-empty p { font-size: 0.9rem; color: #a0a4ab; }

                /* List / Table styles */
                .z-list { display: flex; flex-direction: column; gap: 8px; }

                .z-card {
                    display: flex;
                    align-items: center;
                    padding: 16px 20px;
                    background-color: #22252a;
                    border: 1px solid #2d2f34;
                    border-radius: 8px;
                    transition: border-color 0.15s;
                }
                .z-card:hover {
                    border-color: #3f4249;
                }

                .z-card-time {
                    width: 140px;
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .z-card-time-main { font-size: 0.9rem; font-weight: 500; color: #e5e7eb; }
                .z-card-time-sub { font-size: 0.82rem; color: #82868d; }

                .z-card-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    border-left: 1px solid #3f4249;
                    padding-left: 20px;
                }
                
                .z-card-title {
                    font-size: 1.05rem;
                    font-weight: 500;
                    color: #fff;
                }
                
                .z-card-meta {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    font-size: 0.85rem;
                    color: #a0a4ab;
                }

                .z-id-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-family: monospace;
                    font-size: 0.9rem;
                    color: #e5e7eb;
                }

                .z-card-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .z-card:hover .z-card-actions { opacity: 1; }

                .z-btn-action {
                    padding: 6px 12px;
                    border-radius: 4px;
                    border: 1px solid transparent;
                    background: transparent;
                    color: #e5e7eb;
                    font-size: 0.82rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .z-btn-action:hover { background: #2d2f34; border-color: #3f4249; }
                
                .z-btn-action-primary {
                    background: rgba(45, 140, 255, 0.1);
                    color: #2D8CFF;
                    border-color: rgba(45, 140, 255, 0.2);
                }
                .z-btn-action-primary:hover {
                    background: rgba(45, 140, 255, 0.2);
                    border-color: rgba(45, 140, 255, 0.3);
                }

                /* Loader */
                .z-loader {
                    display: flex;
                    justify-content: center;
                    padding: 60px;
                }
                .z-spinner {
                    width: 28px;
                    height: 28px;
                    border: 3px solid rgba(45, 140, 255, 0.2);
                    border-top-color: #2D8CFF;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Responsive */
                @media (max-width: 768px) {
                    .z-main { flex-direction: column; }
                    .z-sidebar { width: 100%; flex-direction: row; border-right: none; border-bottom: 1px solid #2d2f34; padding: 8px; overflow-x: auto; }
                    .z-nav-item { white-space: nowrap; }
                    .z-content { padding: 20px; }
                    .z-card { flex-direction: column; align-items: flex-start; gap: 12px; }
                    .z-card-info { border-left: none; padding-left: 0; }
                    .z-card-actions { opacity: 1; width: 100%; justify-content: flex-end; border-top: 1px solid #2d2f34; padding-top: 12px; margin-top: 8px; }
                }
            `}</style>

            <header className="z-topbar">
                <div className="z-topbar-left">
                    <button className="z-back-btn" onClick={() => navigate('/home')} title="Back to Home">
                        <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <div className="z-logo">
                        <div className="z-logo-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M15 10l4.553-2.07A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                        </div>
                        Saki Call
                    </div>
                </div>
            </header>

            <main className="z-main">
                <aside className="z-sidebar">
                    <button className={`z-nav-item ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Upcoming
                    </button>
                    <button className={`z-nav-item ${activeTab === 'previous' ? 'active' : ''}`} onClick={() => setActiveTab('previous')}>
                        <svg viewBox="0 0 24 24"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/></svg>
                        Previous
                    </button>
                    <button className={`z-nav-item ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
                        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Personal Room
                    </button>
                </aside>

                <section className="z-content">
                    <div className="z-header">
                        <h1>{activeTab === 'upcoming' ? 'Upcoming Meetings' : activeTab === 'previous' ? 'Previous Meetings' : 'Personal Meeting Room'}</h1>
                        <div className="z-header-controls">
                            {activeTab === 'personal' && (
                                <button className="z-btn-primary" onClick={() => navigate('/home')}>Start New Meeting</button>
                            )}
                        </div>
                    </div>

                    {activeTab === 'upcoming' && (
                        <div className="z-empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <h2>No upcoming meetings</h2>
                            <p>You have no scheduled meetings at this time.</p>
                        </div>
                    )}

                    {activeTab === 'personal' && (
                        <div className="z-empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            <h2>Your Personal Meeting Space</h2>
                            <p>Share your default room link for instant meetings without generating a new code.</p>
                        </div>
                    )}

                    {activeTab === 'previous' && (
                        loading ? (
                            <div className="z-loader"><div className="z-spinner"></div></div>
                        ) : meetings.length === 0 ? (
                            <div className="z-empty">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/></svg>
                                <h2>No previous meetings</h2>
                                <p>You haven't joined or hosted any meetings yet.</p>
                            </div>
                        ) : (
                            <div className="z-list">
                                {meetings.map((m, i) => (
                                    <div key={i} className="z-card">
                                        <div className="z-card-time">
                                            <span className="z-card-time-main">{formatDate(m.date)}</span>
                                            {m.date && <span className="z-card-time-sub">{formatTime(m.date)}</span>}
                                        </div>
                                        <div className="z-card-info">
                                            <span className="z-card-title">Meeting Session {m.meetingCode}</span>
                                            <div className="z-card-meta">
                                                <span>Meeting ID:</span>
                                                <span className="z-id-chip">{m.meetingCode}</span>
                                            </div>
                                        </div>
                                        <div className="z-card-actions">
                                            <button className="z-btn-action" onClick={() => handleCopy(m.meetingCode)}>
                                                {copiedId === m.meetingCode ? 'Copied!' : 'Copy ID'}
                                            </button>
                                            <button className="z-btn-action z-btn-action-primary" onClick={() => navigate(`/room/${m.meetingCode}`)}>Rejoin</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                </section>
            </main>
        </div>
    )
}