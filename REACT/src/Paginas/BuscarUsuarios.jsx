import { useState } from "react";
import axiosInstance from "../axiosInstance";
import { useNavigate } from 'react-router-dom';
import { SERVER_BASE_URL } from "../axiosInstancePublic";

export default function BuscarUsuarios() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const buscar = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`usuarios/busqueda/?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 p-8 max-w-3xl mx-auto bg-white shadow-lg rounded-lg space-y-6">
      <h2 className="text-3xl font-semibold text-center text-blue-600">Buscar Usuarios</h2>

      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Nombre de usuario..."
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && q.trim()) {
              buscar();
            }
          }}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          onClick={buscar}
          disabled={loading || !q}
          className={`px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50`}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      <ul className="mt-6 space-y-4">
        {results.map(u => (
          <li
            key={u.id}
            onClick={() => navigate(`/buscarUsuarios/${u.id}`)}
            className="flex items-center space-x-4 cursor-pointer hover:bg-gray-100 p-3 rounded-lg transition duration-200"
          >
            <img
              src={`${SERVER_BASE_URL}${u.imagen_perfil}`}
              alt={u.nombre}
              className="w-10 h-10 rounded-full"
            />
            <span className="text-gray-800">{u.nombre}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
