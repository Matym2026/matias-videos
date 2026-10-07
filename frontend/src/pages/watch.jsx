import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import Avatar from "../components/avatar";
import VideoCard from "../components/videocard";

export default function Watch({ id }) {
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.video(id).then(setVideo).catch((e) => setError(e.message));
    api.comments(id).then(setComments);
    api.related(id).then(setRelated);
  }, [id]);

  async function sendComment(e) {
    e.preventDefault();
    const c = await api.addComment(id, text);
    setComments([c, ...comments]);
    setText("");
  }

  async function edit() {
    const title = prompt("Nuevo título:", video.title);
    if (!title) return;
    const description = prompt("Nueva descripción:", video.description) ?? video.description;
    setVideo(await api.updateVideo(id, { title, description }));
  }

  async function remove() {
    if (!confirm("¿Eliminar este video?")) return;
    await api.deleteVideo(id);
    window.location.hash = "#/";
  }

  if (error) return <p className="error">{error}</p>;
  if (!video) return <p className="muted">Cargando...</p>;
  const canModify = user.id === video.user_id || user.role === "master";

  return (
    <div className="watch">
      <section>
        <video src={video.video_url} controls autoPlay />
        <h1>{video.title}</h1>
        <div className="row">
          <a href={`#/profile/${video.user_id}`} className="row">
            <Avatar name={video.user_name} /> <strong>{video.user_name}</strong>
          </a>
          <span className="muted">
            {video.views} vistas · {new Date(video.created_at).toLocaleDateString("es-EC")}
          </span>
          {canModify && (
            <span className="actions">
              <button className="btn-ghost" onClick={edit}>Editar</button>
              <button className="btn-danger" onClick={remove}>Eliminar</button>
            </span>
          )}
        </div>
        <p className="desc">{video.description || "Sin descripción."}</p>

        <h2>{comments.length} comentarios</h2>
        <form className="comment-form" onSubmit={sendComment}>
          <input placeholder="Escribe un comentario..." value={text}
                 onChange={(e) => setText(e.target.value)} required />
          <button className="btn">Comentar</button>
        </form>
        {comments.map((c) => (
          <div key={c.id} className="comment">
            <Avatar name={c.user_name} size={32} />
            <div>
              <strong>{c.user_name}</strong>
              <span className="muted"> · {new Date(c.created_at).toLocaleString("es-EC")}</span>
              <p>{c.content}</p>
            </div>
          </div>
        ))}
      </section>

      <aside>
        <h2>Recomendados</h2>
        {related.map((v) => <VideoCard key={v.id} video={v} />)}
      </aside>
    </div>
  );
}