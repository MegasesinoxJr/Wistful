import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import TopUsuario from "./TopUsuario";
import { useUser } from "./UserContext";
import { SERVER_BASE_URL } from "../axiosInstancePublic";

export default function DetallesPerfil() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    axiosInstance
      .get(`usuarios/${userId}/`)
      .then((res) => {
        setProfile(res.data);
        setNewRole(res.data.role);
      })
      .catch((err) => console.error(err));
  }, [userId]);

  if (!profile) return <p className="text-center text-xl">Cargando perfil…</p>;

  // ¿Puede modificar roles?
  const canModify = ["admin", "root"].includes(currentUser?.role);

  // Opciones según rol del actor
  let roleOptions = [];
  if (currentUser?.role === "root") {
    roleOptions = ["admin", "colaborador", "vip", "miembro"];
  } else if (currentUser?.role === "admin") {
    roleOptions = ["colaborador", "vip", "miembro"];
  }

  const handleRoleChange = async () => {
    try {
      const res = await axiosInstance.put(
        `usuarios/${userId}/modificar-rol/`,
        { role: newRole }
      );
      setProfile(res.data);

    } catch (err) {
      console.error(err);

    }
  };

  return (
    <div className="mt-12 max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold text-center mb-6">
        Perfil de {profile.nombre}
      </h2>

      <div className="flex justify-center mb-4">
        <img
          src={`${SERVER_BASE_URL}${profile.imagen_perfil}`}
          alt={profile.nombre}
          className="w-24 h-24 rounded-full object-cover"
        />
      </div>

      <p className="text-lg text-gray-800 mb-4"><strong>Email:</strong> {profile.email}</p>
      <p className="text-lg text-gray-800 mb-4"><strong>Rol:</strong> {profile.role}</p>

      {canModify && (
        <div className="mt-6">
          <label className="block text-lg text-gray-700 mb-2">
            Modificar rol:
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="mt-2 p-2 border rounded-md w-full"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleRoleChange}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Guardar
          </button>
        </div>
      )}

      {profile.insignias.length > 0 && (
        <>
          <h3 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">Insignias</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {profile.insignias.map((ins) => (
              <div key={ins.formulario.id} className="text-center">
                <img
                  src={`${SERVER_BASE_URL}${ins.formulario.imagen}`}
                  alt={ins.formulario.nombre_insignia}
                  className="w-28 h-28 object-cover rounded-lg border-2 border-gray-300 cursor-pointer mb-2"
                  onClick={() => navigate(`/top-usuario/${userId}`)}
                />
                <div className="text-sm text-gray-700">{ins.formulario.nombre_insignia}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <TopUsuario userId={userId} />
    </div>
  );
}
