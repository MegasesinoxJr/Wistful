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

  const [editando, setEditando] = useState(false);
  const [valoresEditados, setValoresEditados] = useState({
    titulo: "",
    descripcion: "",
    ubicacion: "",
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
  const [ubicacionEditada, setUbicacionEditada] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;
  const userRole = user?.role;

  useEffect(() => {
    const fetchMeet = async () => {
      try {
        const res = await axiosInstance.get(`/meets/${id}/`);
        setMeet(res.data);
        setValoresEditados({
          titulo: res.data.titulo,
          descripcion: res.data.descripcion,
          ubicacion: res.data.ubicacion,
        });
        setValue(res.data.ubicacion);
        setMapCoords({
          lat: res.data.latitud,
          lng: res.data.longitud,
        });
      } catch (e) {
        setError("No se pudo cargar la meet.");
      } finally {
        setLoading(false);
      }
    };
    fetchMeet();
  }, [id]);

  const puedeEditar =
    meet &&
    (userId === meet.creador.id ||
      ["admin", "root", "colaborador"].includes(userRole));

  const activarEdicion = () => {
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setValoresEditados({
      titulo: meet.titulo,
      descripcion: meet.descripcion,
      ubicacion: meet.ubicacion,
    });
    setValue(meet.ubicacion);
    setUbicacionEditada(false);
  };

  const guardarCambios = async () => {
    try {
      const payload = {
        titulo: valoresEditados.titulo,
        descripcion: valoresEditados.descripcion,
      };

      if (ubicacionEditada && mapCoords) {
        payload.ubicacion = value;
        payload.latitud = mapCoords.lat;
        payload.longitud = mapCoords.lng;
      }

      await axiosInstance.put(`/meets/${id}/editar/`, payload);
      const res = await axiosInstance.get(`/meets/${id}/`);
      setMeet(res.data);
      setEditando(false);
      setUbicacionEditada(false);
    } catch (e) {
      alert("Error al guardar los cambios.");
    }
  };

  const onSelectUbicacion = async (address) => {
    setValue(address, false);
    clearSuggestions();
    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setMapCoords({ lat, lng });
    setUbicacionEditada(true);
  };

  if (loading) return <p className="text-center text-xl">Cargando...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="relative max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg mt-12">
      {puedeEditar && !editando && (
        <button
          onClick={activarEdicion}
          className="absolute top-4 right-4 text-blue-600 hover:text-blue-800"
          title="Editar meet"
        >
          ✏️ Editar
        </button>
      )}

      {editando && (
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={guardarCambios}
            className="bg-green-500 text-white px-2 py-1 rounded"
          >
            Guardar
          </button>
          <button
            onClick={cancelarEdicion}
            className="bg-gray-400 text-white px-2 py-1 rounded"
          >
            Cancelar
          </button>
        </div>
      )}

      <h2 className="text-3xl font-bold text-center mb-4">
        {editando ? (
          <input
            value={valoresEditados.titulo}
            onChange={(e) =>
              setValoresEditados((prev) => ({
                ...prev,
                titulo: e.target.value,
              }))
            }
            className="border px-2 py-1 rounded w-full"
          />
        ) : (
          meet.titulo
        )}
      </h2>

      <div className="mb-4">
        <strong>Descripción:</strong>{" "}
        {editando ? (
          <textarea
            value={valoresEditados.descripcion}
            onChange={(e) =>
              setValoresEditados((prev) => ({
                ...prev,
                descripcion: e.target.value,
              }))
            }
            className="border px-2 py-1 rounded w-full"
          />
        ) : (
          <p>{meet.descripcion}</p>
        )}
      </div>

      <div className="mb-4">
        <strong>Ubicación:</strong>
        {editando ? (
          <div>
            <input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setUbicacionEditada(true);
              }}
              disabled={!ready}
              className="border px-2 py-1 rounded w-full"
            />
            <ul className="border rounded bg-white max-h-32 overflow-y-auto">
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
          </div>
        ) : (
          <p>{meet.ubicacion}</p>
        )}
      </div>

      <div className="text-gray-800 mb-4">
        <strong>Fecha:</strong> {meet.fecha}
      </div>
      <div className="text-gray-800 mb-4">
        <strong>Hora:</strong> {meet.hora}
      </div>

      <div className="text-gray-800 mb-4">
        <strong>Creador:</strong> {meet.creador.nombre}
        <img
          src={meet.creador.imagen_perfil}
          alt="Creador"
          className="w-16 h-16 rounded-full inline-block ml-2"
        />
      </div>

      {isLoaded && mapCoords && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCoords}
          zoom={15}
        >
          <Marker position={mapCoords} />
        </GoogleMap>
      )}
    </div>
  );
}
