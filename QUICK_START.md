
# ⚡ Quick Start - Envio Express

## 🚀 Começando Agora

### 1. **Ambiente de Desenvolvimento**

```bash
# Instalar dependências
npm install

# Configurar banco de dados
# (já configurado em DATABASE_URL)

# Iniciar servidor dev
npm run dev
```

Acesse: `http://localhost:3000`

---

## 🔐 Login

### Credenciais de Teste
```
Email: teste@teste.com
Senha: 123123
```

### Ou Registrar Nova Conta
```
URL: http://localhost:3000/register
Preencha os campos
```

---

## 📱 Páginas Disponíveis

| Página | URL | Descrição |
|--------|-----|-----------|
| Login | `/login` | Autenticação |
| Register | `/register` | Criar conta |
| Dashboard | `/dashboard` | Página inicial |
| Enviar | `/enviar` | Enviar mensagens |
| Contatos | `/contatos` | Gerenciar contatos |
| Grupos | `/grupos` | Criar grupos |
| Upload | `/imagem` | Upload de imagens |
| Galeria | `/gallery` | Ver imagens |

---

## 🎯 Funcionalidades Principais

### Dashboard
- 📊 Métricas de contatos e grupos
- 🚀 Quick actions para enviar
- 💡 Dicas de uso
- ℹ️ Informações do sistema

### Status da Instância
- 🟢 Online: Instância conectada
- 🔴 Offline: Instância desconectada
- ⚪ Verificando: Carregando status

Vê no Sidebar, junto ao "Envio Express"

---

## 🔌 Configurar Webhook do n8n

### Opção 1: Teste Rápido (Curl)

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
    "lastUpdate": "2025-12-05T13:45:58.276Z"
  }
}
```

### Opção 2: Configurar no n8n (Produção)

Veja `N8N_WEBHOOK_CONFIG.md` para instruções detalhadas

---

## 🧪 Testar Funcionalidades

### 1. **Testar Status**

```bash
# Enviar online
curl -X POST http://localhost:3000/api/instance/webhook \
  -H "Content-Type: application/json" \
  -d '{"instancia":"ronielle","status":"open"}'

# Verificar status
curl http://localhost:3000/api/instance/webhook

# Enviar offline
curl -X POST http://localhost:3000/api/instance/webhook \
  -H "Content-Type: application/json" \
  -d '{"instancia":"ronielle","status":"closed"}'
```

### 2. **Testar Login**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username":"teste@teste.com",
    "password":"123123"
  }'
```

### 3. **Testar Logout**

```bash
curl -X POST http://localhost:3000/api/auth/logout
```

---

## 📱 Interface

### Sidebar
- 🏠 Dashboard
- 📨 Enviar Mensagem
- 👥 Contatos
- 📂 Grupos
- 🖼️ Upload de Imagem
- 🚪 Sair

### Status
- Nome da instância (ex: "ronielle")
- Status online/offline
- Alerta se offline

---

## 🛠️ Troubleshooting

### Problema: "Invalid" no login

**Solução:**
1. Verifique email/senha
2. Registre uma nova conta
3. Verifique se o banco está conectado

### Problema: Status não atualiza

**Solução:**
1. Teste com curl: `curl http://localhost:3000/api/instance/webhook`
2. Abra DevTools (F12) → Network
3. Procure por `api/instance/webhook`
4. Verifique resposta JSON

### Problema: Sidebar não mostra Online/Offline

**Solução:**
1. Aguarde 30 segundos (polling)
2. Recarregue a página
3. Verifique logs do navegador (F12 → Console)

---

## 📊 Endpoints da API

### Instância
- `POST /api/instance/webhook` - Enviar status
- `GET /api/instance/webhook` - Verificar status

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário

### Contatos
- `GET /api/contacts` - Listar
- `POST /api/contacts` - Criar
- `PUT /api/contacts/[id]` - Atualizar
- `DELETE /api/contacts/[id]` - Deletar
- `POST /api/contacts/import` - Importar CSV

### Grupos
- `GET /api/groups` - Listar
- `POST /api/groups` - Criar
- `PUT /api/groups/[id]` - Atualizar
- `DELETE /api/groups/[id]` - Deletar

### Imagens
- `GET /api/images` - Listar
- `POST /api/images/upload` - Fazer upload
- `DELETE /api/images/[id]` - Deletar

### Envio
- `POST /api/send` - Enviar mensagens

---

## 📚 Documentação Completa

Consulte estes arquivos para mais detalhes:

```
SESSAO_FINAL_20251205.md ← Resumo da sessão
N8N_WEBHOOK_CONFIG.md ← Como configurar webhook
WEBHOOK_INSTANCE_STATUS.md ← Sistema de status
DESIGN_SYSTEM.md ← Design e cores
GUIA_COMPONENTES.md ← Componentes UI
```

---

## ✨ Dicas

### 🎨 Componentes Disponíveis

```tsx
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
```

### 🔔 Notificações

```tsx
import { notifySuccess, notifyError, notifyWarning, notifyInfo } from "@/lib/notify";

notifySuccess("Operação realizada!");
notifyError("Algo deu errado");
notifyWarning("Atenção!");
notifyInfo("Informação");
```

### 🎯 Status da Instância

```tsx
import { useInstanceStatus } from "@/lib/useInstanceStatus";

function MyComponent() {
  const { status, loading } = useInstanceStatus();
  
  return (
    <div>
      {status?.status === "online" ? "🟢 Online" : "🔴 Offline"}
      {status?.instancia && ` • ${status.instancia}`}
    </div>
  );
}
```

---

## 🚀 Deploy

### Build para Produção
```bash
npm run build
```

### Iniciar em Produção
```bash
npm start
```

---

## 📋 Checklist de Primeiro Uso

- [ ] `npm install` - Instalar dependências
- [ ] Banco de dados conectado
- [ ] `npm run dev` - Servidor rodando
- [ ] Acessar `http://localhost:3000/login`
- [ ] Login com `teste@teste.com` / `123123`
- [ ] Ver Dashboard
- [ ] Testar webhook com curl
- [ ] Configurar webhook no n8n
- [ ] Verificar status no Sidebar

---

## 💡 Próximos Passos

1. **Registrar usuário real**
   ```
   /register → Preencher formulário
   ```

2. **Importar contatos**
   ```
   /contatos → Botão Importar → CSV
   ```

3. **Criar grupos**
   ```
   /grupos → Novo Grupo
   ```

4. **Upload de imagens**
   ```
   /imagem → Upload → Use ao enviar
   ```

5. **Enviar mensagens**
   ```
   /enviar → Preencher → Enviar
   ```

---

## ❓ Perguntas Frequentes

**P: Como crio uma conta?**  
R: Clique em "Criar conta" na página de login, ou acesse `/register`

**P: Posso usar com múltiplas instâncias?**  
R: Sim! Cada webhook pode enviar um `instancia` diferente

**P: O status fica salvo se reinicar o servidor?**  
R: Não, é apenas em memória. Mas n8n reenvia em 5 min

**P: Preciso de banco de dados para o status?**  
R: Não! Está em memória por design

**P: Como resetar o status?**  
R: Reinicie o servidor ou envie um novo status via webhook

---

## 🎉 Tudo Pronto!

Seu Envio Express está configurado e pronto para usar! 🚀

Se tiver dúvidas, consulte a documentação completa nos arquivos `.md`

