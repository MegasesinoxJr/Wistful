import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";

export default function ResetearPassword() {
  const { uid, token } = useParams();
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("reset-password/", { uid, token, new_password: password });
      setMensaje("Contraseña cambiada con éxito.");
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      setError("Token inválido o expirado.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Restablecer Contraseña</h2>

        {mensaje && <p className="text-green-600 mb-4 text-center">{mensaje}</p>}
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

        <label className="block text-gray-700 mb-2">Nueva contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-400"
        />

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg"
        >
          Cambiar contraseña
        </button>
      </form>
    </div>
  );
}
