import { useEffect, useState } from "react";
import { api } from "../api";
import VideoCard from "../components/videocard";

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.videos().then(setVideos).finally(() => setLoading(false));
  }, []);

  const shown = videos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <input className="search" placeholder="Buscar videos..." value={search}
             onChange={(e) => setSearch(e.target.value)} />
      {loading && <p className="muted">Cargando...</p>}
      {!loading && shown.length === 0 && <p className="muted">No hay videos todavía.</p>}
      <div className="grid">
        {shown.map((v) => <VideoCard key={v.id} video={v} />)}
      </div>
    </>
  );
}