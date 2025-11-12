import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Droplet, Ruler, Thermometer } from "lucide-react";
import { Pie, PieChart, Label } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

function App() {
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [connected, setConnected] = useState(false);

  // Conecta ao WebSocket na inicialização
  useEffect(() => {
    const ws = new WebSocket("wss://d36cdc5fe28a.ngrok-free.app/ws");

    ws.onopen = () => {
      console.log("✅ Conectado ao WebSocket");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📥 Dados recebidos:", data);
        if (data.temperature !== undefined) setTemperature(data.temperature);
        if (data.humidity !== undefined) setHumidity(data.humidity);
      } catch (e) {
        console.error("Erro ao processar mensagem:", e);
      }
    };

    ws.onclose = () => {
      console.warn("⚠️ WebSocket desconectado. Tentando reconectar...");
      setConnected(false);
      // setTimeout(() => window.location.reload(), 3000);
    };

    ws.onerror = (err) => console.error("Erro no WebSocket:", err);

    return () => ws.close();
  }, []);

  // Dados para os gráficos
  const humidityData = [
    { label: "Umidade", value: 12, fill: "#3b82f6" },
    { label: "Não umidade", value: 10, fill: "#e5e7eb" },
  ];

  const temperatureData = [
    { label: "Temperatura", value: temperature, fill: "#ef4444" },
    { label: "Restante", value: 50 - temperature, fill: "#e5e7eb" },
  ];

  const chartConfig = {
    value: { label: "Celsius" },
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-10 gap-10 transition-all">
      <h2 className="w-full text-4xl font-bold text-center">
        Dashboard CoWater
      </h2>
      {/* <p className="text-center text-sm text-gray-500">
        {connected ? "🟢 Conectado ao servidor IoT" : "🔴 Desconectado"}
      </p> */}

      <div className="flex w-full gap-5 items-center justify-center flex-wrap">
        {/* Card de Temperatura */}
        {/* <Card className="w-96 outline-0 border-[#fefefe] shadow-md hover:-translate-y-1 hover:border-red-300 transition-all">
          <CardHeader className="items-center pb-0">
            <CardTitle className="text-2xl w-full">Temperatura</CardTitle>
            <CardAction>
              <Thermometer size={32} className="text-red-300" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={temperatureData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {temperature.toFixed(1)}°C
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground font-semibold"
                            >
                              Celsius
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card> */}

        {/* Card de Umidade */}
        <Card className="w-96 outline-0 border-[#fefefe] shadow-md hover:-translate-y-1 hover:border-blue-300 transition-all">
          <CardHeader className="items-center pb-0">
            <CardTitle className="text-2xl w-full">Distância</CardTitle>
            <CardAction>
              <Ruler size={32} className="text-blue-300" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={humidityData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              7.4cm
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground font-semibold"
                            >
                              Centímetros
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
