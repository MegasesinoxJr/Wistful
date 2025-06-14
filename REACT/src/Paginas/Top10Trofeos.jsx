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
      case 0: return 'bg-yellow-200';   // Oro
      case 1: return 'bg-gray-200';     // Plata
      case 2: return 'bg-[#cd7f32]';    // Bronce real
      default: return 'bg-blue-100';    // Resto
    }
  };

  const getShakeClass = (index) => {
    return index < 3 ? 'shake' : '';
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center animate-bounce">
        🏆 Top 10 Combatientes por Trofeos
      </h2>
      
      <div className="space-y-3">
        {list.map((c, i) => (
          <div
            key={c.id}
            className={`
              relative flex items-center justify-between p-4 rounded-xl shadow-md
              transition-all ${getBgClass(i)} ${getShakeClass(i)} slide-in-up
              ${i < 3 ? 'border-glow' : ''}
            `}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationFillMode: 'both',
            }}
          >
            <img
              src={c.imagen}
              alt={c.nombre}
              className="w-12 h-12 rounded-full object-cover"
            />
            <span className="flex-1 text-center font-medium">
              {c.nombre}
            </span>
            <span className="font-semibold">
              🏆 {c.trofeos}
            </span>
          </div>
        ))}
      </div>

      {/* Animaciones localizadas al componente */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        .shake {
          animation: shake 0.6s ease-in-out infinite;
        }

        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .slide-in-up {
          animation: slideInUp 0.6s ease-out both;
        }

        @keyframes borderFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        .border-glow {
          position: relative;
          z-index: 0;
          overflow: hidden;
        }

        .border-glow::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          background: linear-gradient(270deg, #f59e0b, #d97706, #b45309);
          background-size: 600% 600%;
          animation: borderFlow 2s linear infinite;
          z-index: -1;
          border-radius: 0.75rem;
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
      `}</style>
    </div>
  );
}
