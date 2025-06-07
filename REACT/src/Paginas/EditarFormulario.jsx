// src/components/EditarFormulario.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstanceInsignias from "../axiosInstanceFormularios";

const EditarFormulario = () => {
  const { formularioId } = useParams();
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    titulo: "",
    descripcion: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener los datos existentes
  useEffect(() => {
    const fetchFormulario = async () => {
      try {
        const response = await axiosInstanceInsignias.get(`${formularioId}/`);
        setFormulario({
          titulo: response.data.titulo,
          descripcion: response.data.descripcion,
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el formulario.");
        setLoading(false);
      }
    };

    fetchFormulario();
  }, [formularioId]);

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstanceInsignias.patch(`${formularioId}/`, formulario);
      alert("Formulario actualizado con éxito.");
      navigate("/formularios");
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el formulario.");
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Editar Formulario</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Título</label>
          <input
            type="text"
            name="titulo"
            value={formulario.titulo}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Descripción</label>
          <textarea
            name="descripcion"
            value={formulario.descripcion}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows={4}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Guardar Cambios
        </button>
      </form>
    </div>
  );
};

export default EditarFormulario;
