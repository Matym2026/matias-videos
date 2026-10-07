import { useEffect, useState } from "react";
import { useAuth } from "./auth";
import Avatar from "./components/avatar";
import Auth from "./pages/auth";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import Profile from "./pages/Profile";

function useHash() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export default function App() {
  const { user, logout } = useAuth();
  const hash = useHash();
  const [, route, id] = hash.split("/");

  if (!user) return <Auth />;

  let page = <Home />;
  if (route === "watch") page = <Watch key={id} id={id} />;
  if (route === "profile") page = <Profile key={id} id={id || user.id} />;

  return (
    <>
      <header className="navbar">
        <a href="#/" className="brand">▶ Matías<span>Videos</span></a>
        <nav>
          <a href="#/">Inicio</a>
          <a href={`#/profile/${user.id}`} className="nav-user">
            <Avatar name={user.name} size={28} /> {user.name}
            {user.role === "master" && <em className="badge">MASTER</em>}
          </a>
          <button className="btn-ghost" onClick={logout}>Salir</button>
        </nav>
      </header>
      <main className="container">{page}</main>
    </>
  );
}