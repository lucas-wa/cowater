from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.responses import JSONResponse

app = FastAPI()

connections: list[WebSocket] = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)
    print(f"📡 Nova conexão WebSocket ({len(connections)} ativas)")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"Mensagem recebida do cliente: {data}")
    except WebSocketDisconnect:
        connections.remove(websocket)
        print(f"❌ Conexão encerrada ({len(connections)} ativas)")


@app.post("/data")
async def post_data(request: Request):
    try:
        body = await request.json()
        print(f"📥 Dados recebidos: {body}")

        disconnected = []
        for ws in connections:
            try:
                await ws.send_json(body)
            except Exception as e:
                print(f"Erro ao enviar para cliente: {e}")
                disconnected.append(ws)

        for ws in disconnected:
            connections.remove(ws)

        return JSONResponse(content={"message": "Broadcast enviado", "clientes_ativos": len(connections)})
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar requisição: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)