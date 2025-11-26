from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
import paho.mqtt.client as mqtt

app = FastAPI()

connections: list[WebSocket] = []

MQTT_BROKER = "host.docker.internal"
MQTT_PORT = 1883
MQTT_TOPIC = "bia-iot-2025/grupo-1/sensor/distancia"

def on_connect(client, userdata, flags, rc):
    print("🔌 Conectado ao MQTT Broker com código", rc)
    client.subscribe(MQTT_TOPIC)

main_loop = asyncio.get_event_loop()

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode('utf-8')
    except UnicodeDecodeError:
        payload = msg.payload.decode('utf-8', errors='ignore')
    print("📥 Mensagem MQTT recebida:", payload)
    asyncio.run_coroutine_threadsafe(broadcast(payload), main_loop)

mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

@app.on_event("startup")
async def startup_event():
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start()
    print("MQTT loop started")

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connections.append(ws)
    print("🟢 WebSocket conectado — total:", len(connections))
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        connections.remove(ws)
        print("❌ WebSocket desconectado — total:", len(connections))

async def broadcast(message: str):
    for ws in connections:
        try:
            await ws.send_text(message)
        except Exception as e:
            print("Erro ao enviar para cliente WebSocket:", e)
            connections.remove(ws)
