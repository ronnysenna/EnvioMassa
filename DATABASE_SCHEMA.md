# 📊 Estrutura do Banco de Dados - EnvioMassa

## 📋 Resumo Executivo

O banco de dados do **EnvioMassa** é uma aplicação de gerenciamento de contatos e envio em massa com suporte a grupos, imagens e sistema de seleção. O schema utiliza **PostgreSQL** e está totalmente sincronizado com o Prisma.

---

## 🗂️ Tabelas do Banco de Dados

### 1. **User** (Usuários)
Armazena informações dos usuários do sistema.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | SERIAL | PRIMARY KEY | ID único do usuário |
| `username` | TEXT | UNIQUE | Nome de usuário único |
| `password` | TEXT | - | Senha do usuário |
| `role` | TEXT | DEFAULT 'user' | Papel do usuário (user, admin, etc) |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |

**Relações:**
- ✅ Has Many: `contacts` (1:N)
- ✅ Has Many: `images` (1:N)
- ✅ Has Many: `groups` (1:N)
- ✅ Has One: `selection` (1:1)

---

### 2. **Contact** (Contatos)
Armazena os contatos dos usuários para envio em massa.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | SERIAL | PRIMARY KEY | ID único do contato |
| `nome` | TEXT | - | Nome do contato |
| `telefone` | TEXT | UNIQUE | Telefone único do contato |
| `email` | TEXT | NULLABLE | Email do contato (opcional) |
| `userId` | INTEGER | FOREIGN KEY → User | ID do proprietário |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `updatedAt` | TIMESTAMP | - | Data da última atualização |

**Relações:**
- ✅ Belongs To: `user` (N:1)
- ✅ Has Many: `groups` (via ContactGroup - N:N)

---

### 3. **Group** (Grupos de Contatos)
Permite organizar contatos em grupos para seleção fácil.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | SERIAL | PRIMARY KEY | ID único do grupo |
| `nome` | TEXT | UNIQUE(userId, nome) | Nome do grupo |
| `descricao` | TEXT | NULLABLE | Descrição do grupo |
| `userId` | INTEGER | FOREIGN KEY → User | ID do proprietário |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `updatedAt` | TIMESTAMP | - | Data da última atualização |

**Relações:**
- ✅ Belongs To: `user` (N:1)
- ✅ Has Many: `contacts` (via ContactGroup - N:N)

**Constraints Únicos:**
- Um usuário não pode ter dois grupos com o mesmo nome: `(userId, nome)`

---

### 4. **ContactGroup** (Associação Contatos-Grupos)
Tabela de junção para relacionamento N:N entre contatos e grupos.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | SERIAL | PRIMARY KEY | ID único da associação |
| `contactId` | INTEGER | FOREIGN KEY → Contact | ID do contato |
| `groupId` | INTEGER | FOREIGN KEY → Group | ID do grupo |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |

**Relações:**
- ✅ Belongs To: `contact` (N:1, DELETE CASCADE)
- ✅ Belongs To: `group` (N:1, DELETE CASCADE)

**Constraints Únicos:**
- Um contato não pode estar duplicado no mesmo grupo: `(contactId, groupId)`

---

### 5. **Image** (Imagens)
Armazena referências de imagens enviadas pelos usuários.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | SERIAL | PRIMARY KEY | ID único da imagem |
| `url` | TEXT | - | URL da imagem |
| `filename` | TEXT | - | Nome do arquivo |
| `userId` | INTEGER | FOREIGN KEY → User | ID do proprietário |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |

**Relações:**
- ✅ Belongs To: `user` (N:1)

---

### 6. **Selection** (Seleção de Contatos)
Armazena a seleção temporária de contatos para envio.

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | SERIAL | PRIMARY KEY | ID único da seleção |
| `userId` | INTEGER | FOREIGN KEY → User, UNIQUE | ID do usuário |
| `selectedIds` | JSONB | - | Array JSON com IDs selecionados |
| `updatedAt` | TIMESTAMP | - | Data da última atualização |

**Relações:**
- ✅ Belongs To: `user` (1:1)

---

## 🔄 Diagrama de Relacionamentos

```
┌────────────┐
│   User     │
├────────────┤
│ id (PK)    │
│ username   │
│ password   │
│ role       │
│ createdAt  │
└────────────┘
      │
      ├──1:N──→ Contact
      ├──1:N──→ Image
      ├──1:N──→ Group
      └──1:1──→ Selection

┌────────────┐         ┌─────────────┐         ┌────────────┐
│  Contact   │◄────────┤ContactGroup │────────►│   Group    │
├────────────┤  N:N    ├─────────────┤  N:N    ├────────────┤
│ id (PK)    │         │ id (PK)     │         │ id (PK)    │
│ nome       │         │ contactId   │         │ nome       │
│ telefone   │         │ groupId     │         │ descricao  │
│ email      │         │ createdAt   │         │ createdAt  │
│ userId (FK)│         └─────────────┘         │ updatedAt  │
│ createdAt  │                                 │ userId (FK)│
│ updatedAt  │                                 └────────────┘
└────────────┘

┌────────────┐
│   Image    │
├────────────┤
│ id (PK)    │
│ url        │
│ filename   │
│ userId (FK)│
│ createdAt  │
└────────────┘

┌────────────┐
│ Selection  │
├────────────┤
│ id (PK)    │
│ userId (FK)│ UNIQUE
│ selectedIds│ (JSON)
│ updatedAt  │
└────────────┘
```

---

## 📝 Migrations Aplicadas

### 1️⃣ **20251023230527_init** - Inicialização
- Criou tabelas: `User`, `Contact`, `Image`
- Definiu constraints e índices únicos

### 2️⃣ **20251024163547_add_selection** - Adicionar Sistema de Seleção
- Criou tabela `Selection`
- Relacionamento 1:1 com User

### 3️⃣ **20251105161337_add_contact_groups** - Adicionar Sistema de Grupos
- Adicionou coluna `email` na tabela `Contact`
- Criou tabelas: `Group`, `ContactGroup`
- Implementou relacionamento N:N entre contatos e grupos

### 4️⃣ **20251105203017_add_role_to_user** - Adicionar Sistema de Papéis
- Adicionou coluna `role` na tabela `User`
- Default value: `'user'`

---

## 🔐 Integridade Referencial

| Tabela | Constraint | Ação Deletar | Ação Atualizar |
|--------|-----------|-------------|-----------------|
| Contact | userId → User.id | RESTRICT | CASCADE |
| Image | userId → User.id | RESTRICT | CASCADE |
| Group | userId → User.id | RESTRICT | CASCADE |
| ContactGroup | contactId → Contact.id | CASCADE | CASCADE |
| ContactGroup | groupId → Group.id | CASCADE | CASCADE |
| Selection | userId → User.id | RESTRICT | CASCADE |

---

## 📊 Status Atual

✅ **Database Status:** Sincronizado com o schema Prisma  
✅ **Prisma Client:** Gerado v6.18.0  
✅ **Conexão:** PostgreSQL em `easypanel.ronnysenna.com.br:5420`  
✅ **Database:** `enviomassa`  
⚠️ **Aviso:** Versão do Prisma 6.18.0 (disponível 7.1.0)

---

## 🚀 Comandos Úteis

```bash
# Gerar Prisma Client
npx prisma generate

# Ver status das migrations
npx prisma migrate status

# Aplicar migrations em desenvolvimento
npx prisma migrate dev --name <description>

# Aplicar migrations em produção
npx prisma migrate deploy

# Resetar banco (CUIDADO: apaga tudo!)
npx prisma migrate reset

# Abrir Prisma Studio
npx prisma studio
```

---

## 💡 Observações Importantes

1. **Relação de Telefone Única:** Cada telefone só pode estar associado a um contato
2. **Grupos Únicos por Usuário:** Um usuário não pode ter dois grupos com o mesmo nome
3. **Cascata de Deleção:** Ao deletar um contato, todos os relacionamentos com grupos são removidos
4. **Selection Única:** Cada usuário tem apenas uma seleção ativa
5. **Email Opcional:** O campo email do contato é opcional

---

**Última Atualização:** 4 de dezembro de 2025  
**Status:** ✅ Pronto para Produção
