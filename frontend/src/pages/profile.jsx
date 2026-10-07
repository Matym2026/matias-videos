import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import Avatar from "../components/avatar";
import VideoCard from "../components/videocard";

export default function Profile({ id }) {
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [files, setFiles] = useState({ video: null, thumbnail: null });
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const isMine = Number(id) === me.id;
  const load = () => {
    api.user(id).then(setProfile);
    api.videos(id).then(setVideos);
  };
  useEffect(load, [id]);

  async function upload(e) {
    e.preventDefault();
    setMsg("");
    setUploading(true);
    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("video", files.video);
      data.append("thumbnail", files.thumbnail);
      await api.createVideo(data);
      setForm({ title: "", description: "" });
      e.target.reset();
      setMsg("¡Video publicado!");
      load();
    } catch (err) {
      setMsg(err.message);
    }
    setUploading(false);
  }

  async function edit(v) {
    const title = prompt("Nuevo título:", v.title);
    if (!title) return;
    const description = prompt("Nueva descripción:", v.description) ?? v.description;
    await api.updateVideo(v.id, { title, description });
    load();
  }

  async function remove(v) {
    if (!confirm(`¿Eliminar "${v.title}"?`)) return;
    await api.deleteVideo(v.id);
    load();
  }

  if (!profile) return <p className="muted">Cargando...</p>;

  return (
    <>
      <div className="profile-head">
        <Avatar name={profile.name} size={72} />
        <div>
          <h1>{profile.name}</h1>
          <p className="muted">{profile.email}</p>
          <p><strong>{profile.video_count}</strong> videos publicados</p>
        </div>
      </div>

      {isMine && (
        <form className="upload" onSubmit={upload}>
          <h2>Publicar video</h2>
          <input placeholder="Título" value={form.title}
                 onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea placeholder="Descripción" value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label>Video (MP4, máx. 100 MB)
            <input type="file" accept="video/mp4" required
                   onChange={(e) => setFiles({ ...files, video: e.target.files[0] })} />
          </label>
          <label>Miniatura (JPG o PNG)
            <input type="file" accept="image/png,image/jpeg" required
                   onChange={(e) => setFiles({ ...files, thumbnail: e.target.files[0] })} />
          </label>
          <button className="btn" disabled={uploading}>{uploading ? "Subiendo..." : "Publicar"}</button>
          {msg && <p className="muted">{msg}</p>}
        </form>
      )}

      <h2>Videos de {profile.name}</h2>
      <div className="grid">
        {videos.map((v) => (
          <div key={v.id}>
            <VideoCard video={v} />
            {(isMine || me.role === "master") && (
              <div className="actions">
                <button className="btn-ghost" onClick={() => edit(v)}>Editar</button>
                <button className="btn-danger" onClick={() => remove(v)}>Eliminar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}