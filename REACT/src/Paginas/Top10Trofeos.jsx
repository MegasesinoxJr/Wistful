import { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';

export default function Top10Trofeos() {
  const [list, setList] = useState([]);

  useEffect(() => {
    axiosInstance.get('/top10-trofeos/')
      .then(res => setList(res.data))
      .catch(err => console.error(err));
  }, []);

  const getBgClass = (index) => {
    switch (index) {
      case 0: return 'bg-yellow-200'; // Oro
      case 1: return 'bg-gray-200';   // Plata
      case 2: return 'bg-[#cd7f32]';  // Bronce
      default: return 'bg-blue-100';  // Otros
    }
  };

  const isTop3 = (index) => index < 3;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center animate-bounce">
        🏆 Top 10 🏆
      </h2>

      <div className="space-y-4">
        {list.map((c, i) => (
          <div
            key={c.id}
            className={`
              relative flex items-center justify-between p-4 rounded-xl shadow-lg
              ${getBgClass(i)} slide-in-up
              ${isTop3(i) ? 'shake animated-border' : ''}
            `}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationFillMode: 'both',
            }}
          >
            <img
              src={c.imagen}
              alt={c.nombre}
              className="w-12 h-12 rounded-full object-cover"
            />
            <span className="flex-1 text-center font-medium">{c.nombre}</span>
            <span className="font-semibold">🏆 {c.trofeos}</span>
          </div>
        ))}
      </div>

      {/* Animaciones solo para este componente */}
      <style jsx>{`
        /* Entrada desde abajo */
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-in-up {
          animation: slideInUp 0.6s ease-out both;
        }

        /* Terremoto */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .shake {
          animation: shake 0.6s ease-in-out infinite;
        }

        /* Borde animado */
        .animated-border {
          position: relative;
          z-index: 0;
          overflow: hidden;
        }
        .animated-border::before {
          content: '';
          position: absolute;
          inset: -2px;
          z-index: -1;
          background: linear-gradient(270deg, #f59e0b, #b45309, #f59e0b);
          background-size: 600% 600%;
          animation: borderFlow 3s linear infinite;
          border-radius: 0.75rem;
          filter: blur(2px);
        }

        @keyframes borderFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
