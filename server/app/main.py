from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
import asyncio
from google.cloud import pubsub_v1
from concurrent.futures import ThreadPoolExecutor
import json

connections: list[WebSocket] = []
message_queue = asyncio.Queue()

PROJECT_ID = "valid-task-471913-e7"
SUBSCRIPTION_PATH = f"projects/{PROJECT_ID}/subscriptions/iot-bia-2025-measures-sub"

def pubsub_callback(message):
    """Callback executado em thread separada pelo Pub/Sub"""
    try:
        data = message.data.decode('utf-8')
        print(f"📨 Pub/Sub recebido: {data}")
        
        # Enfileira mensagem para processar no loop asyncio
        asyncio.run_coroutine_threadsafe(
            message_queue.put(data),
            loop
        )
        message.ack()
    except Exception as e:
        print(f"❌ Erro no callback: {e}")
        message.nack()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global loop
    loop = asyncio.get_running_loop()
    
    # Inicia subscriber em thread separada
    subscriber = pubsub_v1.SubscriberClient()
    streaming_pull = subscriber.subscribe(
        SUBSCRIPTION_PATH,
        callback=pubsub_callback
    )
    
    # Task para processar fila e fazer broadcast
    async def process_messages():
        while True:
            try:
                data = await message_queue.get()
                await broadcast(data)
            except Exception as e:
                print(f"❌ Erro no broadcast: {e}")
    
    task = asyncio.create_task(process_messages())
    
    print(f"✅ Listener Pub/Sub iniciado: {SUBSCRIPTION_PATH}")
    
    yield
    
    # Cleanup
    streaming_pull.cancel()
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root():
    return {
        "status": "online",
        "connections": len(connections),
        "subscription": SUBSCRIPTION_PATH
    }

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connections.append(ws)
    print(f"🔌 WebSocket conectado — Total: {len(connections)}")
    
    try:
        # Envia confirmação de conexão
        await ws.send_json({
            "type": "connected",
            "message": "Conectado ao servidor IoT"
        })
        
        while True:
            # Mantém conexão aberta (pode receber comandos do front)
            data = await ws.receive_text()
            print(f"📤 Cliente enviou: {data}")
            
    except WebSocketDisconnect:
        connections.remove(ws)
        print(f"🔌 WebSocket desconectado — Total: {len(connections)}")

async def broadcast(message: str):
    """Envia mensagem para todos os clientes conectados"""
    if not connections:
        print("⚠️  Nenhum cliente conectado")
        return
    
    disconnected = []
    for ws in connections:
        try:
            print(f"📡 Enviando para cliente: {message}")
            await ws.send_text(message)
        except Exception as e:
            print(f"❌ Erro ao enviar para cliente: {e}")
            disconnected.append(ws)
    
    # Remove conexões mortas
    for ws in disconnected:
        if ws in connections:
            connections.remove(ws)