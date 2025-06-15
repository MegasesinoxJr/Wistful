import { useState, useEffect } from "react";
import axios from "axios";
import axiosInstanceInsignias from "../axiosInstanceFormularios";
import { useNavigate } from "react-router-dom";

export default function CrearFormulario() {
  const [nombre, setNombre] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [respuestasNecesarias, setRespuestasNecesarias] = useState(1);
  const [imagen, setImagen] = useState(null);
  const [preguntas, setPreguntas] = useState([
    {
      texto: "",
      respuestas: [{ texto: "", es_correcta: true }],
    },
  ]);
  const [imagenPreview, setImagenPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (respuestasNecesarias > preguntas.length) {
      setRespuestasNecesarias(preguntas.length);
    }
  }, [preguntas]);

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
      es_correcta: i === rIndex,
    }));
    setPreguntas(copy);
  };

  const addPregunta = () =>
    setPreguntas([
      ...preguntas,
      { texto: "", respuestas: [{ texto: "", es_correcta: true }] },
    ]);

  const removePregunta = (pIndex) => {
    const copy = preguntas.filter((_, i) => i !== pIndex);
    setPreguntas(copy);
  };

  const addRespuesta = (pIndex) => {
    const copy = [...preguntas];
    copy[pIndex].respuestas.push({ texto: "", es_correcta: false });
    setPreguntas(copy);
  };

  const removeRespuesta = (pIndex, rIndex) => {
    const copy = [...preguntas];
    copy[pIndex].respuestas = copy[pIndex].respuestas.filter(
      (_, i) => i !== rIndex
    );
    setPreguntas(copy);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "image/png") {
      setImagen(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagenPreview(reader.result);
      reader.readAsDataURL(file);
    } else {

    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("titulo", titulo);
    formData.append("descripcion", descripcion);
    formData.append("respuestas_necesarias", respuestasNecesarias);
    formData.append("imagen", imagen);
    formData.append("preguntas", JSON.stringify(preguntas));

    try {
      await axiosInstanceInsignias.post("formularios/create/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/formularios");
    } catch (err) {
      console.error(err);

    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg"
    >
      <h2 className="text-3xl font-semibold text-center text-blue-600">
        Crear Formulario
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre de la Insignia
        </label>
        <input
          type="text"
          placeholder="Nombre de la Insignia"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="w-full p-3 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Título</label>
        <input
          type="text"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          className="w-full p-3 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          className="w-full p-3 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Respuestas necesarias
        </label>
        <input
          type="number"
          min={1}
          max={preguntas.length}
          value={respuestasNecesarias}
          onChange={(e) =>
            setRespuestasNecesarias(Math.min(+e.target.value, preguntas.length))
          }
          required
          className="w-full p-3 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
        />
        <p className="text-xs text-gray-500 mt-1">
          Máx: {preguntas.length} respuestas
        </p>
      </div>

      <div className="flex flex-col items-center">
        <label className="w-full block text-sm font-medium text-gray-700">
          Imagen (PNG)
        </label>
        <input
          type="file"
          accept="image/png"
          onChange={handleFileChange}
          required
          className="w-full p-3 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
        />
        {imagenPreview && (
          <img
            src={imagenPreview}
            alt="Vista previa"
            className="w-32 h-32 mt-2 rounded-lg"
          />
        )}
      </div>

      {preguntas.map((pregunta, pIndex) => (
        <div key={pIndex} className="border p-4 rounded-lg space-y-4">
          <input
            type="text"
            placeholder={`Pregunta ${pIndex + 1}`}
            value={pregunta.texto}
            onChange={(e) => handlePreguntaChange(pIndex, e.target.value)}
            required
            className="w-full border rounded px-2 py-1 focus:ring-2 focus:ring-blue-600"
          />
          {pregunta.respuestas.map((respuesta, rIndex) => (
            <div key={rIndex} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={`Respuesta ${rIndex + 1}`}
                value={respuesta.texto}
                onChange={(e) => handleRespuestaChange(pIndex, rIndex, e.target.value)}
                required
                className="flex-1 border rounded px-2 py-1 focus:ring-2 focus:ring-blue-600"
              />
              <input
                type="checkbox"
                checked={respuesta.es_correcta}
                onChange={() => toggleCorrecta(pIndex, rIndex)}
              />
              {pregunta.respuestas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRespuesta(pIndex, rIndex)}
                  className="text-red-600"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => addRespuesta(pIndex)}
              className="text-blue-600"
            >
              + Respuesta
            </button>
            {preguntas.length > 1 && (
              <button
                type="button"
                onClick={() => removePregunta(pIndex)}
                className="text-red-600"
              >
                - Pregunta
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPregunta}
        className="text-green-600"
      >
        + Pregunta
      </button>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
      >
        Crear
      </button>
    </form>
  );
}
