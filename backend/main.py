from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import asyncio
import json
import uuid
from datetime import datetime

from agents.orchestrator import SimulationOrchestrator
from models.llm_provider import LLMProvider

app = FastAPI(title="SimulAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

simulations = {}

class SimulationRequest(BaseModel):
    scenario: str
    num_agents: int = 5
    num_rounds: int = 3
    provider: str = "ollama"
    model: str = "llama3"
    api_key: Optional[str] = None
    base_url: Optional[str] = None

class SimulationResponse(BaseModel):
    simulation_id: str
    status: str
    created_at: str

@app.get("/")
async def root():
    return {"message": "SimulAI API is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/providers")
async def get_providers():
    return {
        "providers": [
            {"id": "ollama", "name": "Ollama (Local - Gratuito)", "requires_key": False, "default_model": "llama3"},
            {"id": "openai", "name": "OpenAI (GPT-4)", "requires_key": True, "default_model": "gpt-4o-mini"},
            {"id": "anthropic", "name": "Anthropic (Claude)", "requires_key": True, "default_model": "claude-3-haiku-20240307"},
            {"id": "gemini", "name": "Google Gemini", "requires_key": True, "default_model": "gemini-1.5-flash"},
        ]
    }

@app.get("/models/{provider}")
async def get_models(provider: str):
    models = {
        "ollama": ["llama3", "llama3:8b", "mistral", "gemma2", "phi3", "qwen2", "deepseek-r1"],
        "openai": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
        "anthropic": ["claude-3-haiku-20240307", "claude-3-sonnet-20240229", "claude-3-opus-20240229"],
        "gemini": ["gemini-1.5-flash", "gemini-1.5-pro"],
    }
    return {"models": models.get(provider, [])}

@app.post("/simulate", response_model=SimulationResponse)
async def create_simulation(request: SimulationRequest):
    sim_id = str(uuid.uuid4())
    simulations[sim_id] = {
        "id": sim_id,
        "status": "pending",
        "scenario": request.scenario,
        "config": request.dict(),
        "agents": [],
        "messages": [],
        "report": None,
        "created_at": datetime.now().isoformat(),
    }
    return SimulationResponse(
        simulation_id=sim_id,
        status="pending",
        created_at=simulations[sim_id]["created_at"]
    )

@app.get("/simulate/{sim_id}/stream")
async def stream_simulation(sim_id: str):
    if sim_id not in simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")

    sim = simulations[sim_id]

    async def event_generator():
        try:
            provider = LLMProvider(
                provider=sim["config"]["provider"],
                model=sim["config"]["model"],
                api_key=sim["config"].get("api_key"),
                base_url=sim["config"].get("base_url"),
            )

            orchestrator = SimulationOrchestrator(provider)
            sim["status"] = "running"
            yield f"data: {json.dumps({'type': 'status', 'status': 'running'})}\n\n"

            yield f"data: {json.dumps({'type': 'log', 'message': '🧠 Gerando agentes para o cenário...'})}\n\n"
            agents = await orchestrator.generate_agents(
                sim["config"]["scenario"],
                sim["config"]["num_agents"]
            )
            sim["agents"] = agents
            yield f"data: {json.dumps({'type': 'agents', 'agents': agents})}\n\n"

            all_messages = []
            for round_num in range(1, sim["config"]["num_rounds"] + 1):
                yield f"data: {json.dumps({'type': 'round_start', 'round': round_num, 'total': sim['config']['num_rounds']})}\n\n"

                progress_events = []

                async def on_agent_start(agent, current, total, r=round_num):
                    progress_events.append({
                        'type': 'agent_progress',
                        'agent_name': agent['name'],
                        'agent_emoji': agent['emoji'],
                        'current': current,
                        'total': total,
                        'round': r,
                    })

                messages = await orchestrator.run_round(
                    sim["config"]["scenario"],
                    agents,
                    all_messages,
                    round_num,
                    on_agent_start=on_agent_start,
                )

                for pe in progress_events:
                    yield f"data: {json.dumps(pe)}\n\n"

                for msg in messages:
                    all_messages.append(msg)
                    sim["messages"].append(msg)
                    yield f"data: {json.dumps({'type': 'message', 'message': msg})}\n\n"
                    await asyncio.sleep(0.05)

            yield f"data: {json.dumps({'type': 'log', 'message': '📊 Gerando relatório final...'})}\n\n"
            report = await orchestrator.generate_report(
                sim["config"]["scenario"],
                agents,
                all_messages
            )
            sim["report"] = report
            sim["status"] = "completed"

            yield f"data: {json.dumps({'type': 'report', 'report': report})}\n\n"
            yield f"data: {json.dumps({'type': 'status', 'status': 'completed'})}\n\n"

        except Exception as e:
            sim["status"] = "error"
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

@app.get("/simulate/{sim_id}")
async def get_simulation(sim_id: str):
    if sim_id not in simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return simulations[sim_id]

@app.get("/simulations")
async def list_simulations():
    return {"simulations": list(simulations.values())}
