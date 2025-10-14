import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './App.module.css';
import { useTheme } from './ThemeContext.jsx';

function App() {
  const API_KEY = "8mX7gZlFBm0bJ7jjhjg8atBpr5eGql72xYvIMpT4";
  const { darkMode, toggleTheme } = useTheme();

  const [spots, setSpots] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [spotData, setSpotData] = useState(null);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [loadingSpotData, setLoadingSpotData] = useState(false);

  useEffect(() => {
    const getSpots = async () => {
      try {
        setLoadingSpots(true);
        setSpots(null);
        const response = await axios.get("https://api.iotebe.com/v2/spot", {
          headers: {
            "x-api-key": API_KEY,
          },
        });
        setSpots(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSpots(false);
      }
    };

    getSpots();
  }, []);

  useEffect(() => {
    const getSpotData = async () => {
      try {
        setLoadingSpotData(true);
        setSpotData(null);
        const response = await axios.get(
          `https://api.iotebe.com/v2/spot/${selectedSpotId}/ng1vt/global_data/data`,
          {
            headers: {
              "x-api-key": API_KEY,
            },
          }
        );
        setSpotData(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSpotData(false);
      }
    };

    if (selectedSpotId) {
      getSpotData();
    }
  }, [selectedSpotId]);

  const lastSpotData = spotData ? spotData[0] : null;

  return (
    <div className={`${styles.app} ${darkMode ? styles.dark : styles.light}`}>
      {/* Botão de tema no canto superior direito */}
      <div className={styles.themeToggle}>
        <button className={styles.themeButton} onClick={toggleTheme}>
          {darkMode ? '🌞' : '🌙'}
        </button>
      </div>

      <h1 className={styles.title}>Ponto de Coleta</h1>

      {loadingSpots && <p className={styles.loading}>Carregando pontos...</p>}

      {spots && (
        <div className={styles.selectContainer}>
          <select
            name="spot"
            onChange={(e) => setSelectedSpotId(e.target.value)}
            className={styles.dropdown}
          >
            <option value="">Selecione um ponto de coleta</option>
            {spots.map((spot) => (
              <option key={spot.spot_id} value={spot.spot_id}>
                {spot.spot_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loadingSpotData && <p className={styles.loading}>Carregando dados...</p>}

      {lastSpotData && (
        <div className={styles.dataContainer}>
          <h2>📊 Dados do ponto de coleta</h2>
          <h4>{new Date(lastSpotData.timestamp).toLocaleString()}</h4>
          <div className={styles.dataRow}>🌡️ Temperatura: <span>{lastSpotData.temperature} °C</span></div>
          <div className={styles.dataRow}>↕️ Aceleração Axial: <span>{lastSpotData.acceleration_axial}</span></div>
          <div className={styles.dataRow}>↔️ Aceleração Horizontal: <span>{lastSpotData.acceleration_horizontal}</span></div>
          <div className={styles.dataRow}>⬇️ Aceleração Vertical: <span>{lastSpotData.acceleration_vertical}</span></div>
          <div className={styles.dataRow}>⚡ Velocidade Axial: <span>{lastSpotData.velocity_axial}</span></div>
          <div className={styles.dataRow}>⚡ Velocidade Horizontal: <span>{lastSpotData.velocity_horizontal}</span></div>
          <div className={styles.dataRow}>⚡ Velocidade Vertical: <span>{lastSpotData.velocity_vertical}</span></div>
        </div>
      )}
    </div>
  );
}

export default App;
