import axiosInstanceInsignias from "../axiosInstanceFormularios";
import { SERVER_BASE_URL } from "../axiosInstancePublic";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../Paginas/UserContext"; // 👈 Importa el contexto

const ListarFormularios = () => {
  const [formularios, setFormularios] = useState([]);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formularioAEliminar, setFormularioAEliminar] = useState(null);
  const navigate = useNavigate();

  const { user } = useUser(); // 👈 Obtiene el usuario
  const canEdit = ["colaborador", "admin", "root"].includes(user?.role); // 👈 Control de roles

  const handleDelete = async (id) => {
    try {
      await axiosInstanceInsignias.delete(`formularios/${id}/delete`);
      setFormularios(formularios.filter(f => f.id !== id));
    } catch (err) {
      console.error("Error al eliminar:", err);
      setError("No se pudo eliminar el formulario.");
    } finally {
      setShowConfirmModal(false);
      setFormularioAEliminar(null);
    }
  };

  useEffect(() => {
    const fetchFormularios = async () => {
      try {
        const res = await axiosInstanceInsignias.get("formularios/");
        setFormularios(res.data);
      } catch (err) {
        console.error("Error fetching formularios:", err);
        setError("No se pudieron cargar los formularios.");
      }
    };

    fetchFormularios();
  }, []);

  return (
    <div className="container mx-auto p-4 pt-24">
      <h2 className="text-2xl font-semibold mb-4 text-center">Evento Insignias</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {formularios.map((formulario) => (
          <div
            key={formulario.id}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 relative"
          >
            <a
              href={`/insignias/formularios/${formulario.id}`}
              className="block text-blue-600 hover:text-blue-800 font-semibold text-lg mb-2 text-center mt-4"
            >
              {formulario.titulo}
            </a>

            <div className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-gray-300">
              <img
                src={`${SERVER_BASE_URL}${formulario.imagen}`}
                alt={formulario.titulo}
                className="w-full h-full object-cover"
              />
            </div>

            {canEdit && (
              <>
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-blue-600 text-lg"
                  onClick={() => navigate(`/insignias/editar/${formulario.id}`)}
                  title="Editar formulario"
                >
                  ✏️
                </button>
                <button
                  className="absolute top-2 right-10 text-gray-500 hover:text-red-600 text-lg"
                  onClick={() => {
                    setFormularioAEliminar(formulario.id);
                    setShowConfirmModal(true);
                  }}
                  title="Eliminar formulario"
                >
                  ❌
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <ConfirmModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => handleDelete(formularioAEliminar)}
      />
    </div>
  );
};

const ConfirmModal = ({ open, onClose, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">¿Estás seguro?</h3>
        <p className="text-sm text-gray-600 mb-6">Esta acción eliminará el formulario de forma permanente.</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListarFormularios;
