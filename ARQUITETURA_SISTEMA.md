
# 🏗️ Arquitetura do Sistema - Envio Express

## 📊 Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Next.js)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Sidebar + Status                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ Envio Express        🟢 Online • ronielle       │  │ │
│  │  │ Dashboard, Enviar, Contatos, Grupos             │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↑ (fetch GET)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Componentes Modernizados                       │ │
│  │  • Button, Card, Input, Alert, Badge                 │ │
│  │  • Notificações com Sonner                           │ │
│  │  • Design System com cores harmonizadas              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────┬──────────────────────────────────────────────────┘
           │
           ├─→ GET /api/instance/webhook (30s)
           │       ↓
           ├─→ POST /api/auth/login
           ├─→ GET /api/contacts
           ├─→ GET /api/groups
           ├─→ POST /api/send
           └─→ etc.
           │
           ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Next.js API Routes)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Instance Webhook Endpoint                │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ POST /api/instance/webhook                       │  │
│  │  │ { "instancia": "ronielle", "status": "open" }   │  │
│  │  │          ↓ (armazena em memória)                │  │
│  │  │ instanceStatus = { ... }                        │  │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ GET /api/instance/webhook                        │  │ │
│  │  │          ↓ (retorna status)                      │  │ │
│  │  │ { "success": true, "data": { ... } }           │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Autenticação & Autorização               │ │
│  │  • POST /api/auth/login                              │ │
│  │  • POST /api/auth/logout                             │ │
│  │  • GET /api/auth/me                                  │ │
│  │  • JWT Tokens com HttpOnly Cookies                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              CRUD Resources                           │ │
│  │  • /api/contacts/* - Gerenciar contatos             │ │
│  │  • /api/groups/* - Gerenciar grupos                 │ │
│  │  • /api/images/* - Upload de imagens                │ │
│  │  • /api/send/* - Enviar mensagens                   │ │
│  │  • /api/selection/* - Cache de seleção              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────┬──────────────────────────────────────────────────┘
           │
           ├─→ Query Database
           ├─→ Process Data
           ├─→ Validate Input
           └─→ Return Response
           │
           ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tables:                                                    │
│  • User (id, username, password, role)                     │
│  • Contact (id, nome, telefone, email, userId)            │
│  • Group (id, nome, descricao, userId)                    │
│  • ContactGroup (id, contactId, groupId)                  │
│  • Image (id, url, filename, userId)                      │
│  • Selection (id, userId, selectedIds)                    │
│                                                              │
│  Note: Instance status está em MEMÓRIA (não em DB)        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
           ↑
           │ (persiste dados)
           │
┌─────────────────────────────────────────────────────────────┐
│                      N8N Evolution                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Cron Job (a cada 5 min):                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Verifica status da instância Evolution           │  │
│  │ 2. Prepara JSON:                                    │  │
│  │    { "instancia": "ronielle", "status": "open" }   │  │
│  │ 3. POST http://seu-app/api/instance/webhook        │  │
│  │ 4. Aguarda 5 minutos                                │  │
│  │ 5. Repete                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Status em Tempo Real

```
n8n Evolution (a cada 5 min)
        │
        │ Detecta status
        ↓
┌─────────────────────┐
│  Status = "open"    │
│  ou                 │
│  Status = "closed"  │
└────────┬────────────┘
         │
         │ POST JSON
         ↓
┌──────────────────────────────────────┐
│ /api/instance/webhook (Backend)      │
│                                      │
│ 1. Recebe JSON                      │
│ 2. Valida dados                     │
│ 3. Armazena em memória              │
│ 4. Retorna 200 OK                   │
└────────┬─────────────────────────────┘
         │
         │ Armazenado em memória
         │ instanceStatus = { ... }
         │
React Component
        │
        │ Polling: GET /api/instance/webhook
        │ (a cada 30 segundos)
        ↓
┌──────────────────────────────────────┐
│ /api/instance/webhook (GET)          │
│                                      │
│ 1. Retorna instanceStatus em memória │
│ 2. Se aberto: status = "online"     │
│ 3. Se fechado: status = "offline"   │
└────────┬─────────────────────────────┘
         │
         │ JSON com status
         ↓
┌──────────────────────────────────────┐
│ useInstanceStatus Hook               │
│                                      │
│ 1. Recebe JSON                      │
│ 2. Normaliza valores                │
│ 3. Atualiza estado React            │
│ 4. Trigger re-render                │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│ Sidebar Component                    │
│                                      │
│ 🟢 Online • ronielle                 │
│ ou                                   │
│ 🔴 Offline                           │
└──────────────────────────────────────┘
```

---

## 📱 Estrutura de Componentes

```
App
├── Layout
│   ├── Sidebar
│   │   ├── Logo (Envio Express)
│   │   ├── Status Indicator
│   │   │   ├── useInstanceStatus Hook
│   │   │   ├── GET /api/instance/webhook
│   │   │   └── Status Badge
│   │   ├── Navigation Menu
│   │   └── Logout Button
│   │
│   └── Main Content
│       ├── Page (Dashboard, Enviar, etc)
│       │   ├── Card Component
│       │   ├── Button Component
│       │   ├── Input Component
│       │   ├── Alert Component
│       │   └── Badge Component
│       │
│       └── ToastProvider
│           └── Sonner Toaster
│
├── UI Components
│   ├── Button (primary, secondary, danger, success, ghost)
│   ├── Card (Card, CardHeader, CardContent, CardFooter)
│   ├── Input (with label, error, helperText)
│   ├── Alert (success, error, warning, info)
│   └── Badge (5 color variants)
│
└── Providers
    ├── ProtectedRoute
    ├── ThemeProvider
    ├── ToastProvider
    └── ClientProviders
```

---

## 🗄️ Banco de Dados

### Schema (Prisma)

```
User
├── id (PK)
├── username (UNIQUE)
├── password
├── role
├── createdAt
├── contacts (relation)
├── images (relation)
├── groups (relation)
└── selection (relation)

Contact
├── id (PK)
├── nome
├── telefone (UNIQUE)
├── email (optional)
├── userId (FK)
└── groups (relation)

Group
├── id (PK)
├── nome
├── descricao
├── userId (FK)
└── contacts (relation)

ContactGroup (Junction)
├── id (PK)
├── contactId (FK)
├── groupId (FK)
└── UNIQUE(contactId, groupId)

Image
├── id (PK)
├── url
├── filename
├── userId (FK)
└── createdAt

Selection
├── id (PK)
├── userId (FK, UNIQUE)
├── selectedIds (JSON)
└── updatedAt

Instance (em MEMÓRIA, não em DB)
├── instancia
├── status
└── lastUpdate
```

---

## 🔐 Fluxo de Autenticação

```
User Input (Email, Senha)
        │
        ↓
POST /api/auth/login
        │
        ├─ Validar campos
        ├─ Buscar usuário no DB
        ├─ Comparar senha (bcrypt)
        │
        ├─ ✓ Sucesso
        │  ├─ Gerar JWT
        │  ├─ Set HttpOnly Cookie
        │  └─ Retornar 200 OK
        │
        ├─ ✗ Erro
        │  └─ Retornar 401 Unauthorized
        │
        ↓
Frontend recebe token
        │
        ├─ Salva em Cookie (HttpOnly)
        ├─ Redireciona para /dashboard
        │
        ↓
Requisições subsequentes
        │
        ├─ Cookie enviado automaticamente
        ├─ Backend valida JWT
        ├─ Permite acesso a recurso
        │
        ↓
POST /api/auth/logout
        │
        ├─ Limpa Cookie
        ├─ Redireciona para /login
        │
        ↓
User logado out
```

---

## 🎨 Design System

```
CSS Variables (30+)
│
├─ Colors
│  ├─ Background: --bg, --bg-secondary, --panel
│  ├─ Text: --text, --text-secondary, --text-muted
│  ├─ Primary: --primary, --primary-50, --primary-600, --primary-700
│  ├─ Secondary: --secondary, --secondary-50, --secondary-100
│  ├─ Status: --success, --warning, --danger, --info
│  └─ UI: --border, --border-light, --divider
│
├─ Shadows
│  ├─ --shadow-sm
│  ├─ --shadow
│  ├─ --shadow-md
│  └─ --shadow-lg
│
├─ Spacing
│  └─ Used via Tailwind (p-6, m-4, gap-2, etc)
│
└─ Typography
   └─ System fonts with antialiasing
```

---

## 🚀 Deployment

```
Local Development
├─ npm install
├─ npm run dev (port 3000)
└─ Accesso: http://localhost:3000

Build Production
├─ npm run build
├─ Generate: .next/
├─ Optimize assets
└─ Ready to deploy

Production Deployment
├─ npm start
├─ Environment variables
├─ Database connection
├─ API endpoints ready
└─ Status: 🚀 Live
```

---

## 📊 Performance

| Métrica | Valor | Status |
|---------|-------|--------|
| Build Time | ~8s | ✅ Fast |
| Page Load | <1s | ✅ Good |
| API Response | <100ms | ✅ Fast |
| Status Check | 30s polling | ✅ Optimal |
| Memory (Instance) | <1KB | ✅ Minimal |

---

## 🔒 Segurança

```
Layers:
│
├─ Transport
│  ├─ HTTPS (em produção)
│  └─ Secure Cookies
│
├─ Authentication
│  ├─ Password Hashing (bcrypt)
│  ├─ JWT Tokens
│  └─ HttpOnly Cookies
│
├─ Authorization
│  ├─ Protected Routes
│  ├─ User Isolation
│  └─ Role-based Access
│
├─ Data Validation
│  ├─ Input sanitization
│  ├─ Type checking (TypeScript)
│  └─ Schema validation (Prisma)
│
└─ API Security
   ├─ CORS handling
   ├─ Rate limiting (opcional)
   └─ Error handling
```

---

## 🎯 Fluxo de Um Envio de Mensagem

```
User: /enviar
│
├─ 1. Select/Input
│  ├─ Selecionar contatos
│  ├─ Digitar mensagem
│  └─ Upload imagem (opcional)
│
├─ 2. Submit Form
│  └─ POST /api/send
│
├─ 3. Backend
│  ├─ Valida dados
│  ├─ Verifica status instance
│  ├─ Checa rate limits
│  ├─ Formata para n8n
│  └─ Envia via webhook n8n
│
├─ 4. n8n Evolution
│  ├─ Recebe dados
│  ├─ Conecta WhatsApp
│  ├─ Monta mensagem
│  └─ Envia para contatos
│
├─ 5. WhatsApp
│  ├─ Recebe mensagem
│  ├─ Entrega para usuários
│  └─ Retorna status
│
└─ 6. Response
   ├─ Notificação Sonner
   ├─ Success ou Error
   └─ Redireção (opcional)
```

---

## 📈 Escalabilidade Futura

```
Atual (Simples)
│
├─ Status em memória
├─ Single instance
├─ No database overhead
│
↓ Future (Se necessário)
│
├─ Status em cache (Redis)
├─ Multiple instances
├─ Load balancer
├─ Database replication
└─ Monitoring & logging
```

---

**Arquitetura limpa, simples e escalável! 🚀**

