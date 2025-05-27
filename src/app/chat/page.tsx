"use client";
import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import io from "socket.io-client";
import type { EmojiClickData } from "emoji-picker-react";
import { timeAgo } from "@/utils/timeAgo";
import SendIcon from "@/assets/icons8-sent-24.png";
import MicButton from "@/component/MicButton";
import FileUploadButton from "@/component/fileUploadButton";

const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  { ssr: false }
);

const socket = io("http://localhost:8000");

interface ChatProps {
  username: string;
  room: string;
  password: string;
  avatar?: string;
}

interface MessageData {
  room: string;
  author: string;
  message: string | null;
  file: string | null;
  time: string;
  avatar?: string;
}

const Chat: React.FC<ChatProps> = ({ username, room, password, avatar }) => {
  const [message, setMessage] = useState<string>("");
  const [messageList, setMessageList] = useState<MessageData[]>([]);
  const [typing, setTyping] = useState<string>("");
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    socket.emit("join_room", { room, username, password, avatar }, (res: { error?: string }) => {
      if (res.error) alert(res.error);
    });

    socket.on("receive_message", (data: MessageData) => {
      setMessageList((prev) => [...prev, data]);
    });

    socket.on("show_typing", (user: string) => {
      if (user) {
        setTyping(`${user} is typing...`);
        if (typingTimeout) clearTimeout(typingTimeout);
        const timeout = setTimeout(() => setTyping(""), 1500);
        setTypingTimeout(timeout);
      } else {
        setTyping("");
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("show_typing");
    };
  }, [room, username, password, avatar]);

  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }, [messageList]);

  const sendMessage = async () => {
    setShowPicker(false); // Hide emoji picker when sending a message
    if (!message.trim() && !file) {
      alert("Please enter a message or select a file.");
      return;
    }

    let fileUrl: string | null = null;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await axios.post("http://localhost:8000/upload", formData);
        fileUrl = response.data.filePath;
        if (!fileUrl) {
          alert("File upload failed.");
          return;
        }
      } catch (error) {
        alert("Failed to upload file.");
        console.error(error);
        return;
      }
      setFile(null);
    }

    const messageData: MessageData = {
      room,
      author: username,
      message: message.trim() || (file ? "" : null),
      file: fileUrl,
      time: new Date().toISOString(),
      avatar,
    };

    if (!messageData.message && !messageData.file) {
      alert("Cannot send empty message.");
      return;
    }

    await socket.emit("send_message", messageData);
    setMessage("");
    if (typingTimeout) clearTimeout(typingTimeout);
    setTyping("");
  };

  

 

  const handleTyping = (e: ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setMessage(text);

    if (text.trim() !== "") {
      socket.emit("typing", { room, username });

      if (typingTimeout) clearTimeout(typingTimeout);
      const timeout = setTimeout(() => {
        socket.emit("typing", { room, username: "" });
      }, 1500);
      setTypingTimeout(timeout);
    } else {
      socket.emit("typing", { room, username: "" });
      if (typingTimeout) clearTimeout(typingTimeout);
    }
  };

  const isImage = (fileUrl: string | null) =>
    fileUrl && (fileUrl.endsWith(".jpg") || fileUrl.endsWith(".jpeg") || fileUrl.endsWith(".png") || fileUrl.endsWith(".gif"));

  const isAudio = (fileUrl: string | null) =>
    fileUrl && (fileUrl.endsWith(".webm") || fileUrl.endsWith(".mp3") || fileUrl.endsWith(".wav"));

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowPicker(false)
  };

  return (
    <div className="chat-window">
      <h2>Chat Room: {room}</h2>

      <div className="message-container" id="chat-container">
        {messageList.map((msg, idx) => (
          <div key={idx} className={`message ${msg.author === username ? "align-right" : "align-left flex flex-row-reverse"}`}>
            {msg.avatar ? (
              <img src={msg.avatar} alt="avatar" className="avatar-image" />
            ) : (
              <div className="avatar-circle">{msg.author[0].toUpperCase()}</div>
            )}

            <div>
              <div className={`message-content ${msg.author === username ? "my-message" : "other-message"}`}>
                {msg.message && <p>{msg.message}</p>}
                {msg.file &&
                  (isImage(msg.file) ? (
                    <img src={msg.file} alt="attachment" className="chat-image" />
                  ) : isAudio(msg.file) ? (
                    <audio controls src={msg.file}></audio>
                  ) : (
                    <a href={msg.file} target="_blank" rel="noreferrer" className="file-link">
                      📎 File
                    </a>
                  ))}
              </div>
              <div className="message-meta">
                <span>{msg.author}</span> • <span>{timeAgo(msg.time)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="typing-indicator">{typing}</div>
      <div className="input-container">
        <div className="input-with-icons">
          <button type="button" className="emoji-button" onClick={() => setShowPicker(!showPicker)}>
            😊
          </button>

          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <MicButton externalClass={"mic-button"}  room={room} username={username} avatar={avatar} />
          <FileUploadButton room={room} username={username} avatar={avatar} />
          <button type="button" onClick={sendMessage} disabled={!message.trim() && !file} className={`send-button ${!message.trim() && !file ? "disabled-button" : ""}`}>
            <img src={SendIcon.src} alt="Send" className="send-icon" width={24} height={24} />
          </button>
        </div>
      </div>

      {showPicker && <EmojiPicker onEmojiClick={onEmojiClick} />}
    </div>
  );
};

export default Chat;
// testing node module 
