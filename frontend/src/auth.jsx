import { createContext, useContext, useState } from "react";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() =>
    JSON.parse(localStorage.getItem("mv_session") || "null")
  );

  function saveSession(data) {
    const s = { token: data.access_token, user: data.user };
    localStorage.setItem("mv_session", JSON.stringify(s));
    setSession(s);
  }

  function logout() {
    localStorage.removeItem("mv_session");
    setSession(null);
    window.location.hash = "#/login";
  }

  return (
    <AuthContext.Provider value={{ user: session?.user, saveSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}