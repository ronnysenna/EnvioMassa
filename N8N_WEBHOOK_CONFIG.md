
# 🚀 Configuração do Webhook do n8n para Envio Express

## 📋 Resumo

Seu aplicativo Envio Express agora recebe atualizações de status da instância n8n/Evolution via webhook. Este documento explica como configurar o n8n para enviar essas atualizações.

---

## 🔌 Endpoint do Webhook

**URL:** `http://seu-dominio.com/api/instance/webhook`

**Método:** `POST`

**Body esperado:**
```json
{
  "instancia": "ronielle",
  "status": "open"
}
```

---

## 📝 Configuração no n8n

### 1. Criar um Workflow no n8n

1. Acesse seu n8n: `https://n8n.ronnysenna.com.br`
2. Clique em **+ New** para criar um novo workflow
3. Dê um nome: "Envio Express Status Update"

### 2. Adicionar Trigger (Cron)

1. Busque por **Cron** na paleta de nodes
2. Configure para executar a cada **5 minutos**:
   - Pattern: `*/5 * * * *`
   - Timezone: `America/Sao_Paulo`

### 3. Adicionar Node HTTP Request

1. Conecte um **HTTP Request** node após o Cron
2. Configure:

**Básico:**
- **Method:** POST
- **URL:** `http://seu-dominio.com/api/instance/webhook`

**Body (JSON):**
```json
{
  "instancia": "ronielle",
  "status": "open"
}
```

**Headers:**
```
Content-Type: application/json
```

### 4. Teste

1. Clique em **Execute Node** (play button)
2. Verifique a resposta:
   ```json
   {
     "success": true,
     "data": {
       "instancia": "ronielle",
       "status": "open",
       "lastUpdate": "2025-12-05T14:30:00.000Z"
     }
   }
   ```

### 5. Ativar o Workflow

1. Clique em **Activate** (toggle no topo)
2. O workflow rodará automaticamente a cada 5 minutos

---

## 🔍 Exemplo Completo de Node HTTP Request

```json
{
  "method": "POST",
  "url": "http://seu-dominio.com/api/instance/webhook",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "instancia": "{{ $env.INSTANCE_NAME }}",
    "status": "open"
  },
  "returnFullResponse": false,
  "authentication": "none"
}
```

---

## 🚨 Estados de Status Suportados

Você pode enviar qualquer valor em `status`. O sistema normaliza assim:

| Valor Enviado | Convertido para | Badge |
|---------------|-----------------|-------|
| `open` | `online` | 🟢 Verde |
| `closed` | `offline` | 🔴 Vermelho |
| Qualquer outro | mantém original | ⚪ Cinza |

**Exemplos:**
```json
// Online
{ "instancia": "ronielle", "status": "open" }

// Offline
{ "instancia": "ronielle", "status": "closed" }

// Customizado
{ "instancia": "ronielle", "status": "connecting" }
```

---

## 📊 Fluxo Completo

```
1. n8n Cron Trigger (a cada 5 min)
   ↓
2. HTTP Request POST /api/instance/webhook
   ↓
3. App recebe JSON { instancia, status }
   ↓
4. Status armazenado em memória
   ↓
5. Frontend faz GET /api/instance/webhook
   ↓
6. Sidebar atualiza com status em tempo real
   ↓
7. User vê 🟢 Online ou 🔴 Offline
```

---

## 🧪 Teste Manual

Você pode testar o webhook com `curl`:

```bash
curl -X POST http://localhost:3000/api/instance/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "instancia": "ronielle",
    "status": "open"
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "data": {
    "instancia": "ronielle",
    "status": "open",
    "lastUpdate": "2025-12-05T14:30:00.000Z"
  }
}
```

---

## 🔧 Verificar Status Atual

**GET /api/instance/webhook**

```bash
curl http://localhost:3000/api/instance/webhook
```

Resposta:
```json
{
  "success": true,
  "data": {
    "instancia": "ronielle",
    "status": "online",
    "lastUpdate": "2025-12-05T14:30:00.000Z"
  }
}
```

---

## 📌 Pontos Importantes

### ✅ Do

- ✅ Enviar webhook a cada 5-10 minutos
- ✅ Usar POST com JSON válido
- ✅ Incluir `instancia` e `status` obrigatoriamente
- ✅ Testar com curl antes de ativar no n8n

### ❌ Evite

- ❌ Enviar webhook muito frequente (< 1 min)
- ❌ Deixar URLs incorretas
- ❌ Omitir campos obrigatórios
- ❌ Usar GET em vez de POST

---

## 🐛 Troubleshooting

### Problema: "Invalid" ao fazer login

Pode ser relacionado a outros problemas. Verifique:
1. Se o usuário existe no banco
2. Se a senha está correta
3. Veja os logs do servidor

### Problema: Status sempre "Offline"

1. Verifique se o webhook do n8n está ativo
2. Teste com `curl` manualmente
3. Veja logs do n8n para erros

### Problema: Status não atualiza no Sidebar

1. Abra DevTools (F12)
2. Vá para Network
3. Procure por `api/instance/webhook`
4. Verifique se a resposta é 200 e contém dados

---

## 💡 Avançado: Lógica Condicional no n8n

Se você quer enviar status diferente baseado em condições:

```javascript
// Num node Function do n8n
const isRunning = true; // sua lógica aqui
const instanciaStatus = isRunning ? "open" : "closed";

return {
  instancia: "ronielle",
  status: instanciaStatus
};
```

---

## 📝 Configuração Recomendada

```
Node: Cron
Intervalo: 5 minutos
Pattern: */5 * * * *

Node: HTTP Request
Method: POST
URL: http://seu-dominio/api/instance/webhook
Headers: { "Content-Type": "application/json" }
Body: {
  "instancia": "ronielle",
  "status": "open"
}
```

---

## ✅ Checklist

- [ ] Webhook URL configurado no n8n
- [ ] Method: POST
- [ ] Body com `instancia` e `status`
- [ ] Headers com `Content-Type: application/json`
- [ ] Cron configurado (a cada 5 min)
- [ ] Workflow ativado (toggle ON)
- [ ] Testado com curl
- [ ] Status aparece no Sidebar
- [ ] Verde quando status = "open"
- [ ] Vermelho quando status = "closed"

---

## 📞 Suporte

Se o webhook não funcionar:
1. Verifique os logs do n8n
2. Teste a URL do webhook com curl
3. Verifique se o firewall permite a conexão
4. Tente um teste manual do endpoint

