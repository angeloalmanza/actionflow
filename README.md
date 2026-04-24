# ActionFlow

**Trasforma le trascrizioni delle riunioni in task automaticamente.**

ActionFlow è una piattaforma full-stack che usa l'AI per eliminare il lavoro manuale post-riunione: incolla la trascrizione, l'AI estrae gli action items, li assegna ai membri del team e aggiorna il Kanban board — il tutto in background.

![Stack](https://img.shields.io/badge/Laravel-11-FF2D20?style=flat&logo=laravel&logoColor=white)
![Stack](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Stack](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Stack](https://img.shields.io/badge/MySQL-8-4479A1?style=flat&logo=mysql&logoColor=white)
![Stack](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![Stack](https://img.shields.io/badge/Groq-AI-F55036?style=flat)

---

## Come funziona

```
1. Incolla la trascrizione della riunione
2. Laravel dispatcha un Job in coda Redis (risposta immediata)
3. Il worker chiama Groq AI (llama-3.3-70b) con JSON mode
4. L'AI estrae task, assegnatari e scadenze
5. I task appaiono nel Kanban board — email inviata a ogni membro
```

---

## Tech Highlights

| Funzionalità | Implementazione |
|---|---|
| Autenticazione API | Laravel Sanctum (token-based) |
| Job asincroni | Laravel Queues + Redis driver |
| Integrazione AI | Groq API (compatibile OpenAI) con JSON mode |
| Fuzzy matching nomi | `similar_text()` PHP — abbina "Angelo" → "Angelo Demo" |
| Drag & drop | `@hello-pangea/dnd` con aggiornamento ottimistico |
| Polling automatico | React Query `refetchInterval` dinamico |
| Email | Laravel Markdown Mail in coda |
| CORS | Configurato per ambiente Docker |

---

## Setup in 4 passi

### Prerequisiti
- Docker + Docker Compose
- Una chiave API Groq gratuita (console.groq.com)

### 1. Clona il repository

```bash
git clone https://github.com/angeloalmanza/actionflow.git
cd actionflow
```

### 2. Configura le variabili d'ambiente

```bash
cp backend/.env.example backend/.env
```

Apri `backend/.env` e inserisci:
```env
OPENAI_API_KEY=la_tua_chiave_groq
```

Opzionale — per vedere le email, registrati su [mailtrap.io](https://mailtrap.io) e inserisci le credenziali SMTP.

### 3. Avvia i container

```bash
docker compose up -d
```

### 4. Inizializza il database

```bash
docker exec actionflow_app php artisan migrate --seed
```

L'app è disponibile su **http://localhost**

---

## Credenziali demo

| Email | Password | Ruolo |
|---|---|---|
| demo@actionflow.dev | password | Owner workspace |
| alice@actionflow.dev | password | Membro |
| bob@actionflow.dev | password | Membro |

---

## Struttura del progetto

```
actionflow/
├── backend/                    # Laravel 11
│   ├── app/
│   │   ├── Http/Controllers/   # AuthController, WorkspaceController, MeetingController, TaskController
│   │   ├── Jobs/               # ProcessMeetingJob (pipeline AI)
│   │   ├── Mail/               # TaskAssignedMail
│   │   └── Models/             # User, Workspace, Meeting, Task
│   ├── database/
│   │   ├── migrations/         # Schema completo
│   │   └── seeders/            # Dati demo
│   └── routes/api.php          # Tutti gli endpoint REST
│
├── frontend/                   # React 18 + Vite
│   └── src/
│       ├── api/                # Chiamate axios centralizzate
│       ├── components/
│       │   ├── kanban/         # Board, Column, TaskCard con drag & drop
│       │   └── ui/             # Button, Badge, Modal, Layout, Spinner
│       ├── hooks/              # useAuth
│       └── pages/              # Login, Register, Dashboard, Board, Meetings
│
├── nginx/default.conf          # Reverse proxy: /api → PHP, / → Vite
└── docker-compose.yml          # 6 container orchestrati
```

---

## API Reference

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/{id}
GET    /api/workspaces/{id}/stats
POST   /api/workspaces/{id}/members
DELETE /api/workspaces/{id}/members/{userId}

GET    /api/workspaces/{id}/meetings
POST   /api/workspaces/{id}/meetings      ← dispatcha ProcessMeetingJob
GET    /api/meetings/{id}
POST   /api/meetings/{id}/retry

PATCH  /api/tasks/{id}
DELETE /api/tasks/{id}
```
