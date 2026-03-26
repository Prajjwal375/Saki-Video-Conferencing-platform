import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

import { Badge, IconButton, TextField, Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";

import styles from "../styles/videoComponent.module.css";
// import server from "../environment";

// Put your backend URL here if not importing from environment
const server_url = "http://localhost:8000";

const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

let connections = {};

export default function VideoMeetComponent() {
    const navigate = useNavigate();
    const { roomId } = useParams();

    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const localVideoref = useRef(null);
    const videoRef = useRef([]);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState(false);
    const [screen, setScreen] = useState(false);
    const [showModal, setModal] = useState(true);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        getPermissions();

        return () => {
            cleanupConnections();
        };
    }, []);

    useEffect(() => {
        if (video !== undefined && audio !== undefined && !askForUsername) {
            getUserMedia();
        }
    }, [video, audio, askForUsername]);

    useEffect(() => {
        if (screen !== undefined && !askForUsername) {
            if (screen) {
                getDisplayMedia();
            } else {
                getUserMedia();
            }
        }
    }, [screen, askForUsername]);

    const cleanupConnections = () => {
        try {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        } catch (e) {
            console.log(e);
        }

        try {
            Object.values(connections).forEach((peer) => {
                if (peer) peer.close();
            });
        } catch (e) {
            console.log(e);
        }

        connections = {};

        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach((track) => track.stop());
            }
        } catch (e) {
            console.log(e);
        }
    };

    const getPermissions = async () => {
        try {
            const videoStream = await navigator.mediaDevices
                .getUserMedia({ video: true })
                .catch(() => null);

            if (videoStream) {
                setVideoAvailable(true);
                videoStream.getTracks().forEach((track) => track.stop());
            } else {
                setVideoAvailable(false);
            }

            const audioStream = await navigator.mediaDevices
                .getUserMedia({ audio: true })
                .catch(() => null);

            if (audioStream) {
                setAudioAvailable(true);
                audioStream.getTracks().forEach((track) => track.stop());
            } else {
                setAudioAvailable(false);
            }

            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

            const userMediaStream = await navigator.mediaDevices
                .getUserMedia({
                    video: videoStream ? true : false,
                    audio: audioStream ? true : false,
                })
                .catch(() => null);

            if (userMediaStream) {
                window.localStream = userMediaStream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = userMediaStream;
                }
                setVideo(!!videoStream);
                setAudio(!!audioStream);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const silence = () => {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        const canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext("2d").fillRect(0, 0, width, height);
        const stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    const createBlackSilenceStream = () => {
        return new MediaStream([black(), silence()]);
    };

    const attachLocalStream = (stream) => {
        window.localStream = stream;
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }
    };

    const replaceTracksForPeers = async (stream) => {
        for (const id in connections) {
            if (id === socketIdRef.current) continue;

            const peer = connections[id];
            if (!peer) continue;

            const senders = peer.getSenders();

            stream.getTracks().forEach((track) => {
                const existingSender = senders.find(
                    (sender) => sender.track && sender.track.kind === track.kind
                );

                if (existingSender) {
                    existingSender.replaceTrack(track).catch((e) => console.log(e));
                } else {
                    peer.addTrack(track, stream);
                }
            });

            try {
                const description = await peer.createOffer();
                await peer.setLocalDescription(description);
                socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: peer.localDescription })
                );
            } catch (e) {
                console.log(e);
            }
        }
    };

    const getUserMediaSuccess = async (stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach((track) => track.stop());
            }
        } catch (e) {
            console.log(e);
        }

        attachLocalStream(stream);
        await replaceTracksForPeers(stream);

        stream.getTracks().forEach((track) => {
            track.onended = () => {
                setVideo(false);
                setAudio(false);

                const fallbackStream = createBlackSilenceStream();
                attachLocalStream(fallbackStream);
                replaceTracksForPeers(fallbackStream);
            };
        });
    };

    const getUserMedia = async () => {
        try {
            if ((video && videoAvailable) || (audio && audioAvailable)) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: video && videoAvailable,
                    audio: audio && audioAvailable,
                });
                await getUserMediaSuccess(stream);
            } else {
                const fallbackStream = createBlackSilenceStream();
                attachLocalStream(fallbackStream);
                await replaceTracksForPeers(fallbackStream);
            }
        } catch (e) {
            console.log(e);
        }
    };

    const getDisplayMediaSuccess = async (stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach((track) => track.stop());
            }
        } catch (e) {
            console.log(e);
        }

        attachLocalStream(stream);
        await replaceTracksForPeers(stream);

        stream.getTracks().forEach((track) => {
            track.onended = () => {
                setScreen(false);
                getUserMedia();
            };
        });
    };

    const getDisplayMedia = async () => {
        try {
            if (navigator.mediaDevices.getDisplayMedia) {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true,
                });
                await getDisplayMediaSuccess(stream);
            }
        } catch (e) {
            console.log(e);
        }
    };

    const gotMessageFromServer = async (fromId, message) => {
        const signal = JSON.parse(message);

        if (fromId === socketIdRef.current) return;
        if (!connections[fromId]) return;

        try {
            if (signal.sdp) {
                await connections[fromId].setRemoteDescription(
                    new RTCSessionDescription(signal.sdp)
                );

                if (signal.sdp.type === "offer") {
                    const description = await connections[fromId].createAnswer();
                    await connections[fromId].setLocalDescription(description);

                    socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({ sdp: connections[fromId].localDescription })
                    );
                }
            }

            if (signal.ice) {
                await connections[fromId].addIceCandidate(
                    new RTCIceCandidate(signal.ice)
                );
            }
        } catch (e) {
            console.log(e);
        }
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [...prevMessages, { sender, data }]);

        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    const createPeerConnection = (socketListId) => {
        if (connections[socketListId]) return connections[socketListId];

        const peer = new RTCPeerConnection(peerConfigConnections);

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit(
                    "signal",
                    socketListId,
                    JSON.stringify({ ice: event.candidate })
                );
            }
        };

        peer.ontrack = (event) => {
            const remoteStream = event.streams[0];
            if (!remoteStream) return;

            setVideos((prevVideos) => {
                const existing = prevVideos.find((v) => v.socketId === socketListId);

                let updatedVideos;
                if (existing) {
                    updatedVideos = prevVideos.map((v) =>
                        v.socketId === socketListId ? { ...v, stream: remoteStream } : v
                    );
                } else {
                    updatedVideos = [
                        ...prevVideos,
                        {
                            socketId: socketListId,
                            stream: remoteStream,
                            autoplay: true,
                            playsInline: true,
                        },
                    ];
                }

                videoRef.current = updatedVideos;
                return updatedVideos;
            });
        };

        if (window.localStream) {
            window.localStream.getTracks().forEach((track) => {
                peer.addTrack(track, window.localStream);
            });
        } else {
            const fallbackStream = createBlackSilenceStream();
            attachLocalStream(fallbackStream);
            fallbackStream.getTracks().forEach((track) => {
                peer.addTrack(track, fallbackStream);
            });
        }

        connections[socketListId] = peer;
        return peer;
    };

    const connectToSocketServer = () => {
        socketRef.current = io(server_url, {
            transports: ["websocket", "polling"],
        });

        socketRef.current.on("signal", gotMessageFromServer);

        socketRef.current.on("connect", () => {
            socketIdRef.current = socketRef.current.id;
            socketRef.current.emit("join-call", roomId);
        });

        socketRef.current.on("chat-message", addMessage);

        socketRef.current.on("user-left", (id) => {
            if (connections[id]) {
                connections[id].close();
                delete connections[id];
            }

            setVideos((prevVideos) =>
                prevVideos.filter((videoItem) => videoItem.socketId !== id)
            );
        });

        socketRef.current.on("user-joined", async (id, clients) => {
            for (const socketListId of clients) {
                if (!connections[socketListId]) {
                    createPeerConnection(socketListId);
                }
            }

            if (id === socketIdRef.current) {
                for (const id2 in connections) {
                    if (id2 === socketIdRef.current) continue;

                    try {
                        const description = await connections[id2].createOffer();
                        await connections[id2].setLocalDescription(description);

                        socketRef.current.emit(
                            "signal",
                            id2,
                            JSON.stringify({ sdp: connections[id2].localDescription })
                        );
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        });
    };

    const getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    const handleVideo = () => {
        setVideo((prev) => !prev);
    };

    const handleAudio = () => {
        setAudio((prev) => !prev);
    };

    const handleScreen = () => {
        setScreen((prev) => !prev);
    };

    const handleEndCall = () => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach((track) => track.stop());
            }
        } catch (e) {
            console.log(e);
        }

        cleanupConnections();
        navigate("/");
    };

    const sendMessage = () => {
        if (!message.trim()) return;
        if (!socketRef.current) return;

        socketRef.current.emit("chat-message", message, username);
        setMessage("");
    };

    const connect = () => {
        if (!username.trim()) return;
        setAskForUsername(false);
        getMedia();
    };

    return (
        <div>
            {askForUsername ? (
                <div>
                    <h2>Enter into Lobby</h2>
                    <TextField
                        id="outlined-basic"
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        variant="outlined"
                    />
                    <Button variant="contained" onClick={connect}>
                        Connect
                    </Button>

                    <div>
                        <video ref={localVideoref} autoPlay muted playsInline />
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>

                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? (
                                        messages.map((item, index) => (
                                            <div style={{ marginBottom: "20px" }} key={index}>
                                                <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                                <p>{item.data}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No Messages Yet</p>
                                    )}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        id="outlined-basic"
                                        label="Enter Your chat"
                                        variant="outlined"
                                    />
                                    <Button variant="contained" onClick={sendMessage}>
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>

                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable && (
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        )}

                        <Badge badgeContent={newMessages} max={999} color="warning">
                            <IconButton
                                onClick={() => {
                                    setModal((prev) => !prev);
                                    if (!showModal) setNewMessages(0);
                                }}
                                style={{ color: "white" }}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    <video
                        className={styles.meetUserVideo}
                        ref={localVideoref}
                        autoPlay
                        muted
                        playsInline
                    />

                    <div className={styles.conferenceView}>
                        {videos.map((videoItem) => (
                            <div key={videoItem.socketId}>
                                <video
                                    data-socket={videoItem.socketId}
                                    ref={(ref) => {
                                        if (ref && videoItem.stream) {
                                            ref.srcObject = videoItem.stream;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}