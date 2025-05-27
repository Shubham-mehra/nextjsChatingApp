import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:8000");

interface MicButtonProps {
  room: string;
  username: string;
  avatar?: string;
  externalClass?: string;
}

const MicButton: React.FC<MicButtonProps> = ({ room, username, avatar,externalClass }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "voice-message.webm");

        try {
          const response = await axios.post("http://localhost:8000/upload", formData);
          const fileUrl = response.data.filePath;

          const messageData = {
            room,
            author: username,
            message: null,
            file: fileUrl,
            time: new Date().toISOString(),
            avatar,
          };

          await socket.emit("send_message", messageData);
        } catch (err) {
          console.error("Failed to upload audio:", err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error("Microphone permission denied:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    stopTimer();
  };

  const startTimer = () => {
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <>
      <div className={`${externalClass} flex items-center gap-2`}>
        {isRecording && (
          <div className="flex items-center gap-1 text-red-500 font-semibold text-sm">
            <span className="animate-pulse h-2 w-2 rounded-full bg-red-500"></span>
            {formatTime(timer)}
          </div>
        )}

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-full ${
            isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-200 text-black"
          } transition duration-200`}
        >
          🎙️
        </button>
      </div>
    </>
  );
};

export default MicButton;
