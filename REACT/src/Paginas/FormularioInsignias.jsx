import { useState } from "react";
import axios from "axios";
import axiosInstanceInsignias from "../axiosInstanceFormularios";

export default function CrearFormulario() {
  const [nombre, setNombre] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [respuestasNecesarias, setRespuestasNecesarias] = useState(1);
  const [imagen, setImagen] = useState(null);
  const [preguntas, setPreguntas] = useState([
    {
      texto: "",
      respuestas: [{ texto: "", es_correcta: false }],
    },
  ]);
  const [imagenPreview, setImagenPreview] = useState(null); // Vista previa de la imagen

  // Manejar la carga de preguntas
  const handlePreguntaChange = (index, value) => {
    const newPreguntas = [...preguntas];
    newPreguntas[index].texto = value;
    setPreguntas(newPreguntas);
  };

  // Manejar la carga de respuestas
  const handleRespuestaChange = (pIndex, rIndex, value) => {
    const newPreguntas = [...preguntas];
    newPreguntas[pIndex].respuestas[rIndex].texto = value;
    setPreguntas(newPreguntas);
  };

  // Cambiar si una respuesta es correcta
  const toggleCorrecta = (pIndex, rIndex) => {
    const newPreguntas = [...preguntas];
    newPreguntas[pIndex].respuestas = newPreguntas[pIndex].respuestas.map((r, i) => ({
      ...r,
      es_correcta: i === rIndex,
    }));
    setPreguntas(newPreguntas);
  };

  // Añadir una pregunta
  const addPregunta = () => {
    setPreguntas([...preguntas, { texto: "", respuestas: [{ texto: "", es_correcta: false }] }]);
  };

  // Añadir una respuesta a una pregunta específica
  const addRespuesta = (pIndex) => {
    const newPreguntas = [...preguntas];
    newPreguntas[pIndex].respuestas.push({ texto: "", es_correcta: false });
    setPreguntas(newPreguntas);
  };

  // Eliminar una pregunta
  const removePregunta = (pIndex) => {
    const newPreguntas = preguntas.filter((_, index) => index !== pIndex);
    setPreguntas(newPreguntas);
  };

  // Eliminar una respuesta
  const removeRespuesta = (pIndex, rIndex) => {
    const newPreguntas = [...preguntas];
    newPreguntas[pIndex].respuestas = newPreguntas[pIndex].respuestas.filter((_, index) => index !== rIndex);
    setPreguntas(newPreguntas);
  };

  // Manejar el cambio de archivo de imagen
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "image/png") {
      setImagen(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagenPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      alert("La imagen debe ser un PNG");
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

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
      navigate("/formularios");  // <-- redirige aquí2
      alert("Formulario creado");
    } catch (err) {
      console.error(err);
      alert("Error al crear el formulario");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-semibold text-center text-blue-600">Crear Formulario</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre de la Insignia</label>
        <input
          type="text"
          placeholder="Nombre de la Insignia"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
          className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Respuestas necesarias</label>
        <input
          type="number"
          min={1}
          value={respuestasNecesarias}
          onChange={(e) => setRespuestasNecesarias(e.target.value)}
          required
          className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Imagen (PNG)</label>
        <input
          type="file"
          accept="image/png"
          onChange={handleFileChange}
          required
          className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        {imagenPreview && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700">Vista previa de la imagen</h3>
            <img src={imagenPreview} alt="Vista previa" className="w-32 h-32 object-cover mt-2 rounded-lg" />
          </div>
        )}
      </div>

      {preguntas.map((pregunta, pIndex) => (
        <div key={pIndex} className="border border-gray-300 p-4 rounded-lg mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">Pregunta {pIndex + 1}</label>
          <input
            type="text"
            placeholder={`Pregunta ${pIndex + 1}`}
            value={pregunta.texto}
            onChange={(e) => handlePreguntaChange(pIndex, e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {pregunta.respuestas.map((respuesta, rIndex) => (
            <div key={rIndex} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Respuesta {rIndex + 1}</label>
              <input
                type="text"
                placeholder={`Respuesta ${rIndex + 1}`}
                value={respuesta.texto}
                onChange={(e) => handleRespuestaChange(pIndex, rIndex, e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={respuesta.es_correcta}
                  onChange={() => toggleCorrecta(pIndex, rIndex)}
                  className="form-checkbox"
                />
                <span>Correcta</span>
              </label>
              {pregunta.respuestas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRespuesta(pIndex, rIndex)}
                  className="text-red-600 hover:text-red-800 mt-2"
                >
                  Eliminar Respuesta
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addRespuesta(pIndex)}
            className="px-4 py-2 mt-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none"
          >
            + Respuesta
          </button>
          {preguntas.length > 1 && (
            <button
              type="button"
              onClick={() => removePregunta(pIndex)}
              className="text-red-600 hover:text-red-800 mt-2"
            >
              Eliminar Pregunta
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addPregunta}
        className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none"
      >
        + Pregunta
      </button>

      <button
        type="submit"
        className="w-full mt-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none"
      >
        Crear
      </button>
    </form>
  );
}
