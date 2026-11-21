import React, { useEffect, useState } from "react";
import IndustrialChat from "./IndustrialChat";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function IndustrialPortal() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [userId, setUserId] = useState("");
  const [industryName, setIndustryName] = useState("IT / Software");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  async function loadRooms() {
    try {
      const res = await fetch(`${API_BASE}/api/industrial/rooms`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
        if (!selectedRoom && data.length > 0) {
          setSelectedRoom(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load industry rooms:", err);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  async function handleWorkingStudentJoin(e) {
    e.preventDefault();
    setStatusMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/industrial/working-students/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim() || null,
          industryName: industryName.trim(),
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
        }),
      });

      if (!res.ok) {
        setStatusMessage("Unable to join industry chat. Check inputs.");
        return;
      }

      const joined = await res.json();
      setStatusMessage(
        `Added to "${joined.industryName}" chat (${joined.memberCount} members).`
      );
      await loadRooms();
      setSelectedRoom({
        id: joined.roomId,
        industryKey: joined.industryKey,
        industryName: joined.industryName,
      });
    } catch (err) {
      setStatusMessage("Network error while joining industry chat.");
    }
  }

  return (
    <div className="industrial-portal-container">
      <h2>Industrial Portal (Separate Industry Workspace)</h2>

      <form onSubmit={handleWorkingStudentJoin} className="industrial-join-form">
        <h3>Working Student Registration &amp; Same-Industry Chat</h3>
        <input
          type="text"
          placeholder="Registered User UUID (optional)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Industry (e.g. IT / Software, Engineering)"
          value={industryName}
          onChange={(e) => setIndustryName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Role / Job Title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        />
        <button type="submit">Register &amp; Join Same-Industry Chat</button>
      </form>

      {statusMessage && <p className="industrial-status">{statusMessage}</p>}

      <div className="industrial-rooms-bar">
        <h4>Industry Channels:</h4>
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => setSelectedRoom(room)}
          >
            {room.industryName}
          </button>
        ))}
      </div>

      {selectedRoom && (
        <IndustrialChat
          room={selectedRoom}
          senderId={userId.trim() || null}
        />
      )}
    </div>
  );
}