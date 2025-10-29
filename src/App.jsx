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

  // Função robusta para formatar timestamps variados (seconds, ms, ISO, etc.)
  const formatTimestamp = (raw) => {
    if (raw === null || raw === undefined || raw === "") return "—";

    // Extrai se vier como objeto { timestamp: ... }
    let value = raw;
    if (typeof value === "object" && value.timestamp !== undefined) {
      value = value.timestamp;
    }

    const now = Date.now();
    const candidates = [];

    // 1) String numérica (ex: "169...") -> número
    if (typeof value === "string" && /^\d+$/.test(value)) {
      const n = Number(value);
      // se parecer segundos (10 dígitos), converte pra ms
      candidates.push(n < 1e11 ? n * 1000 : n);
    } else if (typeof value === "number") {
      // 2) Número: seconds or ms
      candidates.push(value < 1e11 ? value * 1000 : value);
    }

    // 3) String ISO (ex: "2025-10-29T12:34:56" ou com Z/offset)
    if (typeof value === "string" && /T/.test(value)) {
      const parsed = Date.parse(value);
      if (!isNaN(parsed)) candidates.push(parsed);

      // Se string ISO não possui 'Z' nem offset, tente também com 'Z' (assumir UTC)
      if (!/[Z+\-]\d*$/.test(value)) {
        const parsedZ = Date.parse(value + "Z");
        if (!isNaN(parsedZ)) candidates.push(parsedZ);
      }
    }

    // 4) Última tentativa: converter qualquer coisa pra número
    const maybeNum = Number(value);
    if (!isNaN(maybeNum)) {
      candidates.push(maybeNum < 1e11 ? maybeNum * 1000 : maybeNum);
    }

    // Filtra candidatos válidos
    const valid = candidates
      .map((c) => Number(c))
      .filter((c) => !isNaN(c) && c > 0);

    // Se não encontrou candidato válido, tenta criar Date diretamente
    if (valid.length === 0) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      }
      return String(raw);
    }

    // Heurística: escolhe candidato cuja diferença para 'agora' é menor (mais provável)
    let best = valid[0];
    let bestDiff = Math.abs(now - best);
    for (let i = 1; i < valid.length; i++) {
      const diff = Math.abs(now - valid[i]);
      if (diff < bestDiff) {
        best = valid[i];
        bestDiff = diff;
      }
    }

    const chosenDate = new Date(best);

    // Se quiser depurar: descomente a linha abaixo para ver raw, candidatos e escolha.
    // console.debug("formatTimestamp raw:", raw, "validCandidates:", valid, "chosen:", best, chosenDate.toISOString());

    return chosenDate.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  };

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
          <h4>{formatTimestamp(lastSpotData.timestamp)}</h4>

          <div className={styles.dataRow}>🌡️ Temperatura: <span>{lastSpotData.temperature ?? "—"} °C</span></div>
          <div className={styles.dataRow}>↕️ Aceleração Axial: <span>{lastSpotData.acceleration_axial ?? "—"}</span></div>
          <div className={styles.dataRow}>↔️ Aceleração Horizontal: <span>{lastSpotData.acceleration_horizontal ?? "—"}</span></div>
          <div className={styles.dataRow}>⬇️ Aceleração Vertical: <span>{lastSpotData.acceleration_vertical ?? "—"}</span></div>
          <div className={styles.dataRow}>⚡ Velocidade Axial: <span>{lastSpotData.velocity_axial ?? "—"}</span></div>
          <div className={styles.dataRow}>⚡ Velocidade Horizontal: <span>{lastSpotData.velocity_horizontal ?? "—"}</span></div>
          <div className={styles.dataRow}>⚡ Velocidade Vertical: <span>{lastSpotData.velocity_vertical ?? "—"}</span></div>
        </div>
      )}
    </div>
  );
}

export default App;
