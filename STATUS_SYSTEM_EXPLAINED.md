
# 🎯 O Que é Aquele "Online" no Sidebar?

## Resposta Rápida

**O "Online" que você vê no Sidebar mostra se a instância n8n/Evolution (seu servidor de mensagens) está funcionando corretamente.**

---

## 📱 Exemplo Prático

### ✅ Status: ONLINE (🟢 Verde)
```
Você: "Vou enviar 100 mensagens"
Sistema: "✓ Conexão com n8n está OK"
Resultado: Mensagens são enviadas normalmente
```

### ❌ Status: OFFLINE (🔴 Vermelho)
```
Você: "Vou enviar 100 mensagens"
Sistema: "✗ n8n não está respondendo"
Resultado: Envio falha ou fica na fila
```

---

## 🔗 A Arquitetura

```
Seu App (Envio Express)
       ↓
   [Sidebar com "Online"]
       ↓
Database (Tabela: Instance)
       ↓
n8n Evolution + WhatsApp API
```

### Como Funciona:

1. **n8n Evolution** é o servidor que realmente envia mensagens via WhatsApp
2. **Seu App** precisa saber se esse servidor está online
3. **n8n envia atualizações** para `/api/instance/status` 
4. **Sidebar verifica** a cada 30 segundos se n8n está respondendo
5. **Usuário vê** o indicador 🟢 ou 🔴

---

## 📊 Estados Possíveis

| Estado | Ícone | Cor | O Que Significa |
|--------|-------|-----|-----------------|
| **Online** | ◉ | 🟢 Verde | n8n está funcionando, pode enviar |
| **Offline** | ◉ | 🔴 Vermelho | n8n desconectou, não consegue enviar |
| **Conectando** | ◉ | 🟡 Amarelo | n8n está tentando reconectar |
| **Verificando** | ◉ | ⚫ Cinza | App ainda não checou o status |

---

## 🛠️ Configuração Necessária

### Passo 1: Adicionar Token (Segurança)

No seu `.env`:
```env
INSTANCE_STATUS_TOKEN=um_token_super_secreto
```

### Passo 2: Configurar n8n para Enviar Updates

No seu workflow do n8n, adicione um nó **HTTP Request**:

```javascript
{
  "method": "POST",
  "url": "https://seu-app.com/api/instance/status",
  "headers": {
    "x-instance-token": "um_token_super_secreto",
    "Content-Type": "application/json"
  },
  "body": {
    "status": "online",
    "isHealthy": true
  }
}
```

**Quando enviar:**
- ✅ A cada 5 minutos (polling regular)
- ✅ Quando n8n inicia
- ✅ Quando WhatsApp reconecta

### Passo 3: Pronto!

Agora o Sidebar vai mostrar o status real do n8n.

---

## 🧪 Testando

### Teste 1: Verificar Status Atual

```bash
curl http://localhost:3000/api/instance/status
```

Resposta esperada:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "n8n-evolution",
    "status": "online",
    "isHealthy": true,
    "lastSeen": "2025-12-05T14:30:00Z"
  }
}
```

### Teste 2: Simular n8n Offline

```bash
curl -X POST http://localhost:3000/api/instance/status \
  -H "Content-Type: application/json" \
  -H "x-instance-token: um_token_super_secreto" \
  -d '{
    "status": "offline",
    "isHealthy": false,
    "errorMessage": "n8n offline - simulado"
  }'
```

Agora o Sidebar deve mostrar 🔴 Offline com aviso amarelo.

### Teste 3: Voltar Online

```bash
curl -X POST http://localhost:3000/api/instance/status \
  -H "Content-Type: application/json" \
  -H "x-instance-token: um_token_super_secreto" \
  -d '{
    "status": "online",
    "isHealthy": true
  }'
```

Sidebar volta a 🟢 Online.

---

## 🎯 Por Que Importa?

### Sem Status (Antes)
```
Usuário: "Por que minhas mensagens não enviaram?"
Dev: "Não sei, talvez n8n tenha caído"
```

### Com Status (Agora)
```
Usuário: Vê 🔴 Offline no sidebar
Usuário: "Ah, a instância caiu. Vou avisar ao time"
Dev: Recebe aviso e resolve rápido
```

---

## 🔄 Fluxo de Uso Real

### Cenário Completo

```
09:00 - Usuário abre app
        Sidebar mostra 🟢 Online
        → n8n está respondendo ✓

10:30 - Servidor n8n tem erro
        → n8n para de responder

10:32 - Próximo refresh do sidebar (30s)
        → App tenta GET /api/instance/status
        → lastSeen está atrasado
        → Muda para 🟡 Conectando... ou 🔴 Offline

10:35 - Dev recebe alerta e reinicia n8n
        → n8n envia POST com status="online"
        → Database atualizado

10:36 - Próximo refresh do usuário
        → Sidebar volta a 🟢 Online
        → Usuário pode enviar novamente
```

---

## 💡 Boas Práticas

### ✅ Faça

- ✅ Configure polling automático no n8n
- ✅ Use token de segurança forte
- ✅ Monitore o status em produção
- ✅ Teste com `curl` antes de colocar em produção

### ❌ Não Faça

- ❌ Deixar o token em código/GitHub
- ❌ Usar HTTP sem HTTPS em produção
- ❌ Confiar só no webhook de mensagens
- ❌ Polling muito frequente (< 5 segundos)

---

## 📚 Documentação Completa

Para mais detalhes técnicos, leia:
- [`INSTANCE_STATUS_SYSTEM.md`](./INSTANCE_STATUS_SYSTEM.md)

---

## 🎓 Resumo em Uma Frase

**O "Online" mostra se o n8n/Evolution (seu servidor de mensagens) está funcionando, usando um sistema de polling que verifica a cada 30 segundos.**

