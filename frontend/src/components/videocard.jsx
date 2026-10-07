import Avatar from "./avatar";

export default function VideoCard({ video }) {
  return (
    <a href={`#/watch/${video.id}`} className="card">
      <img src={video.thumbnail_url} alt={video.title} />
      <div className="card-info">
        <Avatar name={video.user_name} />
        <div>
          <h3>{video.title}</h3>
          <p>{video.user_name}</p>
          <p>{video.views} vistas · {new Date(video.created_at).toLocaleDateString("es-EC")}</p>
        </div>
      </div>
    </a>
  );
}