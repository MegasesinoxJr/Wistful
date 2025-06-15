import { useState } from "react";
import axiosInstancePublic from "../axiosInstancePublic";
import { useUser } from "./UserContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); 
  const { setUser } = useUser();
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstancePublic.post("login/", { email, password });

      localStorage.setItem("access_token", res.data.access);
      axiosInstancePublic.defaults.headers['Authorization'] = `Bearer ${res.data.access}`;
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);

      setErrorMessage(""); 
      navigate("/");
    } catch (err) {
      console.error("Login failed", err);
      setErrorMessage("Error al iniciar sesión. Verifica tu correo y contraseña.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={login} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Iniciar Sesión</h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {errorMessage && (
          <div className="mb-4 text-red-600 text-sm text-center">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Iniciar sesión
        </button>
        <p className="mt-4 text-center">
          <a href="/PasswordOlvidada" className="text-blue-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </p>
      </form>
    </div>
  );
}
