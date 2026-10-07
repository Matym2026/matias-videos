const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const session = JSON.parse(localStorage.getItem("mv_session") || "null");
  const headers = { ...(options.headers || {}) };
  if (session) headers.Authorization = `Bearer ${session.token}`;
  const res = await fetch(API + path, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === "string" ? err.detail : "Ocurrió un error");
  }
  return res.status === 204 ? null : res.json();
}

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  register: (data) => request("/users", json("POST", data)),
  login: (data) => request("/login", json("POST", data)),
  user: (id) => request(`/users/${id}`),
  videos: (userId) => request(userId ? `/videos?user_id=${userId}` : "/videos"),
  video: (id) => request(`/videos/${id}`),
  related: (id) => request(`/videos/${id}/related`),
  createVideo: (formData) => request("/videos", { method: "POST", body: formData }),
  updateVideo: (id, data) => request(`/videos/${id}`, json("PUT", data)),
  deleteVideo: (id) => request(`/videos/${id}`, { method: "DELETE" }),
  comments: (id) => request(`/videos/${id}/comments`),
  addComment: (id, content) => request(`/videos/${id}/comments`, json("POST", { content })),
};