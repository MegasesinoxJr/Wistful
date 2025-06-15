import { useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';
import { Link } from 'react-router-dom';

export default function ListaMeets() {
  const [meets, setMeets] = useState([]);
  const [next, setNext] = useState(null);
  const [prev, setPrev] = useState(null);

  const [misMeets, setMisMeets] = useState([]);

  const fetchPage = async (url) => {
    const res = await axiosInstance.get(
      url ? url.replace(import.meta.env.VITE_SERVER_BASE_URL + "/api", "") : '/meets/'
    );
    setMeets(res.data.results);
    setNext(res.data.next);
    setPrev(res.data.previous);
  };

  const fetchMisMeets = async () => {
    try {
      const res = await axiosInstance.get('/meets/mis-meets/');
      setMisMeets(res.data);
    } catch (error) {
      console.error('Error al cargar mis meets', error);
    }
  };

  useEffect(() => {
    fetchPage();
    fetchMisMeets();
  }, []);

  return (
    <div className="min-h-screen mt-12 bg-gray-100 p-8">
      <h2 className="text-3xl font-bold text-center mb-8">Meets</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {meets.map((m) => (
          <div
            key={m.id}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer"
          >
            <h3 className="text-xl font-semibold text-blue-600 mb-3">{m.titulo}</h3>
            <p className="text-gray-700 mb-3">{m.descripcion}</p>
            <p className="text-gray-800 mb-2">
              <strong>Creador:</strong>{' '}
              <img
                src={m.creador.imagen_perfil}
                alt="Creador"
                className="w-16 h-16 rounded-full inline-block mr-2"
              />
              {m.creador.nombre}
            </p>
            <p className="text-gray-800 mb-2">
              <strong>Lugar:</strong> {m.ubicacion}
            </p>
            <p className="text-gray-800 mb-4">
              <strong>Asistentes:</strong> {m.asistentes.length} / {m.max_participantes}
            </p>
            <Link
              to={`/meets/${m.id}`}
              className="text-blue-500 hover:text-blue-700 font-semibold"
            >
              Ver detalle
            </Link>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={() => fetchPage(prev)}
          disabled={!prev}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-all"
        >
          Ant.
        </button>
        <button
          onClick={() => fetchPage(next)}
          disabled={!next}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-all"
        >
          Sig.
        </button>
      </div>


      <h2 className="text-3xl font-bold text-center mt-16 mb-8">Mis Meets</h2>

      {misMeets.length === 0 ? (
        <p className="text-center text-gray-600">No estás apuntado a ninguna meet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {misMeets.map((m) => (
            <div
              key={m.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-blue-600 mb-3">{m.titulo}</h3>
              <p className="text-gray-700 mb-3">{m.descripcion}</p>
              <p className="text-gray-800 mb-2">
                <strong>Creador:</strong>{' '}
                <img
                  src={m.creador.imagen_perfil}
                  alt="Creador"
                  className="w-16 h-16 rounded-full inline-block mr-2"
                />
                {m.creador.nombre}
              </p>
              <p className="text-gray-800 mb-2">
                <strong>Lugar:</strong> {m.ubicacion}
              </p>
              <p className="text-gray-800 mb-4">
                <strong>Asistentes:</strong> {m.asistentes.length} / {m.max_participantes}
              </p>
              <Link
                to={`/meets/${m.id}`}
                className="text-blue-500 hover:text-blue-700 font-semibold"
              >
                Ver detalle
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
