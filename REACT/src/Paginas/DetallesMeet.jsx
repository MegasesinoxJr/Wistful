import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const mapContainerStyle = { width: "100%", height: "300px" };

export default function DetallesMeet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meet, setMeet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Estado único para controlar si estamos en edición de TODOS los campos
  const [editando, setEditando] = useState(false);

  // Estado para todos los valores editados
  const [valoresEditados, setValoresEditados] = useState({
    titulo: "",
    descripcion: "",
    ubicacion: "",
    latitud: null,
    longitud: null,
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBR1j1rzVOBpHuNDfPuO65PoycVt02vuBU",
    libraries: ["places"],
  });

  const {
    ready,
    value,
    suggestions,
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete();

  const [mapCoords, setMapCoords] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;
  const userRole = user?.role;

  useEffect(() => {
    const fetchMeet = async () => {
      try {
        const res = await axiosInstance.get(`/meets/${id}/`);
        setMeet(res.data);
        setMapCoords({
          lat: res.data.latitud,
          lng: res.data.longitud,
        });

        setValoresEditados({
          titulo: res.data.titulo,
          descripcion: res.data.descripcion,
          ubicacion: res.data.ubicacion,
          latitud: res.data.latitud,
          longitud: res.data.longitud,
        });

        setValue(res.data.ubicacion);
      } catch (e) {
        setError("No se pudo cargar la meet.");
      } finally {
        setLoading(false);
      }
    };
    fetchMeet();
  }, [id]);

  const puedeEliminar =
    meet &&
    (userId === meet.creador.id ||
      ["admin", "root", "colaborador"].includes(userRole));

  const puedeEditar = puedeEliminar;

  // Función para activar/desactivar edición completa
  const toggleEdicion = () => {
    if (editando) {
      // cancelar edición, resetear valores editados al meet original
      setValoresEditados({
        titulo: meet.titulo,
        descripcion: meet.descripcion,
        ubicacion: meet.ubicacion,
        latitud: meet.latitud,
        longitud: meet.longitud,
      });
      setValue(meet.ubicacion);
      setMapCoords({
        lat: meet.latitud,
        lng: meet.longitud,
      });
    }
    setEditando(!editando);
  };

  // Cuando se selecciona una ubicación nueva desde autocomplete
  const onSelectUbicacion = async (address) => {
    setValue(address, false);
    clearSuggestions();
    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setMapCoords({ lat, lng });

    setValoresEditados((prev) => ({
      ...prev,
      ubicacion: address,
      latitud: lat,
      longitud: lng,
    }));
  };

  const guardarCambios = async () => {
    try {
      const payload = {
        titulo: valoresEditados.titulo,
        descripcion: valoresEditados.descripcion,
        ubicacion: valoresEditados.ubicacion,
        latitud: valoresEditados.latitud,
        longitud: valoresEditados.longitud,
      };

      await axiosInstance.put(`/meets/${id}/editar/`, payload);

      // refrescar datos
      const res = await axiosInstance.get(`/meets/${id}/`);
      setMeet(res.data);
      setEditando(false);
    } catch (e) {
      alert("Error al guardar los cambios.");
    }
  };

  if (loading) return <p className="text-center text-xl">Cargando...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  const isFull = meet.asistentes.length >= meet.max_participantes;
  const hasJoined = meet.asistentes.some((a) => {
    const id = a.miembro?.id ?? a.id;
    return id?.toString() === userId?.toString();
  });

  const isCreator = userId?.toString() === meet.creador.id?.toString();

  return (
    <div className="relative max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg mt-12">
      {puedeEliminar && (
        <button
          onClick={async () => {
            if (!window.confirm("¿Estás seguro de que quieres eliminar esta meet?")) return;
            try {
              await axiosInstance.delete(`/meets/${id}/delete/`);
              alert("Meet eliminada correctamente.");
              navigate("/meets");
            } catch (e) {
              alert("Error al eliminar la meet.");
            }
          }}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center"
          title="Eliminar meet"
        >
          ✕
        </button>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">
          {editando ? (
            <input
              type="text"
              value={valoresEditados.titulo}
              onChange={(e) =>
                setValoresEditados((prev) => ({ ...prev, titulo: e.target.value }))
              }
              className="border px-2 py-1 rounded w-full"
            />
          ) : (
            meet.titulo
          )}
        </h2>

        {puedeEditar && (
          <button
            onClick={toggleEdicion}
            title={editando ? "Cancelar edición" : "Editar"}
            className="ml-4 text-xl"
          >
            {editando ? "❌" : "✏️"}
          </button>
        )}
      </div>

      <div className="mb-4">
        <strong>Descripción:</strong>
        {editando ? (
          <textarea
            value={valoresEditados.descripcion}
            onChange={(e) =>
              setValoresEditados((prev) => ({ ...prev, descripcion: e.target.value }))
            }
            className="border px-2 py-1 rounded w-full mt-1"
            rows={4}
          />
        ) : (
          <p className="mt-1">{meet.descripcion}</p>
        )}
      </div>

      <div className="mb-4">
        <strong>Ubicación:</strong>
        {editando ? (
          <>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!ready}
              placeholder="Busca ubicación"
              className="border px-2 py-1 rounded w-full mt-1"
            />
            <ul className="border rounded bg-white max-h-32 overflow-y-auto mt-1">
              {suggestions.status === "OK" &&
                suggestions.data.map((s) => (
                  <li
                    key={s.place_id}
                    onClick={() => onSelectUbicacion(s.description)}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                  >
                    {s.description}
                  </li>
                ))}
            </ul>
            {isLoaded && mapCoords && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCoords}
                zoom={15}
              >
                <Marker position={mapCoords} />
              </GoogleMap>
            )}
          </>
        ) : (
          <p className="mt-1">{meet.ubicacion}</p>
        )}
      </div>

      <div className="text-gray-800 mb-4">
        <strong>Fecha:</strong> {meet.fecha}
      </div>
      <div className="text-gray-800 mb-4">
        <strong>Hora:</strong> {meet.hora}
      </div>

      <div className="text-gray-800 mb-4">
        <strong>Creador de la meet:</strong> {meet.creador.nombre}
        <img
          src={meet.creador.imagen_perfil}
          alt="Creador"
          className="w-16 h-16 rounded-full inline-block ml-2"
        />
      </div>

      {isLoaded && mapCoords && !editando && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCoords}
          zoom={15}
        >
          <Marker position={mapCoords} />
        </GoogleMap>
      )}

      {editando && (
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={guardarCambios}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Guardar
          </button>
          <button
            onClick={toggleEdicion}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancelar
          </button>
        </div>
      )}

      <h3 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
        Asistentes ({meet.asistentes.length}/{meet.max_participantes})
      </h3>
      <div className="flex flex-wrap gap-4 mb-6">
        {meet.asistentes.map((u, index) => {
          const miembro = u.miembro || u;
          return (
            <div
              key={miembro.id || index}
              className="text-center flex flex-col items-center"
              style={{ width: "72px" }}
            >
              <img
                src={miembro.imagen_perfil}
                alt={miembro.nombre}
                className="w-16 h-16 rounded-full mb-2"
              />
              <div className="text-sm text-gray-800 truncate w-full">
                {miembro.nombre}
              </div>
            </div>
          );
        })}
      </div>

      {!hasJoined && !isFull && !isCreator && (
        <button
          onClick={async () => {
            setJoining(true);
            try {
              await axiosInstance.post(`/meets/${id}/asistir/`);
              const res = await axiosInstance.get(`/meets/${id}/`);
              setMeet(res.data);
            } catch (e) {
              alert("No pudiste apuntarte a la meet.");
            } finally {
              setJoining(false);
            }
          }}
          disabled={joining}
          className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
        >
          {joining ? "Apuntando..." : "Apuntarme"}
        </button>
      )}

      {hasJoined && (
        <button
          onClick={async () => {
            setLeaving(true);
            try {
              await axiosInstance.post(`/meets/${id}/desapuntarse/`);
              const res = await axiosInstance.get(`/meets/${id}/`);
              setMeet(res.data);
            } catch (e) {
              alert("No pudiste desapuntarte de la meet.");
            } finally {
              setLeaving(false);
            }
          }}
          disabled={leaving}
          className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 mt-4"
        >
          {leaving ? "Desapuntando..." : "Desapuntarme"}
        </button>
      )}

      {isFull && !hasJoined && (
        <p className="text-red-500 text-center mt-4">
          Esta meet está completa.
        </p>
      )}

      {hasJoined && (
        <p className="text-green-500 text-center mt-4">¡Ya estás apuntado!</p>
      )}
    </div>
  );
}
