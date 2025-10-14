// ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true);

  // Atualiza o <body> com base no tema
  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? '#121212' : '#f4f7fa';
    document.body.style.color = darkMode ? '#e0e0e0' : '#222';
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook customizado para facilitar o uso
export function useTheme() {
  return useContext(ThemeContext);
}
