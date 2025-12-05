
# 🔄 Sistema de Status de Instância - Versão Simplificada

## 📋 Visão Geral

O **Online** que aparece no Sidebar agora verifica o status da instância n8n/Evolution **diretamente via webhook**, sem usar banco de dados.

---

## 🎯 Como Funciona

### Fluxo Simplificado

```
Browser (React)
    ↓
useInstanceStatus hook
    ↓ (fetch GET com timeout 5s)
https://n8n.ronnysenna.com.br/webhook/verificarInstancia
    ↓ (resposta 200 = online, erro = offline)
Status atualizado no Sidebar
    ↓
🟢 Online ou 🔴 Offline
```

### Estados

| Estado | Cor | Significado |
|--------|-----|------------|
| **online** | 🟢 Verde | Webhook respondeu com sucesso |
| **offline** | 🔴 Vermelho | Webhook não respondeu ou erro |
| **Verificando...** | ⚪ Cinza | Carregando o status inicial |

---

## 📦 Implementação

### 1. Hook React: `useInstanceStatus()`

**Localização:** `/lib/useInstanceStatus.ts`

```typescript
export function useInstanceStatus() {
  const [status, setStatus] = useState<InstanceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkInstanceStatus = async () => {
      try {
        const res = await fetch(
          "https://n8n.ronnysenna.com.br/webhook/verificarInstancia",
          { method: "GET", signal: AbortSignal.timeout(5000) }
        );

        if (res.ok) {
          setStatus({ status: "online" });
        } else {
          setStatus({ status: "offline", message: "Instância não respondeu" });
        }
      } catch (error) {
        setStatus({ status: "offline", message: "Erro ao conectar" });
      }
    };

    checkInstanceStatus();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkInstanceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return { status, loading };
}
```

### 2. Uso no Sidebar

```tsx
import { useInstanceStatus } from "@/lib/useInstanceStatus";

export default function Sidebar() {
  const { status, loading } = useInstanceStatus();

  return (
    <div className="flex items-center gap-1.5">
      {status ? (
        <>
          <div className={`w-2 h-2 rounded-full ${
            status.status === "online" 
              ? "bg-green-400 animate-pulse" 
              : "bg-red-400"
          }`} />
          <span>{status.status === "online" ? "Online" : "Offline"}</span>
        </>
      ) : (
        <span>Verificando...</span>
      )}
    </div>
  );
}
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Nenhuma configuração necessária! O hook usa a URL do webhook diretamente:

```
https://n8n.ronnysenna.com.br/webhook/verificarInstancia
```

Se precisar mudar a URL, edite em `/lib/useInstanceStatus.ts`:

```typescript
const res = await fetch(
  "https://SEU_DOMINIO/webhook/verificarInstancia",
  { method: "GET", signal: AbortSignal.timeout(5000) }
);
```

---

## 🔍 Detalhes Técnicos

### Timeout
- **5 segundos**: Se o webhook não responder em 5s, considera offline
- **Evita travamento**: Não prende a UI esperando resposta infinita

### Polling
- **Intervalo**: 30 segundos entre verificações
- **Eficiente**: Sem overhead excessivo
- **Flexível**: Pode ser ajustado conforme necessário

### CORS
- Webhook deve permitir requisições GET de `localhost:3000` (dev)
- Em produção, configure o domínio correto no n8n

---

## 🚀 Benefícios

✅ **Simples**: Sem tabela no banco, sem API extra  
✅ **Leve**: Apenas um fetch a cada 30 segundos  
✅ **Rápido**: Resposta direta do webhook  
✅ **Real-time**: Status sempre atualizado  
✅ **Sem dependências**: Usa apenas fetch nativo  

---

## 🐛 Troubleshooting

### Problema: Status sempre mostra "Offline"

**Solução:**
1. Verifique se o webhook n8n está ativo
2. Teste manualmente:
   ```bash
   curl https://n8n.ronnysenna.com.br/webhook/verificarInstancia
   ```
3. Se não responder, o problema está no n8n

### Problema: Status não atualiza

**Solução:**
1. Abra DevTools (F12)
2. Vá para Network
3. Procure por requisições a `verificarInstancia`
4. Verifique se a resposta é 200 OK

### Problema: CORS Error

**Solução:**
1. Configure CORS no webhook do n8n para aceitar seu domínio
2. Ou use um proxy se não conseguir alterar n8n

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Tabela DB** | ❌ Sim (Instance) | ✅ Não |
| **API Endpoint** | ❌ POST/GET /api/instance/status | ✅ Não |
| **Migrations** | ❌ 2 migrations extras | ✅ Sem mudanças |
| **Complexidade** | ❌ Alta (DB + API + Hook) | ✅ Baixa (só Hook) |
| **Performance** | ⚠️ Query ao DB | ✅ Fetch direto |
| **Manutenção** | ❌ Mais código | ✅ Menos código |
| **Linhas de Código** | ❌ ~150 | ✅ ~45 |

---

## 💡 Próximas Melhorias (Opcional)

- [ ] Adicionar cache local com `localStorage`
- [ ] Notificar quando status muda (online → offline)
- [ ] Retry automático com backoff
- [ ] Dashboard de histórico de status
- [ ] Configuração da URL do webhook em `.env`

---

## ✅ Status Atual

- ✅ Build: SUCCESS
- ✅ TypeScript: SEM ERROS
- ✅ Banco de dados: Sem tabela Instance
- ✅ API: Sem endpoint de status
- ✅ Sidebar: Mostrando status em tempo real
- ✅ Pronto para produção

---

## 📝 Arquivos Modificados

```
lib/useInstanceStatus.ts ← Hook simplificado
components/Sidebar.tsx ← Usando novo hook
prisma/schema.prisma ← Removido modelo Instance
(migrations criadas automaticamente)
```

