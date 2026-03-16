import json
import re
import asyncio
from typing import List, Dict, Any, Callable, Optional
from models.llm_provider import LLMProvider

AGENT_EMOJIS = ["🧑‍💼", "👩‍🔬", "🧑‍🎓", "👨‍⚖️", "👩‍💻", "🧑‍🏭", "👩‍🎨", "🧑‍🌾", "👨‍⚕️", "👩‍🚀"]
AGENT_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98FB98", "#F0E68C", "#87CEEB", "#FFB6C1"]

MAX_RETRIES = 3
RETRY_DELAY = 2.0


async def with_retry(fn, retries=MAX_RETRIES, delay=RETRY_DELAY):
    """Execute an async function with retry logic."""
    last_error = None
    for attempt in range(retries):
        try:
            return await fn()
        except Exception as e:
            last_error = e
            if attempt < retries - 1:
                await asyncio.sleep(delay * (attempt + 1))
    raise last_error


class SimulationOrchestrator:
    def __init__(self, provider: LLMProvider):
        self.provider = provider

    async def generate_agents(self, scenario: str, num_agents: int) -> List[Dict[str, Any]]:
        system = """Você é um especialista em simulações sociais e análise de cenários.
Sua tarefa é criar personas realistas e diversas para uma simulação de agentes.
Responda APENAS com JSON válido, sem texto adicional."""

        user = f"""Crie {num_agents} agentes diversos e realistas para simular o seguinte cenário:

CENÁRIO: {scenario}

Retorne um JSON no seguinte formato (array de objetos):
[
  {{
    "id": "agent_1",
    "name": "Nome Completo",
    "role": "Papel/Função",
    "background": "Breve histórico profissional e pessoal (2-3 frases)",
    "personality": "Traços de personalidade principais",
    "stance": "Posição inicial sobre o cenário (favorável/neutro/contrário/cético)",
    "motivation": "O que motiva este agente no cenário"
  }}
]

Os agentes devem ter perspectivas DIVERSAS e às vezes conflitantes. Seja criativo e realista."""

        async def _call():
            response = await self.provider.complete(system, user)
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if not json_match:
                raise ValueError("Could not parse agents from LLM response")
            return json.loads(json_match.group())

        agents = await with_retry(_call)

        # Enrich with UI metadata
        for i, agent in enumerate(agents):
            agent["emoji"] = AGENT_EMOJIS[i % len(AGENT_EMOJIS)]
            agent["color"] = AGENT_COLORS[i % len(AGENT_COLORS)]

        return agents

    async def run_round(
        self,
        scenario: str,
        agents: List[Dict],
        previous_messages: List[Dict],
        round_num: int,
        on_agent_start: Optional[Callable] = None,
    ) -> List[Dict]:
        messages = []
        
        # Build conversation context
        context = ""
        if previous_messages:
            context = "\n\nDISCUSSÕES ANTERIORES:\n"
            for msg in previous_messages[-10:]:  # last 10 messages for context
                context += f"- {msg['agent_name']} ({msg['agent_role']}): {msg['content']}\n"

        round_focus = {
            1: "Apresente sua perspectiva inicial sobre o cenário",
            2: "Responda às perspectivas dos outros e aprofunde sua análise",
            3: "Proponha conclusões ou soluções baseadas na discussão",
        }.get(round_num, "Continue a discussão com novas perspectivas")

        for i, agent in enumerate(agents):
            # Notify progress
            if on_agent_start:
                await on_agent_start(agent, i + 1, len(agents))

            system = f"""Você é {agent['name']}, {agent['role']}.

SEU PERFIL:
- Histórico: {agent['background']}
- Personalidade: {agent['personality']}
- Posição: {agent['stance']}
- Motivação: {agent['motivation']}

Você está participando de uma simulação sobre o seguinte cenário: {scenario}

INSTRUÇÕES:
- Fale SEMPRE em primeira pessoa como este personagem
- Seja autêntico à sua personalidade e posição
- Mantenha consistência com suas falas anteriores
- Seja direto e conciso (máximo 3-4 frases)
- Você pode concordar ou discordar com outros participantes
- NÃO mencione que é uma IA ou simulação"""

            user = f"""Rodada {round_num}: {round_focus}{context}

O que você tem a dizer sobre o cenário "{scenario}"?"""

            try:
                async def _call(s=system, u=user):
                    return await self.provider.complete(s, u)

                response = await with_retry(_call)
                messages.append({
                    "id": f"msg_{round_num}_{agent['id']}",
                    "round": round_num,
                    "agent_id": agent["id"],
                    "agent_name": agent["name"],
                    "agent_role": agent["role"],
                    "agent_emoji": agent["emoji"],
                    "agent_color": agent["color"],
                    "content": response.strip(),
                    "stance": agent["stance"],
                })
            except Exception as e:
                messages.append({
                    "id": f"msg_{round_num}_{agent['id']}",
                    "round": round_num,
                    "agent_id": agent["id"],
                    "agent_name": agent["name"],
                    "agent_role": agent["role"],
                    "agent_emoji": agent["emoji"],
                    "agent_color": agent["color"],
                    "content": f"[Não foi possível gerar resposta após {MAX_RETRIES} tentativas]",
                    "stance": agent["stance"],
                    "error": True,
                })

        return messages

    async def generate_report(
        self,
        scenario: str,
        agents: List[Dict],
        messages: List[Dict]
    ) -> Dict[str, Any]:
        system = """Você é um analista especializado em dinâmicas sociais e previsão de cenários.
Analise a simulação e gere um relatório detalhado.
Responda APENAS com JSON válido, sem texto adicional ou markdown."""

        conversation = "\n".join([
            f"[Rodada {m['round']}] {m['agent_name']} ({m['agent_role']}): {m['content']}"
            for m in messages
        ])

        agents_summary = "\n".join([
            f"- {a['name']} ({a['role']}): posição={a['stance']}, motivação={a['motivation']}"
            for a in agents
        ])

        user = f"""Analise a seguinte simulação e gere um relatório completo:

CENÁRIO: {scenario}

AGENTES:
{agents_summary}

DISCUSSÃO COMPLETA:
{conversation}

Retorne um JSON com esta estrutura:
{{
  "executive_summary": "Resumo executivo em 2-3 frases",
  "key_findings": [
    {{"title": "Título do achado", "description": "Descrição detalhada", "impact": "alto|médio|baixo"}}
  ],
  "consensus_points": ["Ponto de consenso 1", "Ponto de consenso 2"],
  "conflict_points": ["Ponto de conflito 1", "Ponto de conflito 2"],
  "sentiment_analysis": {{
    "favorable": 0,
    "neutral": 0,
    "skeptical": 0,
    "contrary": 0
  }},
  "predictions": [
    {{"scenario": "Cenário previsto", "probability": "alta|média|baixa", "reasoning": "Justificativa"}}
  ],
  "recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3"],
  "overall_sentiment": "positivo|negativo|misto|neutro"
}}"""

        response = await self.provider.complete(system, user)
        
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if not json_match:
            raise ValueError("Could not parse report from LLM response")
        
        return json.loads(json_match.group())
