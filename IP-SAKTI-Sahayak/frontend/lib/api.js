const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export async function sendChat(query, language = null, conversationId = null, searchPatents = true) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, language, conversation_id: conversationId, search_patents: searchPatents }),
  });
  if (!response.ok) throw new Error("Chat request failed");
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Upload failed");
  return response.json();
}

export async function analyzeDocument(documentId, question = null, language = "en") {
  const response = await fetch(`${API_BASE}/document/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question, language }),
  });
  if (!response.ok) throw new Error("Analysis failed");
  return response.json();
}

export async function getSources() {
  const response = await fetch(`${API_BASE}/sources`);
  if (!response.ok) throw new Error("Failed to fetch sources");
  return response.json();
}

export async function submitFeedback(messageId, rating, comment = null) {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message_id: messageId, rating, comment }),
  });
  if (!response.ok) throw new Error("Feedback submission failed");
  return response.json();
}

export async function getHealth() {
  const base = API_BASE.replace(/\/api\/?$/, "");
  const response = await fetch(`${base}/health`);
  if (!response.ok) throw new Error("Health check failed");
  return response.json();
}

// ---------------------------------------------------------------
// Digital Twin — Business Profile & Compliance Passport
// ---------------------------------------------------------------

export async function createProfile(profile) {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!response.ok) throw new Error("Failed to create profile");
  return response.json();
}

export async function updateProfile(profileId, profile) {
  const response = await fetch(`${API_BASE}/profile/${profileId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
}

export async function getProfile(profileId) {
  const response = await fetch(`${API_BASE}/profile/${profileId}`);
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}

export async function getPassport(profileId) {
  const response = await fetch(`${API_BASE}/profile/${profileId}/passport`);
  if (!response.ok) throw new Error("Failed to fetch passport");
  return response.json();
}

// ---------------------------------------------------------------
// TK Risk Indicator
// ---------------------------------------------------------------

export async function assessTKRisk(payload) {
  const response = await fetch(`${API_BASE}/tk-risk/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("TK risk assessment failed");
  return response.json();
}

// ---------------------------------------------------------------
// Regulation Impact Engine
// ---------------------------------------------------------------

export async function getRegulationImpact(profileId) {
  const url = profileId
    ? `${API_BASE}/regulations/impact?profile_id=${encodeURIComponent(profileId)}`
    : `${API_BASE}/regulations/impact`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch regulation impact");
  return response.json();
}

export async function getAllRegulations() {
  const response = await fetch(`${API_BASE}/regulations`);
  if (!response.ok) throw new Error("Failed to fetch regulations");
  return response.json();
}

// ---------------------------------------------------------------
// Compliance Calendar
// ---------------------------------------------------------------

export async function getCalendar(profileId) {
  const response = await fetch(`${API_BASE}/calendar?profile_id=${encodeURIComponent(profileId)}`);
  if (!response.ok) throw new Error("Failed to fetch calendar");
  return response.json();
}

export async function createCalendarEvent(payload) {
  const response = await fetch(`${API_BASE}/calendar/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create event");
  return response.json();
}

export async function updateEventStatus(eventId, status) {
  const response = await fetch(`${API_BASE}/calendar/event/${eventId}/status?status=${encodeURIComponent(status)}`, {
    method: "PATCH",
  });
  if (!response.ok) throw new Error("Failed to update event");
  return response.json();
}

export async function deleteCalendarEvent(eventId) {
  const response = await fetch(`${API_BASE}/calendar/event/${eventId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete event");
  return response.json();
}

// ---------------------------------------------------------------
// Expert Review Brief
// ---------------------------------------------------------------

export async function generateExpertBrief(payload) {
  const response = await fetch(`${API_BASE}/expert-brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to generate expert brief");
  return response.text();
}
