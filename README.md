# ⚡ SimulAI — Motor de Simulação com Agentes de IA

> Simule qualquer cenário do mundo real com agentes de IA que debatem, discordam e evoluem suas posições — tudo rodando localmente, sem custos.

---

## 🎯 O que é o SimulAI?

O SimulAI é inspirado no [MiroFish](https://github.com/666ghj/MiroFish). Você descreve um cenário (ex: *"Uma empresa anuncia demissões em massa por causa de IA"*), e o sistema:

1. **Gera agentes** com personalidades, históricos e posições diversas
2. **Simula debates** em múltiplas rodadas, onde os agentes interagem
3. **Gera um relatório** com insights, previsões e recomendações

Tudo com interface visual amigável no navegador. 🖥️

---

## 🚀 Como instalar e rodar

### Pré-requisitos

Você vai precisar de apenas **duas coisas**:

| Requisito | Link | Para quê |
|-----------|------|----------|
| **Docker Desktop** | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) | Rodar o backend e frontend |
| **Ollama** | [ollama.com](https://ollama.com) | Rodar o modelo de IA localmente (grátis) |

---

### Passo 1 — Instalar o Ollama

1. Acesse [ollama.com](https://ollama.com) e baixe o instalador para o seu sistema
2. Instale normalmente (como qualquer programa)
3. Abra o **Terminal** e baixe o modelo de IA:

```bash
ollama pull llama3
```

> ⏳ Esse download pode demorar alguns minutos dependendo da sua internet (~4GB)

Para testar se funcionou:
```bash
ollama run llama3 "Olá, tudo bem?"
```

---

### Passo 2 — Instalar o Docker Desktop

1. Acesse [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Baixe e instale para o seu sistema operacional
3. Abra o Docker Desktop e aguarde ele iniciar (ícone na barra de tarefas)

---

### Passo 3 — Baixar e rodar o SimulAI

1. Baixe este projeto (o arquivo ZIP ou clone o repositório)
2. Abra o **Terminal** dentro da pasta do projeto
3. Execute:

```bash
docker-compose up --build
```

> ⏳ Na primeira vez, pode demorar alguns minutos para baixar as dependências

4. Quando aparecer a mensagem `simulai-frontend | Compiled successfully`, abra o navegador em:

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

> 💡 Com Ollama, **não há nenhum custo**. Com APIs externas, você paga conforme o uso.

---

## 🧭 Como usar

### Criar uma simulação

1. Acesse `http://localhost:3000`
2. **Descreva o cenário** no campo de texto (quanto mais detalhado, melhor)
3. Ajuste o número de **agentes** (2–10) e **rodadas** (1–5)
4. Escolha o **modelo de IA**
5. Clique em **⚡ Iniciar Simulação**

### Durante a simulação

- Acompanhe os **agentes** sendo criados no painel esquerdo
- Veja as **mensagens** aparecerem em tempo real
- Cada cor/emoji representa um agente diferente

### Após a simulação

- Clique na aba **📊 Relatório** para ver:
  - Resumo executivo
  - Pontos de consenso e conflito
  - Previsões e probabilidades
  - Recomendações práticas

---

## 💡 Dicas de uso

**Cenários que funcionam bem:**
- Decisões empresariais: *"Uma empresa decide adotar home office permanente"*
- Políticas públicas: *"O governo propõe taxação de grandes fortunas"*
- Tendências de mercado: *"Surgimento de um novo competidor no mercado de e-commerce"*
- Dilemas éticos: *"Uma empresa de saúde vende dados de pacientes para pesquisa"*
- Inovações tecnológicas: *"Carros autônomos se tornam obrigatórios nas cidades"*

**Para melhores resultados:**
- Seja específico sobre o contexto (país, setor, escala)
- Use 5–7 agentes para debates mais ricos
- 3 rodadas costumam gerar insights suficientes
- Modelos maiores (llama3, mistral) geram respostas mais elaboradas

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
├── start.sh                 # Alternativa sem Docker
└── README.md
```

---

## ❓ Problemas comuns

### "Não consigo conectar ao Ollama"
- Verifique se o Ollama está rodando: abra o Terminal e execute `ollama list`
- No macOS/Windows com Docker, o backend acessa o Ollama via `host.docker.internal`
- Certifique-se de que baixou o modelo: `ollama pull llama3`

### "O Docker não sobe"
- Verifique se o Docker Desktop está aberto e rodando
- Tente: `docker-compose down && docker-compose up --build`

### "A simulação trava"
- Modelos maiores demoram mais para responder — aguarde
- Verifique se o seu computador tem RAM suficiente para o modelo escolhido

### "Erro de API Key"
- Verifique se a chave foi digitada corretamente
- Certifique-se de ter saldo/créditos na conta do provedor

---

## 🔄 Parar o SimulAI

No terminal onde está rodando, pressione `Ctrl + C` e execute:

```bash
docker-compose down
```

---

## 📄 Licença

MIT — use, modifique e distribua livremente.

---

Feito com ❤️ — inspirado no [MiroFish](https://github.com/666ghj/MiroFish) de Guo Hangjiang.
