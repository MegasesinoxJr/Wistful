import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";

export default function CrearCombatiente() {
  const [imagenFile, setImagenFile] = useState(null);
  const [habilidades, setHabilidades] = useState({
    habilidad_1: "",
    habilidad_2: "",
    habilidad_3: "",
    habilidad_4: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setImagenFile(e.target.files[0]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHabilidades((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imagenFile || Object.values(habilidades).some((v) => v.trim() === "")) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    const formData = new FormData();
    formData.append("imagen", imagenFile);
    Object.entries(habilidades).forEach(([key, value]) =>
      formData.append(key, value)
    );

    try {
      await axiosInstance.post("/combatiente/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/pvp");
    } catch (err) {
      console.error(err);
      setError("Error al crear el combatiente. Revisa la consola.");
    }
  };

  const puedePrevisualizar = imagenFile && Object.values(habilidades).every((v) => v.trim() !== "");

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-4">
      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-4"
        encType="multipart/form-data"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Crear tu Combatiente
        </h2>

        {error && (
          <p className="bg-red-100 text-red-800 p-3 rounded mb-6 text-center font-semibold">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="imagen">
            Imagen (PNG recomendado)
          </label>
          <input
            id="imagen"
            type="file"
            accept="image/png"
            onChange={handleFileChange}
            required
            className="w-full px-4 py-2 border rounded-lg bg-gray-50"
          />
        </div>

        {["habilidad_1", "habilidad_2", "habilidad_3", "habilidad_4"].map(
          (field, i) => (
            <div key={field} className="mb-4">
              <label className="block text-gray-700 mb-2">
                Habilidad {i + 1}
              </label>
              <input
                type="text"
                name={field}
                value={habilidades[field]}
                onChange={handleInputChange}
                placeholder={`Nombre habilidad ${i + 1}`}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )
        )}
      </form>

      {/* Previsualización */}
      {puedePrevisualizar && (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-4">
          <h3 className="text-xl font-bold mb-4 text-gray-700 text-center">
            Previsualización
          </h3>

          <div className="flex flex-col items-center">
            <img
              src={URL.createObjectURL(imagenFile)}
              alt="Preview"
              className="w-28 h-28 rounded-full shadow-md"
            />
            <div className="text-center font-semibold mt-2">Tu Combatiente</div>

            <div className="w-full max-w-xs bg-gray-300 h-4 rounded mt-4 overflow-hidden">
              <div className="bg-green-500 h-full" style={{ width: "100%" }} />
            </div>
            <div className="text-sm mt-1">Vida: 100</div>

            <div className="mt-4 grid grid-cols-2 gap-2 w-full">
              {Object.values(habilidades).map((hab, i) => (
                <div
                  key={i}
                  className="bg-blue-500 text-white rounded-lg py-2 text-center"
                >
                  {hab}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Botón debajo de la previsualización */}
      <button
        onClick={handleSubmit}
        className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
      >
        Crear Combatiente
      </button>
    </div>
  );
}
