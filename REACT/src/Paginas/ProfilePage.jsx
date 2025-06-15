import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { useUser } from "./UserContext";
import { SERVER_BASE_URL } from "../axiosInstancePublic";

export default function ProfilePage() {
  const { user, setUser } = useUser();

  const [profile, setProfile] = useState({
    nombre: "",
    email: "",
    imagen_perfil: "",
    insignias: [],  // Asegúrate de que 'insignias' sea siempre un array
  });

  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");

      try {
        // Llamada a la API para obtener el top de usuario
        const res = await axiosInstance.get(
          `profile/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfile(res.data);
        // Actualiza también el contexto y localStorage cuando cargues el perfil
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfile({ ...profile, imagen_perfil: file });

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    const formData = new FormData();
    formData.append("nombre", profile.nombre);
    formData.append("email", profile.email);
    if (profile.imagen_perfil instanceof File) {
      formData.append("imagen_perfil", profile.imagen_perfil);
    }

    try {
      // Obtener el token de localStorage
      const token = localStorage.getItem("access_token");

      // Realizamos la solicitud PUT para actualizar el perfil, incluyendo el token en los headers
      await axiosInstance.put("profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      // Después de guardar, obtenemos nuevamente el perfil actualizado
      const res2 = await axiosInstance.get(
        `profile/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedProfile = res2.data;

      setUser(updatedProfile);
      setProfile(updatedProfile);
      setSuccess("Perfil actualizado correctamente.");
    } catch (err) {
      console.error(err);
      setError("Hubo un error al actualizar el perfil.");
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="max-w-3xl mx-auto p-8 bg-white shadow-lg rounded-lg space-y-6">
      <h2 className="text-3xl font-semibold text-center text-blue-600">Editar Perfil</h2>

      <div className="space-y-4">
        <input
          type="text"
          name="nombre"
          value={profile.nombre}
          onChange={handleChange}
          placeholder="Nombre"
          required
          className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <input
          type="email"
          name="email"
          value={profile.email}
          onChange={handleChange}
          placeholder="Correo electrónico"
          required
          className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        {profile.imagen_perfil && typeof profile.imagen_perfil === "string" && (
          <img
            src={`${SERVER_BASE_URL}${profile.imagen_perfil}?${new Date().getTime()}`}
            alt="Imagen de perfil"
            className="mt-4 w-24 h-24 object-cover rounded-full mx-auto border-2 border-gray-300"
          />
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-200"
      >
        Guardar cambios
      </button>

      {success && <p className="text-center text-green-600 mt-4">{success}</p>}
      {error && <p className="text-center text-red-600 mt-4">{error}</p>}

      {/* Verificación de 'insignias' para evitar el error de longitud */}
      {Array.isArray(profile.insignias) && profile.insignias.length > 0 && (
        <div>
          <h3 className="text-2xl font-medium text-gray-800 mt-8 mb-4">Insignias</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {profile.insignias.map((ins) => (
              <div key={ins.formulario.id} className="text-center">
                <img
                  src={`${SERVER_BASE_URL}${ins.formulario.imagen}`}
                  alt={ins.formulario.nombre_insignia}
                  className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-gray-300"
                />
                <div className="mt-2 text-gray-700">{ins.formulario.nombre_insignia}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
