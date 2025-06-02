import { useState } from "react";
import axiosInstance from "../axiosInstance";

export default function PasswordOlvidada() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("forgot-password/", { email });
      setMensaje("Revisa tu correo para continuar con el cambio de contraseña.");
      setError("");
    } catch {
      setError("Error al enviar el correo.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">¿Olvidaste tu contraseña?</h2>

        {mensaje && <p className="text-green-600 mb-4 text-center">{mensaje}</p>}
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

        <label className="block text-gray-700 mb-2">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-400"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
        >
          Enviar enlace
        </button>
      </form>
    </div>
  );
}
