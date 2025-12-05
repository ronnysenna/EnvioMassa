
# ⚡ Quick Start - Sistema de Status de Instância

## 🎯 5 Minutos para Entender

### A Pergunta
> "Aquele 'Online' no Sidebar refere-se ao que?"

### A Resposta
> **É o status em tempo real do seu servidor n8n/Evolution que envia mensagens WhatsApp.**

---

## 🏗️ Arquitetura em 30 Segundos

```
┌─────────────────────────────────────────┐
│        Seu App (Envio Express)          │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Sidebar                          │ │
│  │  🟢 Online / 🔴 Offline / 🟡 ...  │ │
│  └───────────────────────────────────┘ │
│           ↑                             │
│     (verifica a cada 30s)               │
│           ↓                             │
│  ┌───────────────────────────────────┐ │
│  │  GET /api/instance/status         │ │
│  └───────────────────────────────────┘ │
│           ↑                             │
│           ↓                             │
│    Database (Tabela: Instance)          │
│           ↑                             │
│           ↓                             │
└─────────────────────────────────────────┘
         ↑
         │ (n8n envia POST updates)
         │
┌─────────────────────────────────────────┐
│     n8n Evolution + WhatsApp API        │
│          (Seu servidor de envios)       │
└─────────────────────────────────────────┘
```

---

## 🚀 Setup em 3 Passos

### Passo 1️⃣: Configurar .env

```env
# Adicione ao seu .env
INSTANCE_STATUS_TOKEN=seu_token_super_secreto_123456
```

### Passo 2️⃣: Configurar n8n

No seu workflow n8n, adicione este **HTTP Request Node**:

```
Method: POST
URL: https://seu-app.com/api/instance/status
Headers:
  - x-instance-token: seu_token_super_secreto_123456
  - Content-Type: application/json
Body:
{
  "status": "online",
  "isHealthy": true
}
```

**Configure para enviar:**
- ✅ A cada 5-10 minutos (polling)
- ✅ Quando n8n inicia
- ✅ Quando WhatsApp reconecta

### Passo 3️⃣: Pronto! ✨

Agora o Sidebar mostrará o status real.

---

## 🎨 Estados Visuais

### Estado: ONLINE ✓
```
Sidebar mostra:
┌──────────────────────┐
│ ● Envio Express      │
│ 🟢 Online            │
└──────────────────────┘

Ação: ✓ Usuário pode enviar mensagens
```

### Estado: OFFLINE ✗
```
Sidebar mostra:
┌──────────────────────┐
│ ● Envio Express      │
│ 🔴 Offline           │
│ ⚠️ Instância descon.  │
└──────────────────────┘

Ação: ✗ Mensagens não serão enviadas
```

### Estado: CONECTANDO 🔄
```
Sidebar mostra:
┌──────────────────────┐
│ ● Envio Express      │
│ 🟡 Conectando...     │
└──────────────────────┘

Ação: ⏳ Aguarde alguns segundos
```

---

## 🧪 Testar Agora

### Verificar Status Atual
```bash
curl http://localhost:3000/api/instance/status
```

Resposta esperada:
```json
{
  "success": true,
  "data": {
    "status": "offline",
    "isHealthy": false
  }
}
```

### Simular n8n Online
```bash
curl -X POST http://localhost:3000/api/instance/status \
  -H "Content-Type: application/json" \
  -H "x-instance-token: seu_token_super_secreto_123456" \
  -d '{
    "status": "online",
    "isHealthy": true
  }'
```

Agora o Sidebar deve mostrar 🟢 Online

### Simular n8n Offline
```bash
curl -X POST http://localhost:3000/api/instance/status \
  -H "Content-Type: application/json" \
  -H "x-instance-token: seu_token_super_secreto_123456" \
  -d '{
    "status": "offline",
    "isHealthy": false,
    "errorMessage": "n8n não está respondendo"
  }'
```

Agora o Sidebar deve mostrar 🔴 Offline + aviso

---

## 📊 O Que Está Armazenado

### Tabela no Banco: `Instance`

| Campo | Valor | Descrição |
|-------|-------|-----------|
| `id` | 1 | ID único |
| `name` | "n8n-evolution" | Nome da instância |
| `status` | "online" | Estado atual |
| `isHealthy` | true/false | Saúde geral |
| `lastSeen` | 2025-12-05 14:30 | Último ping recebido |
| `errorMessage` | null | Mensagem de erro se houver |
| `updatedAt` | 2025-12-05 14:30 | Última atualização |

---

## 💡 Casos de Uso

### Caso 1: Usuário Tenta Enviar com n8n Offline
```
Usuario: "Quero enviar 1000 mensagens"
App: "Verifica sidebar..."
App: "n8n está offline! Não posso enviar"
Usuario: "Ah, devo aguardar. Aviso ao dev"
```

### Caso 2: n8n Cai Sem Avisar
```
09:00 - Sidebar: 🟢 Online (tudo OK)
10:30 - n8n tem erro silenciosamente
10:32 - Próximo refresh (30s)
10:32 - Sidebar: 🔴 Offline + ⚠️ Aviso
Usuario: "Vejo o aviso e abro ticket"
```

### Caso 3: Monitoramento Automático
```
Você quer saber quando n8n cai?
→ Configure alertas no seu dashboard
→ Monitore API /api/instance/status
→ Integre com Slack/Discord/Email
```

---

## ✅ Checklist Pré-Deploy

- [ ] `.env` tem `INSTANCE_STATUS_TOKEN` definido
- [ ] n8n está configurado para enviar POST
- [ ] Testou com `curl` e funcionou
- [ ] Build passou: `npm run build`
- [ ] Sidebar mostra status correto
- [ ] Token é forte (mínimo 32 caracteres)

---

## 🔗 Links Úteis

| Documento | Quando Ler |
|-----------|-----------|
| [`STATUS_SYSTEM_EXPLAINED.md`](./STATUS_SYSTEM_EXPLAINED.md) | Quer entender melhor |
| [`INSTANCE_STATUS_SYSTEM.md`](./INSTANCE_STATUS_SYSTEM.md) | Quer detalhes técnicos |
| [`CHANGELOG_INSTANCE_STATUS.md`](./CHANGELOG_INSTANCE_STATUS.md) | Quer ver o que mudou |

---

## ❓ FAQ

### P: Se n8n cai, o status demora quanto para atualizar?
R: Máximo 30 segundos (intervalo de polling do frontend) + tempo que n8n demora para enviar o POST.

### P: Preciso do token mesmo em desenvolvimento?
R: Não é obrigatório, mas é recomendado por segurança.

### P: O que muda visualmente?
R: Apenas o indicador no Sidebar (cores + aviso) e nada mais.

### P: Isso melhora a performance?
R: Não, é apenas informação. Mas ajuda a diagnosticar problemas.

### P: Posso usar sem n8n?
R: Sim, mas ficará sempre em "offline" até configurar n8n.

---

## 🎓 Conceitos-Chave

- **Polling**: App verifica status a cada 30s
- **n8n Evolution**: Seu servidor de mensagens
- **Webhook**: n8n envia update via POST
- **Token**: Chave de segurança no header
- **lastSeen**: Marca quando n8n foi visto pela última vez

---

## 🎯 TL;DR (Muito Longo; Não Li)

1. Adicione `INSTANCE_STATUS_TOKEN` ao `.env`
2. Configure n8n para enviar POST a `/api/instance/status`
3. O Sidebar agora mostra se n8n está online
4. Pronto! 🎉

