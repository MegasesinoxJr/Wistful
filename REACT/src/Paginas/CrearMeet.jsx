import { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

export default function CrearMeet() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDesc] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [maxP, setMaxP] = useState(5);
  const { ready, value, suggestions, setValue, clearSuggestions } = usePlacesAutocomplete();
  const [coords, setCoords] = useState(null);
  const [success, setSuccess] = useState('');

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: 'AIzaSyBR1j1rzVOBpHuNDfPuO65PoycVt02vuBU',
    libraries: ['places'],
  });

  const onSelectAddress = async (address) => {
    setValue(address, false);
    clearSuggestions();
    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setCoords({ lat, lng });
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/meets/', {
        titulo,
        descripcion,
        ubicacion: value,
        latitud: coords?.lat,
        longitud: coords?.lng,
        max_participantes: maxP,
        fecha,
        hora,
      });
      setSuccess('¡Meet creado exitosamente!');
      setTitulo('');
      setDesc('');
      setValue('');
      setCoords(null);
      setMaxP(5);
      setFecha('');
      setHora('');
    } catch (e) {
      console.error(e);

    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="mt-14 max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg space-y-6">
      <h2 className="text-2xl font-semibold text-center text-blue-600">Crear Meet (solo VIP)</h2>

      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Título</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título"
          required
          className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Descripción"
          className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
          min={minDate}
          className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Hora */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Hora</label>
        <input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          required
          className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Ubicación */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Ubicación</label>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder="Busca dirección"
          className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <ul className="mt-2">
          {suggestions.status === 'OK' &&
            suggestions.data.map((s) => (
              <li
                key={s.place_id}
                onClick={() => onSelectAddress(s.description)}
                className="cursor-pointer p-2 hover:bg-blue-100"
              >
                {s.description}
              </li>
            ))}
        </ul>
      </div>

      {/* Mapa */}
      <div className="mt-6 w-full max-w-4xl mx-auto">
        {isLoaded && coords && (
          <GoogleMap mapContainerStyle={mapContainerStyle} zoom={15} center={coords}>
            <Marker position={coords} />
          </GoogleMap>
        )}
      </div>

      {/* Máximo Participantes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Máximo de Participantes</label>
        <input
          type="number"
          min="1"
          value={maxP}
          onChange={(e) => setMaxP(e.target.value)}
          placeholder="Máx. participantes"
          className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Botón de Envío */}
      <button
        type="submit"
        className="w-full py-3 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none"
      >
        Crear Meet
      </button>

      {/* Mensaje de éxito */}
      {success && (
        <p
          className="mt-3 text-center text-green-600 bg-green-100 border border-green-400 rounded-md py-2 px-4 font-medium"
          role="alert"
        >
          {success}
        </p>
      )}
    </form>
  );
}
