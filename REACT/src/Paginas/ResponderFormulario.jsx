import { useState, useEffect } from "react";
import axiosInstanceInsignias from "../axiosInstanceFormularios";
import { useNavigate } from 'react-router-dom'; // Usamos useNavigate de React Router
import { useParams } from 'react-router-dom';

export default function ResponderFormulario() {
  const { id: formularioId } = useParams();
  const [formulario, setFormulario] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [aciertos, setAciertos] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Instanciamos useNavigate

  useEffect(() => {
    const fetchFormulario = async () => {
      try {
        const res = await axiosInstanceInsignias.get(`formularios/${formularioId}/`);
        setFormulario(res.data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el formulario.");
      }
    };

    fetchFormulario();
  }, [formularioId]);

  const handleRespuestaChange = (preguntaId, respuestaId) => {
    setRespuestas(prevRespuestas => {
      const newRespuestas = [...prevRespuestas];
      const index = newRespuestas.findIndex(r => r.pregunta === preguntaId);

      if (index !== -1) {
        newRespuestas[index] = { pregunta: preguntaId, respuesta: respuestaId };
      } else {
        newRespuestas.push({ pregunta: preguntaId, respuesta: respuestaId });
      }

      return newRespuestas;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    const respuestasIds = respuestas.map(r => r.respuesta);

    try {
      // Enviamos el array directamente en el body JSON
      const res = await axiosInstanceInsignias.post(
        `formularios/${formularioId}/responder/`,
        { respuestas: respuestasIds }
      );

      const { aciertos: aciertosCount, mensaje: mensajeRespuesta } = res.data;
      setAciertos(aciertosCount);
      setMensaje(mensajeRespuesta);

      if (aciertosCount >= formulario.respuestas_necesarias) {
        // Si el número de respuestas correctas es suficiente, redirigimos al perfil
        navigate("/profile");
      }
    } catch (err) {
      console.error(err);
      setError("Hubo un error al responder el formulario.");
    }
  };

  if (!formulario) {
    return <div className="text-center text-gray-700">Cargando formulario...</div>;
  }
  if (!formulario?.preguntas) {
    return <div className="text-center text-gray-700">Cargando preguntas...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-md rounded-lg mt-12">
      <h2 className="text-3xl font-semibold text-center text-blue-600 mb-6">{formulario.titulo}</h2>
      <p className="text-lg text-gray-700 text-center mb-6">{formulario.descripcion}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formulario.preguntas.map((pregunta) => (
          <div key={pregunta.id} className="space-y-4">
            <h3 className="text-xl font-medium text-gray-800">{pregunta.texto}</h3>
            <div className="space-y-2">
              {pregunta.respuestas.map((respuesta) => (
                <div key={respuesta.id} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`respuesta-${respuesta.id}`}
                    name={`pregunta-${pregunta.id}`}
                    value={respuesta.id}
                    onChange={() => handleRespuestaChange(pregunta.id, respuesta.id)}
                    checked={respuestas.some((r) => r.pregunta === pregunta.id && r.respuesta === respuesta.id)}
                    className="form-radio h-5 w-5 text-blue-600"
                  />
                  <label htmlFor={`respuesta-${respuesta.id}`} className="text-gray-700">
                    {respuesta.texto}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-center">
          <button
            type="submit"
            className="w-1/2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Enviar respuestas
          </button>
        </div>
      </form>

      {mensaje && <p className="text-center text-green-600 mt-6">{mensaje}</p>}
      {aciertos > 0 && <p className="text-center text-green-600 mt-2">Has acertado {aciertos} respuestas.</p>}
      {error && <p className="text-center text-red-600 mt-2">{error}</p>}
    </div>
  );
}
