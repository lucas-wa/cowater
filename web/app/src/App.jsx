import { useEffect, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Ruler } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Label as PieLabel,
} from "recharts";

const VITE_WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || "";

const MAX_DISTANCE = 120;  
const MIN_DISTANCE = 20;  

function App() {
  const [waterLevelPct, setWaterLevelPct] = useState(0);
  const [history, setHistory] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`${VITE_WEBSOCKET_URL}/ws`);

    ws.onopen = () => {
      console.log("✅ Conectado ao WebSocket");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Mensagem recebida:", data);
        console.log(typeof data)
        const d = typeof data === "number" ? data : data.distance;
        if (typeof d === "number") {
          const pct = Math.max(
            0,
            Math.min(
              100,
              ((MAX_DISTANCE - d) / (MAX_DISTANCE - MIN_DISTANCE)) * 100
            )
          );
          setWaterLevelPct(pct);
          setHistory((prev) => [...prev, { idx: prev.length + 1, pct }]);
        }
      } catch (e) {
        console.error("Erro ao processar mensagem:", e);
      }
    };

    ws.onclose = () => {
      console.warn("⚠️ WebSocket desconectado");
      setConnected(false);
    };

    ws.onerror = (err) => console.error("Erro no WebSocket:", err);

    return () => ws.close();
  }, []);

  const alertLow = waterLevelPct < 20; 

  const pieData = [
    { name: "Água", value: waterLevelPct, fill: "#3b82f6" },
    { name: "Vazio", value: 100 - waterLevelPct },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col p-10 gap-10">
      <h2 className="text-4xl font-bold text-center">Dashboard CoWater</h2>

      {alertLow && (
        <div className="p-4 bg-red-200 text-red-800 text-center font-semibold rounded">
          ⚠️ Atenção: reservatório com pouca água! ({waterLevelPct.toFixed(1)} %)
        </div>
      )}

      <div className="flex flex-wrap gap-5 justify-center">
        {/* Pie Chart — nível de água */}
        <Card className="w-80 shadow-md">
          <CardHeader className="pb-0">
            <CardTitle className="text-2xl w-full">Nível de Água</CardTitle>
            <CardAction>
              <Ruler size={32} className="text-blue-400" />
            </CardAction>
          </CardHeader>
          <CardContent className="pb-0">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  stroke="#fff"
                >
                  <PieLabel
                    content={({ viewBox }) => {
                      if (!viewBox || typeof viewBox.cx !== "number") return null;
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-foreground text-3xl font-bold"
                        >
                          {waterLevelPct.toFixed(1)}%
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="w-full max-w-xl shadow-md">
          <CardHeader className="pb-0">
            <CardTitle className="text-2xl w-full">Histórico de Água (%)</CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="idx" hide={true} />
                <YAxis domain={[0, 100]} hide={true} />
                <RechartsTooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="#3b82f6"
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
