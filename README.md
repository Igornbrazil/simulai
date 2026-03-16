# ⚡ SimulAI — Motor de Simulação com Agentes de IA

> Simule qualquer cenário do mundo real com agentes de IA que debatem, discordam e evoluem suas posições — tudo rodando localmente, sem custos.

💡 *Algumas conversas nunca acontecem na vida real porque as pessoas certas nunca estão na mesma sala. O SimulAI coloca elas lá.*

---

## 🎯 O que é o SimulAI?

O SimulAI é inspirado no [MiroFish](https://github.com/666ghj/MiroFish), criado por Guo Hangjiang. Você descreve um cenário e o sistema:

1. **Gera agentes** com personalidades, históricos e posições diversas
2. **Simula debates** em múltiplas rodadas, onde os agentes interagem
3. **Gera um relatório** com insights, previsões e recomendações

---

## 💡 Por que o SimulAI é único?

O valor real está em simular conversas que **nunca aconteceriam na vida real** — mas cujos resultados nos ajudam a tomar decisões melhores.

| Cenário | Por que é impossível na vida real |
|---------|-----------------------------------|
| 🏥 **Município corta orçamento de saúde para investir em tecnologia** | Gestor de saúde, prefeito, paciente e engenheiro de TI jamais debatem isso abertamente |
| 💰 **Empresa decide tornar público o salário de todos os funcionários** | RH, CEO, funcionário bem pago e mal pago nunca teriam essa conversa honesta na mesma sala |
| 🚗 **Cidade proíbe carros no centro após as 18h** | Morador, entregador, dono de restaurante e ciclista têm interesses opostos e nunca se encontram |
| 🏨 **Hospital usa IA para priorizar quem recebe leito de UTI** | Médico, familiar, gestor e filósofo de bioética nunca teriam esse debate abertamente |
| 📱 **Escola pública bane celular inclusive fora do horário de aula** | Diretor, professor, aluno e pai nunca sentam juntos para decidir isso democraticamente |

---

## 🚀 Como instalar e rodar

### Pré-requisitos

| Requisito | Link | Para quê |
|-----------|------|----------|
| **Docker Desktop** | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) | Rodar o backend e frontend |
| **Ollama** | [ollama.com](https://ollama.com) | Rodar o modelo de IA localmente (grátis) |

---

### Passo 1 — Instalar o Ollama

1. Acesse [ollama.com](https://ollama.com) e baixe o instalador
2. Instale normalmente
3. Abra o Terminal e baixe o modelo:

```bash
ollama pull llama3
```

> ⏳ ~4GB de download. Pode demorar alguns minutos.

---

### Passo 2 — Instalar o Docker Desktop

1. Acesse [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Baixe e instale para o seu sistema
3. Abra o Docker Desktop e aguarde iniciar

---

### Passo 3 — Rodar o SimulAI

> ⚠️ **Importante:** Sempre siga essa ordem exata ao iniciar o SimulAI.

**1.** Abra o **Docker Desktop** e aguarde a baleia 🐳 aparecer na barra de menu

**2.** Abra o **Terminal** e rode:
```bash
ollama serve
```
> Deixe esse Terminal aberto. Não feche.

**3.** Abra uma **segunda aba** no Terminal e navegue até a pasta do projeto:
```bash
cd ~/Documents/simulai
```

**4.** Suba o projeto:
```bash
docker-compose up --build
```

**5.** Quando aparecer `webpack compiled successfully`, abra no navegador:
```
http://localhost:3000
```

🎉 **Pronto! O SimulAI está rodando.**

---

## 🤖 Modelos suportados

### Gratuitos (local via Ollama)

| Modelo | Comando | RAM necessária | Qualidade |
|--------|---------|----------------|-----------|
| **llama3** (recomendado) | `ollama pull llama3` | ~6GB | ⭐⭐⭐⭐ |
| llama3:8b | `ollama pull llama3:8b` | ~5GB | ⭐⭐⭐ |
| mistral | `ollama pull mistral` | ~4GB | ⭐⭐⭐⭐ |
| gemma2 | `ollama pull gemma2` | ~5GB | ⭐⭐⭐ |
| phi3 | `ollama pull phi3` | ~2GB | ⭐⭐ |
| deepseek-r1 | `ollama pull deepseek-r1` | ~4GB | ⭐⭐⭐⭐ |

### Pagos (APIs externas — opcional)

| Provedor | Modelos | Como usar |
|----------|---------|-----------|
| **OpenAI** | GPT-4o, GPT-4o-mini | Informe sua API Key na interface |
| **Anthropic** | Claude 3 Haiku/Sonnet/Opus | Informe sua API Key na interface |
| **Google** | Gemini 1.5 Flash/Pro | Informe sua API Key na interface |

---

## 🧭 Como usar

1. Acesse `http://localhost:3000`
2. **Descreva o cenário** no campo de texto
3. Ajuste **agentes** (2–10) e **rodadas** (1–5)
4. Escolha o **modelo de IA**
5. Clique em **⚡ Iniciar Simulação**

### Dicas para melhores resultados
- Use **5–8 agentes** para debates mais ricos
- **3 rodadas** costumam gerar insights suficientes
- Seja específico no cenário (país, setor, contexto)
- Modelos maiores (llama3, mistral) geram respostas mais elaboradas

---

## ❓ Problemas comuns e soluções

### ❌ "All connection attempts failed"
Este é o erro mais comum. Significa que o backend não consegue se comunicar com o Ollama.

**Solução:**
1. Verifique se o Ollama está rodando: abra o Terminal e execute `ollama serve`
2. Verifique se o Docker Desktop está aberto
3. Pare e reinicie tudo na ordem correta:
```bash
docker-compose down
ollama serve          # Terminal 1 — deixe aberto
docker-compose up     # Terminal 2
```

---

### ❌ "no configuration file provided: not found"
O Terminal não está na pasta correta do projeto.

**Solução:**
```bash
cd ~/Documents/simulai
docker-compose up --build
```

---

### ❌ "dependency failed to start: container simulai-backend is unhealthy"
O healthcheck está travando o container.

**Solução:** Verifique se o `docker-compose.yml` **não** contém a seção `healthcheck`. Se contiver, remova-a.

---

### ❌ "Module not found: Error: Can't resolve './Layout.module.css'"
O arquivo `Layout.js` tem uma importação inválida.

**Solução:** Abra `frontend/src/components/Layout.js` e remova a linha:
```js
import styled from './Layout.module.css';
```

---

### ❌ "SyntaxError: invalid syntax" no backend
O TextEdit salvou texto de instrução dentro do arquivo Python.

**Solução:** Use sempre o Terminal para editar arquivos `.py`:
```bash
cat > backend/models/llm_provider.py << 'EOF'
# cole o conteúdo aqui
EOF
```

---

### ❌ Simulação trava sem resposta
- Modelos maiores demoram mais — aguarde (pode levar 10-15 minutos com 8 agentes)
- Verifique se seu computador tem RAM suficiente para o modelo
- Tente com menos agentes (2-3) e 1 rodada para testar

---

### ❌ Safari não consegue conectar
Verifique se o Docker está rodando e se os containers estão ativos:
```bash
docker ps
```
Você deve ver `simulai-backend` e `simulai-frontend` com status `Up`.

---

## 🔄 Como parar o SimulAI

```bash
docker-compose down
```

---

## 🛠️ Estrutura do projeto

```
simulai/
├── backend/
│   ├── main.py              # API FastAPI
│   ├── agents/
│   │   └── orchestrator.py  # Lógica de simulação
│   ├── models/
│   │   └── llm_provider.py  # Integração com LLMs
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.js       # Tela inicial
│   │   │   ├── Simulation.js # Tela de simulação
│   │   │   └── History.js    # Histórico
│   │   └── components/
│   │       └── Layout.js     # Layout base
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 📄 Licença

MIT — use, modifique e distribua livremente.

---

Feito com ❤️ — inspirado no [MiroFish](https://github.com/666ghj/MiroFish) de Guo Hangjiang ([@666ghj](https://github.com/666ghj)).
