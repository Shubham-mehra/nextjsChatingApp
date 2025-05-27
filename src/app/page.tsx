"use client";

import React, { useState, useEffect } from "react";

import "./globals.css"; // or your relevant CSS file
import Chat from "./chat/page";

export default function Home() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [password, setPassword] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("chat_username");
    if (savedName) setUsername(savedName);
  }, []);

  useEffect(() => {
    if (username) localStorage.setItem("chat_username", username);
  }, [username]);

  const joinRoom = () => {
    if (username && room) {
      setJoined(true);
    }
  };

  return (
    <div className="App">
      {!joined ? (
        <div>
          <h2>Realtime Chat App</h2>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            type="text"
          />
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Room"
            type="text"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (optional)"
            type="password"
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <Chat username={username} password={password} room={room} />
      )}
    </div>
  );
}
