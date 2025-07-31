import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, getCurrentUser } from "../utils/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  // Optional: redirect if already logged in
  React.useEffect(() => {
    if (getCurrentUser()) navigate("/");
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      loginUser({ username });
      navigate("/");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-2">Login</h2>
      <input
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="border px-2 py-1 block w-full mb-2"
        required
        placeholder="Username"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Login
      </button>
    </form>
  );
}
