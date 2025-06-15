import { useState } from "react";
import axiosInstancePublic from "../axiosInstancePublic"; // <-- el bueno

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    try {
      const response = await axiosInstancePublic.post("register/", formData);
      setSuccess("¡Registrado correctamente!");
      setFormData({ nombre: "", email: "", password: "" });
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;

      if (errors?.nombre?.length > 0) {
        setError(`Nombre: ${errors.nombre[0]}`);
      } else if (errors?.email?.length > 0) {
        setError(`Email: ${errors.email[0]}`);
      } else {
        setError("Error en el registro");
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold text-center mb-6">Registro de Usuario</h2>

        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          value={formData.nombre}
          onChange={handleChange}
          required
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Registrarse
        </button>

        {success && (
          <p className="text-green-600 text-center mt-4">{success}</p>
        )}
        {error && (
          <p className="text-red-600 text-center mt-4">{error}</p>
        )}
      </form>
    </div>
  );
}
