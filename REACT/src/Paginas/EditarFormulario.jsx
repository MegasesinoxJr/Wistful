import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstanceInsignias from "../axiosInstanceFormularios";

export default function EditarFormulario() {
  const { formularioId } = useParams();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  // Ahora el valor máximo dependerá de preguntas.length
  const [respuestasNecesarias, setRespuestasNecesarias] = useState(1);
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [preguntas, setPreguntas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carga inicial de datos
  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axiosInstanceInsignias.get(`formularios/${formularioId}/`);
        setNombre(data.nombre_insignia);
        setTitulo(data.titulo);
        setDescripcion(data.descripcion);
        setRespuestasNecesarias(data.respuestas_necesarias);
        setPreguntas(
          data.preguntas.map(p => ({
            texto: p.texto,
            respuestas: p.respuestas.map(r => ({ id: r.id, texto: r.texto, es_correcta: r.es_correcta }))
          }))
        );
        setImagenPreview(data.imagen);
      } catch (e) {
        console.error(e);
        setError("Error al cargar el formulario.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [formularioId]);

  // Ajusta el estado de respuestasNecesarias al cambiar preguntas
  useEffect(() => {
    const max = preguntas.length;
    if (respuestasNecesarias > max) {
      setRespuestasNecesarias(max);
    }
  }, [preguntas]);

  // Manejo de cambios
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file && file.type === "image/png") {
      setImagen(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagenPreview(reader.result);
      reader.readAsDataURL(file);
    } else {

    }
  };

  const handlePreguntaChange = (index, value) => {
    const copy = [...preguntas];
    copy[index].texto = value;
    setPreguntas(copy);
  };

  const handleRespuestaChange = (pIndex, rIndex, value) => {
    const copy = [...preguntas];
    copy[pIndex].respuestas[rIndex].texto = value;
    setPreguntas(copy);
  };

  const toggleCorrecta = (pIndex, rIndex) => {
    const copy = [...preguntas];
    copy[pIndex].respuestas = copy[pIndex].respuestas.map((r, i) => ({
      ...r,
      es_correcta: i === rIndex
    }));
    setPreguntas(copy);
  };

  const addPregunta = () => setPreguntas([...preguntas, { texto: "", respuestas: [{ texto: "", es_correcta: true }] }]);
  const removePregunta = pIndex => {
    const copy = preguntas.filter((_, i) => i !== pIndex);
    setPreguntas(copy);
  };
  const addRespuesta = pIndex => {
    const copy = [...preguntas];
    copy[pIndex].respuestas.push({ texto: "", es_correcta: false });
    setPreguntas(copy);
  };
const removeRespuesta = (pIndex, rIndex) => {
  const copy = [...preguntas];

  copy[pIndex].respuestas = copy[pIndex].respuestas.filter((_, i) => i !== rIndex);
  setPreguntas(copy);
};

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("titulo", titulo);
      formData.append("descripcion", descripcion);
      formData.append("respuestas_necesarias", respuestasNecesarias);
      if (imagen) formData.append("imagen", imagen);
      formData.append("preguntas", JSON.stringify(preguntas));

      await axiosInstanceInsignias.patch(`formularios/${formularioId}/editar`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      navigate("/formularios");
    } catch (e) {
      console.error(e);

    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-semibold text-center text-blue-600">Editar Formulario</h2>

      {/* Nombre de Insignia */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre de la Insignia</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          className="w-full p-3 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Título</label>
        <input
          type="text"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          required
          className="w-full p-3 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          rows={3}
          className="w-full p-3 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Respuestas necesarias */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Respuestas necesarias</label>
        <input
          type="number"
          min={1}
          max={preguntas.length}
          value={respuestasNecesarias}
          onChange={e => setRespuestasNecesarias(Math.min(+e.target.value, preguntas.length))}
          required
          className="w-full p-3 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
        />
        <p className="text-xs text-gray-500 mt-1">Máx: {preguntas.length} respuestas</p>
      </div>

      {/* Imagen */}
      <div className="flex flex-col items-center">
        <label className="w-full block text-sm font-medium text-gray-700">Imagen (PNG)</label>
        <input
          type="file"
          accept="image/png"
          onChange={handleFileChange}
          className="w-full p-3 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
        />
        {imagenPreview && <img src={imagenPreview} alt="Preview" className="w-32 h-32 mt-2 rounded-lg" />}
      </div>

      {/* Preguntas y respuestas */}
      {preguntas.map((preg, pIndex) => (
        <div key={pIndex} className="border p-4 rounded-lg space-y-4">
          <input
            type="text"
            value={preg.texto}
            onChange={e => handlePreguntaChange(pIndex, e.target.value)}
            placeholder={`Pregunta ${pIndex + 1}`}
            required
            className="w-full border rounded px-2 py-1 focus:ring-2 focus:ring-blue-600"
          />
          {preg.respuestas.map((resp, rIndex) => (
            <div key={rIndex} className="flex items-center space-x-2">
              <input
                type="text"
                value={resp.texto}
                onChange={e => handleRespuestaChange(pIndex, rIndex, e.target.value)}
                placeholder={`Respuesta ${rIndex + 1}`}
                required
                className="flex-1 border rounded px-2 py-1 focus:ring-2 focus:ring-blue-600"
              />
              <input
                type="checkbox"
                checked={resp.es_correcta}
                onChange={() => toggleCorrecta(pIndex, rIndex)}
              />
              {preg.respuestas.length > 1 && (
                <button type="button" onClick={() => removeRespuesta(pIndex, rIndex)} className="text-red-600">
                  🗑️
                </button>
              )}
            </div>
          ))}
          <div className="flex space-x-2">
            <button type="button" onClick={() => addRespuesta(pIndex)} className="text-blue-600">
              + Respuesta
            </button>
            {preguntas.length > 1 && (
              <button type="button" onClick={() => removePregunta(pIndex)} className="text-red-600">
                - Pregunta
              </button>
            )}
          </div>
        </div>
      ))}
      <button type="button" onClick={addPregunta} className="text-green-600">
        + Pregunta
      </button>

      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
        Guardar Cambios
      </button>
    </form>
  );
}