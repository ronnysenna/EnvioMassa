
# 🔄 Sistema de Status de Instância - Envio Express

## 📋 Visão Geral

O **Online** que aparece no Sidebar agora reflete o status **real da instância n8n/Evolution**, não apenas um indicador estático.

### O que é?
- **n8n Evolution**: É a instância do servidor de mensagens que você está usando
- **Status**: Indica se a instância está funcionando corretamente e capaz de enviar mensagens
- **Webhook**: O n8n se conecta ao seu app via webhook para atualizar o status

---

## 🎯 Como Funciona

### Fluxo de Atualização do Status

```
n8n Evolution
    ↓ (envia status via webhook)
GET /api/instance/status  ← Recupera status atual
POST /api/instance/status ← n8n atualiza status
    ↓
Database (Tabela: Instance)
    ↓
Sidebar React Component
    ↓
Interface do Usuário (🟢 Online / 🔴 Offline)
```

### Estados Possíveis

| Estado | Cor | Significado | Ação |
|--------|-----|------------|------|
| **online** | 🟢 Verde | Instância funcionando normalmente | Continue enviando mensagens |
| **offline** | 🔴 Vermelho | Instância desconectada | Aguarde reconexão ou verifique n8n |
| **connecting** | 🟡 Amarelo | Instância tentando conectar | Aguarde alguns segundos |
| **error** | 🔴 Vermelho escuro | Erro na instância | Verifique logs do n8n |

---

## 📊 Database Schema

### Tabela: Instance

```sql
CREATE TABLE "Instance" (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) DEFAULT 'n8n-evolution',
  status VARCHAR(50) DEFAULT 'offline',  -- online, offline, connecting, error
  lastSeen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  webhook VARCHAR(255),                   -- URL do webhook do n8n
  evolutionUrl VARCHAR(255),              -- URL base da instância Evolution
  evolutionApiKey VARCHAR(255),           -- Chave de API da Evolution
  isHealthy BOOLEAN DEFAULT false,        -- Indicador de saúde
  errorMessage TEXT,                      -- Mensagem de erro (se houver)
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔌 Endpoints da API

### 1. **GET /api/instance/status**

Recupera o status atual da instância.

**Request:**
```bash
curl http://localhost:3000/api/instance/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "n8n-evolution",
    "status": "online",
    "isHealthy": true,
    "lastSeen": "2025-12-05T13:30:00.000Z",
    "errorMessage": null,
    "updatedAt": "2025-12-05T13:30:00.000Z"
  }
}
```

---

### 2. **POST /api/instance/status**

Atualiza o status da instância (chamado pelo n8n).

**Request Headers:**
```
x-instance-token: SEU_TOKEN_AQUI (opcional)
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "online",
  "isHealthy": true,
  "errorMessage": null,
  "webhook": "https://seu-app.com/webhook",
  "evolutionUrl": "https://evolution.seu-dominio.com",
  "evolutionApiKey": "sua-chave-api"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "online",
    "isHealthy": true,
    "updatedAt": "2025-12-05T13:30:00.000Z"
  }
}
```

---

## 🔐 Segurança

### Token de Autenticação (Opcional)

Para aumentar a segurança, você pode adicionar um token:

1. **Adicione ao `.env`:**
```env
INSTANCE_STATUS_TOKEN=seu_token_secreto_super_seguro
```

2. **O n8n deve enviar o header:**
```
x-instance-token: seu_token_secreto_super_seguro
```

---

## 🛠️ Configurando o n8n para Enviar Updates

### No n8n Workflow:

1. **Trigger**: Defina um cronograma ou evento
2. **HTTP Request Node**: 
   - **Method**: POST
   - **URL**: `https://seu-app.com/api/instance/status`
   - **Headers**: 
     ```
     x-instance-token: seu_token_secreto
     Content-Type: application/json
     ```
   - **Body**:
     ```json
     {
       "status": "online",
       "isHealthy": true,
       "errorMessage": null
     }
     ```

### Exemplo JSON no n8n:
```json
{
  "method": "POST",
  "url": "{{ $env.APP_URL }}/api/instance/status",
  "headers": {
    "x-instance-token": "{{ $env.INSTANCE_STATUS_TOKEN }}",
    "Content-Type": "application/json"
  },
  "body": {
    "status": "online",
    "isHealthy": true,
    "errorMessage": null,
    "evolutionUrl": "{{ $env.EVOLUTION_URL }}",
    "evolutionApiKey": "{{ $env.EVOLUTION_API_KEY }}"
  }
}
```

---

## 🔍 Monitoramento

### Hook React: `useInstanceStatus()`

Usado no Sidebar e pode ser reutilizado em qualquer componente:

```typescript
import { useInstanceStatus } from "@/lib/useInstanceStatus";

export default function MyComponent() {
  const { status, loading } = useInstanceStatus();

  if (loading) return <div>Verificando...</div>;

  return (
    <div>
      Status: {status?.status}
      Saudável: {status?.isHealthy ? "✓" : "✗"}
      Último visto: {status?.lastSeen}
    </div>
  );
}
```

### Polling Automático
- **Intervalo**: 30 segundos
- **Sem overhead**: Apenas request leve ao servidor
- **Fallback**: Se n8n não enviar updates, lastSeen fica antigo

---

## 📈 Fluxo Completo de Uso

### Cenário 1: Tudo Online
```
1. Usuário acessa dashboard
2. Sidebar carrega status via GET /api/instance/status
3. Status = "online" → 🟢 Verde
4. Usuário pode enviar mensagens normalmente
5. A cada 30s verifica status novamente
```

### Cenário 2: Instância Cai
```
1. n8n Evolution desconecta
2. Poderia ser detectado por health check do n8n
3. n8n chama POST /api/instance/status com "offline"
4. Database atualizado com status = "offline"
5. Próximo refresh do usuário (30s) mostra 🔴 Offline
6. Alerta amarelo aparece: "Instância desconectada"
7. Usuário sabe que não conseguirá enviar mensagens
```

### Cenário 3: Reconexão
```
1. n8n Evolution reconecta
2. n8n verifica health e envia status = "online"
3. POST /api/instance/status atualiza database
4. Próximo refresh mostra 🟢 Online novamente
```

---

## 💡 Boas Práticas

### ✅ Recomendações

1. **Configure polling regular**: n8n deve atualizar status a cada 5-10 minutos
2. **Adicione tokens de segurança**: Sempre use `INSTANCE_STATUS_TOKEN` em produção
3. **Monitore erros**: Salve `errorMessage` para debug
4. **Teste a integração**: Use o endpoint GET para validar
5. **Alertas**: Considere enviar notificação quando status muda para offline

### ❌ Evite

- ❌ Deixar updates apenas no webhook de mensagens (pode ficar desatualizado)
- ❌ Usar URL sem HTTPS em produção
- ❌ Compartilhar tokens em código/logs
- ❌ Polling muito frequente (< 5 segundos)

---

## 🐛 Troubleshooting

### Problema: Status sempre mostra "Offline"

**Solução:**
1. Verifique se o n8n está enviando POST para `/api/instance/status`
2. Valide o token em `INSTANCE_STATUS_TOKEN`
3. Veja logs: `POST /api/instance/status` deve retornar 200

### Problema: Status não atualiza no sidebar

**Solução:**
1. Verifique se o browser consegue acessar GET `/api/instance/status`
2. Console do browser: procure por erros de fetch
3. Verifique CORS se n8n está em outro domínio

### Problema: "Erro ao buscar status"

**Solução:**
1. Verifique se database está rodando
2. Verifique conexão `DATABASE_URL`
3. Verifique se migrations foram aplicadas: `prisma migrate status`

---

## 📝 Próximas Melhorias

- [ ] Dashboard de histórico de status
- [ ] Alertas por email quando status muda
- [ ] Métricas de uptime
- [ ] Health check automático do n8n
- [ ] Retry automático quando offline

---

## ✅ Resumo

| Aspecto | Valor |
|---------|-------|
| **Tipo** | Real-time Status Monitor |
| **Update Frequency** | 30s (cliente) + On-demand (n8n) |
| **Database** | Table: Instance |
| **API Endpoints** | GET, POST /api/instance/status |
| **Segurança** | Token opcional via header |
| **UI Component** | Sidebar (com AlertCircle warning) |

