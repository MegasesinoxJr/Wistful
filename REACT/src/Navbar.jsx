import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUser } from "./Paginas/UserContext";
import axiosInstance from "./axiosInstance";
import { SERVER_BASE_URL } from "./axiosInstancePublic";
import { enable as enableDarkMode, disable as disableDarkMode, isEnabled as isDarkReaderEnabled } from 'darkreader';

export const Navbar = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(isDarkReaderEnabled());

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/token/logout/');
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      delete axiosInstance.defaults.headers["Authorization"];
      setUser(null);
      navigate("/login");
    } catch { }
  };

  const toggleDarkMode = () => {
    if (isDarkReaderEnabled()) {
      disableDarkMode();
      setIsDarkMode(false);
    } else {
      enableDarkMode({
        brightness: 100,
        contrast: 90,
        sepia: 10,
      });
      setIsDarkMode(true);
    }
  };
  const role = user?.role;
  const isMember = role === "miembro";
  const isVip = role === "vip";
  const isAdmin = role === "admin";
  const isRoot = role === "root";
  const isCol = role === "colaborador";
  const emojiMap = { root: "👑", admin: "🤖", colaborador: "🌌", vip: "🌟", miembro: "🎓" };
  const roleEmoji = emojiMap[role] || "";

  const toggleSub = (menu) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  const closeMenu = () => {
    setMobileOpen(false);
    setOpenSubmenu(null);
  };

  const canMeet = isVip || isCol || isAdmin || isRoot;
  const canInsignia = !!user;
  const canCrearInsig = isAdmin || isRoot || isCol;
  const canCrearAnime = isAdmin || isRoot || isCol;

  return (
    <nav className="bg-gray-900 text-white fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* logo */}
          <NavLink to="/" className="text-2xl font-bold flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </NavLink>



          {/* menu de desktop */}
          <ul className="hidden lg:flex flex-1 justify-center items-center space-x-8">
            {user && (
              <li className="relative group">
                <button className="hover:bg-gray-800 px-3 py-2 rounded transition">
                  PvP
                </button>
                <ul className="absolute top-full left-1/2 transform -translate-x-1/2 mt-0 bg-gray-800 rounded shadow-lg hidden group-hover:block whitespace-nowrap">
                  <li>
                    <NavLink to="/pvp" className="block px-4 py-2 hover:bg-gray-700 transition">
                      PvP
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/PvP-top10" className="block px-4 py-2 hover:bg-gray-700 transition">
                      Top 10
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}


            {user && (
              <li className="relative group">
                <button className="hover:bg-gray-800 px-3 py-2 rounded transition">Meet</button>
                <ul className="absolute top-full left-1/2 transform -translate-x-1/2 mt-0 bg-gray-800 rounded shadow-lg hidden group-hover:block whitespace-nowrap">
                  <li><NavLink to="/listar-meets" className="block px-4 py-2 hover:bg-gray-700 transition">Lista Meets</NavLink></li>
                  {canMeet && (
                    <li><NavLink to="/crear-meet" className="block px-4 py-2 hover:bg-gray-700 transition">Crear Meet</NavLink></li>
                  )}
                </ul>
              </li>
            )}

            {canInsignia && (
              <li className="relative group">
                <button className="hover:bg-gray-800 px-3 py-2 rounded transition">Insignias</button>
                <ul className="absolute top-full left-1/2 transform -translate-x-1/2 mt-0 bg-gray-800 rounded shadow-lg hidden group-hover:block whitespace-nowrap">
                  <li><NavLink to="/formularios" className="block px-4 py-2 hover:bg-gray-700 transition">Obtener</NavLink></li>
                  {canCrearInsig && <li><NavLink to="/formulario/crearFormulario" className="block px-4 py-2 hover:bg-gray-700 transition">Crear</NavLink></li>}
                </ul>
              </li>
            )}


            <li className="relative group">
              <button className="hover:bg-gray-800 px-3 py-2 rounded transition">Anime</button>
              <ul className="absolute top-full left-1/2 transform -translate-x-1/2 mt-0 bg-gray-800 rounded shadow-lg hidden group-hover:block whitespace-nowrap">
                <li><NavLink to="/topAnimes" className="block px-4 py-2 hover:bg-gray-700 transition">Lista</NavLink></li>
                {user && <li><NavLink to={`/top-usuario/${user.id}`} className="block px-4 py-2 hover:bg-gray-700 transition">Mi Top</NavLink></li>}
                {canCrearAnime && <li><NavLink to="/crearAnime" className="block px-4 py-2 hover:bg-gray-700 transition">Crear</NavLink></li>}
              </ul>
            </li>

            {user && <li><NavLink to="/buscarUsuarios" className="hover:bg-gray-800 px-3 py-2 rounded transition">Buscar Usuarios</NavLink></li>}
            {!user ? (
              <>
                <li><NavLink to="/login" className="hover:bg-gray-800 px-3 py-2 rounded transition">Login</NavLink></li>
                <li><NavLink to="/register" className="hover:bg-gray-800 px-3 py-2 rounded transition">Register</NavLink></li>
                <li>
                  <button
                    onClick={toggleDarkMode}
                    className="hover:bg-gray-800 px-3 py-2 rounded transition"
                  >
                    {isDarkMode ? '☀️' : '🌙'}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/profile" className="px-3 py-2">
                    <img src={`${SERVER_BASE_URL}${user.imagen_perfil}?${new Date().getTime()}`} alt="Perfil" className="w-10 h-10 rounded-full object-cover hover:opacity-80" />
                  </Link>
                </li>
                {isMember && <li><NavLink to="/hazte-vip" className="hover:bg-yellow-400 px-3 py-2 rounded transition">Hazte VIP</NavLink></li>}
                <li className="px-3 py-2">{roleEmoji} {user.nombre}</li>
                <li>
                  <button
                    onClick={toggleDarkMode}
                    className="hover:bg-gray-800 px-3 py-2 rounded transition"
                  >
                    {isDarkMode ? '☀️' : '🌙'}
                  </button>
                </li>
                <li><button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm transition">Cerrar sesión</button></li>

              </>

            )}
          </ul>

          {/* menu hamburguesa */}
          <button className="lg:hidden p-2 rounded hover:bg-gray-700 transition" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* menu del movil */}
      <div className={`lg:hidden fixed inset-0 bg-black bg-opacity-75 z-40 ${mobileOpen ? "block" : "hidden"}`} onClick={closeMenu}>
        <div className="absolute top-4 right-4">
          <button onClick={closeMenu} className="text-white text-2xl">✕</button>
        </div>
        <div className="bg-gray-900 text-white w-full h-full pt-16 p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
          <ul className="space-y-4">
            {user && (
              <li>
                <button
                  onClick={() => toggleSub('pvp')}
                  className="w-full text-left px-2 py-1 hover:bg-gray-800 rounded transition flex justify-between items-center"
                >
                  PvP <span>{openSubmenu === 'pvp' ? '▲' : '▼'}</span>
                </button>
                {openSubmenu === 'pvp' && (
                  <ul className="pl-4 mt-2 space-y-2">
                    <li>
                      <NavLink
                        to="/pvp"
                        onClick={closeMenu}
                        className="block px-2 py-1 hover:bg-gray-800 rounded transition"
                      >
                        PvP
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/PvP-top10"
                        onClick={closeMenu}
                        className="block px-2 py-1 hover:bg-gray-800 rounded transition"
                      >
                        Top 10
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>
            )}


            {user && (
              <li>
                <button onClick={() => toggleSub('meet')} className="w-full text-left px-2 py-1 hover:bg-gray-800 rounded transition flex justify-between items-center">Meet <span>{openSubmenu === 'meet' ? '▲' : '▼'}</span></button>
                {openSubmenu === 'meet' && (
                  <ul className="pl-4 mt-2 space-y-2">
                    <li><NavLink to="/listar-meets" onClick={closeMenu} className="block px-2 py-1 hover:bg-gray-800 rounded transition">Lista Meets</NavLink></li>
                    {canMeet && (
                      <li><NavLink to="/crear-meet" onClick={closeMenu} className="block px-2 py-1 hover:bg-gray-800 rounded transition">Crear Meet</NavLink></li>
                    )}
                  </ul>
                )}
              </li>
            )}
            {canInsignia && (
              <li>
                <button onClick={() => toggleSub('insignias')} className="w-full text-left px-2 py-1 hover:bg-gray-800rounded transition flex justify-between items-center">Insignias <span>{openSubmenu === 'insignias' ? '▲' : '▼'}</span></button>
                {openSubmenu === 'insignias' && (
                  <ul className="pl-4 mt-2 space-y-2">
                    <li><NavLink to="/formularios" onClick={closeMenu} className="block px-2 py-1 hover:bg-gray-800rounded transition">Obtener</NavLink></li>
                    {canCrearInsig && <li><NavLink to="/formulario/crearFormulario" onClick={closeMenu} className="block px-2 py-1 hover:bg-gray-800rounded transition">Crear</NavLink></li>}
                  </ul>
                )}
              </li>
            )}


            <li>
              <button onClick={() => toggleSub('anime')} className="w-full text-left px-2 py-1 hover:bg-gray-800rounded transition flex justify-between items-center">Anime <span>{openSubmenu === 'anime' ? '▲' : '▼'}</span></button>
              {openSubmenu === 'anime' && (
                <ul className="pl-4 mt-2 space-y-2">
                  <li><NavLink to="/topAnimes" onClick={closeMenu} className="block px-2 py-1 hover:bg-gray-800rounded transition">Lista</NavLink></li>
                  {user && <li><NavLink to={`/top-usuario/${user.id}`} onClick={closeMenu} className="block px-2 py-1 hover:bg-gray-800rounded transition">Mi Top</NavLink></li>}
                  {canCrearAnime && <li><NavLink to="/crearAnime" onClick={closeMenu} className="block px-2 py-1 hover:bg-gray-800rounded transition">Crear</NavLink></li>}
                </ul>
              )}
            </li>

            {user && <li><NavLink to="/buscarUsuarios" onClick={closeMenu} className="block px-2 py-1 hover:bg-gray-800 rounded transition">Buscar Usuarios</NavLink></li>}
            {!user ? (
              <>
                <li><NavLink to="/login" onClick={closeMenu} className="block px-2 py-1 hover:bg-gray-800 rounded transition">Login</NavLink></li>
                <li><NavLink to="/register" onClick={closeMenu} className="block px-2 py-1 hover:bg-gray-800 rounded transition">Register</NavLink></li>
              </>
            ) : (
              <>
                <li><Link to="/profile" onClick={closeMenu} className="block px-2 py-1 rounded-full transition"><img src={`${SERVER_BASE_URL}${user.imagen_perfil}`} alt="Perfil" className="w-10 h-10rounded-full object-cover" /></Link></li>
                {isMember && <li><NavLink to="/hazte-vip" onClick={closeMenu} className="block px-2 py-1 hover:bg-yellow-400rounded transition">Hazte VIP</NavLink></li>}
                <li className="px-2 py-1">{roleEmoji} {user.nombre}</li>
                <li><button onClick={() => { handleLogout(); closeMenu(); }} className="w-full bg-red-600hover:bg-red-700 px-3 py-1 rounded text-sm transition">Cerrar sesión</button></li>
              </>
            )}
            <li>
              <button
                onClick={toggleDarkMode}
                className="hover:bg-gray-800 px-3 py-2 rounded transition"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav >
  );
};
