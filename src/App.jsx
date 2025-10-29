import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./App.module.css";
import { useTheme } from "./ThemeContext.jsx";

function DataRow({ label, value, unit }) {
  return (
    <div className={styles.dataRow}>
      {label}: <span>{value ?? "—"} {unit}</span>
    </div>
  );
}

function App() {
  const API_KEY = import.meta.env.VITE_API_KEY || "8mX7gZlFBm0bJ7jjhjg8atBpr5eGql72xYvIMpT4";
  const { darkMode, toggleTheme } = useTheme();

  const [spots, setSpots] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState("");
  const [spotData, setSpotData] = useState(null);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [loadingSpotData, setLoadingSpotData] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualiza o relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Busca lista de pontos de coleta (spots)
  useEffect(() => {
    const getSpots = async () => {
      try {
        setLoadingSpots(true);
        setError(null);
        const response = await axios.get("https://api.iotebe.com/v2/spot", {
          headers: { "x-api-key": API_KEY },
        });
        setSpots(response.data);
      } catch (error) {
        console.error(error);
        setError("Falha ao buscar pontos de coleta. Tente novamente.");
      } finally {
        setLoadingSpots(false);
      }
    };

    getSpots();
  }, []);

  // Busca e atualiza dados do spot selecionado
  useEffect(() => {
    if (!selectedSpotId) return;

    let intervalId;

    const getSpotData = async () => {
      try {
        setLoadingSpotData(true);
        setError(null);
        const response = await axios.get(
          `https://api.iotebe.com/v2/spot/${selectedSpotId}/ng1vt/global_data/data`,
          { headers: { "x-api-key": API_KEY } }
        );
        setSpotData(response.data);
      } catch (error) {
        console.error(error);
        setError("Falha ao buscar dados do ponto selecionado.");
      } finally {
        setLoadingSpotData(false);
      }
    };

    // Chamada inicial imediata
    getSpotData();

    // Atualiza automaticamente a cada 10 segundos
    intervalId = setInterval(getSpotData, 10000);

    // Limpa o intervalo ao trocar de spot ou desmontar
    return () => clearInterval(intervalId);
  }, [selectedSpotId]);

  const lastSpotData = spotData?.[0] ?? null;

  return (
    <div className={`${styles.app} ${darkMode ? styles.dark : styles.light}`}>
      {/* Botão de tema */}
      <div className={styles.themeToggle}>
        <button className={styles.themeButton} onClick={toggleTheme}>
          {darkMode ? "🌞" : "🌙"}
        </button>
      </div>

      <h1 className={styles.title}>Ponto de Coleta</h1>

      

      {/* Mensagem de erro */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Carregamento de spots */}
      {loadingSpots && <p className={styles.loading}>Carregando pontos...</p>}

      {/* Lista de spots */}
      {spots && (
        <div className={styles.selectContainer}>
          <select
            name="spot"
            disabled={loadingSpotData || loadingSpots}
            onChange={(e) => setSelectedSpotId(e.target.value)}
            className={styles.dropdown}
            value={selectedSpotId}
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

      {/* Carregamento de dados */}
      {loadingSpotData && <p className={styles.loading}>Carregando dados...</p>}

      {/* Dados do ponto */}
      {lastSpotData && (
        <div className={styles.dataContainer}>
          <h2>📊 Dados do ponto de coleta</h2>
          <h3>{Date(lastSpotData.timestamp)}</h3>

          <DataRow label="🌡️ Temperatura" value={lastSpotData.temperature} unit="°C" />
          <DataRow label="↕️ Aceleração Axial" value={lastSpotData.acceleration_axial} />
          <DataRow label="↔️ Aceleração Horizontal" value={lastSpotData.acceleration_horizontal} />
          <DataRow label="⬇️ Aceleração Vertical" value={lastSpotData.acceleration_vertical} />
          <DataRow label="⚡ Velocidade Axial" value={lastSpotData.velocity_axial} />
          <DataRow label="⚡ Velocidade Horizontal" value={lastSpotData.velocity_horizontal} />
          <DataRow label="⚡ Velocidade Vertical" value={lastSpotData.velocity_vertical} />
        </div>
      )}
    </div>
  );
}

export default App;
