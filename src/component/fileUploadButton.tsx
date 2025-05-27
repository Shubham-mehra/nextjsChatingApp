import React from "react";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:8000");

interface FileUploadButtonProps {
  room: string;
  username: string;
  avatar?: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ room, username, avatar }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

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

      socket.emit("send_message", messageData);
    } catch (err) {
      console.error("File upload failed:", err);
    }
  };

  return (
    <div className="file-upload-button">
      <label className="cursor-pointer p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-black shadow-md transition">
        📎
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
};

export default FileUploadButton;
