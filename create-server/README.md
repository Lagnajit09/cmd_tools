# 🚀 create-http-server

A powerful interactive CLI tool to **bootstrap modern HTTP servers** in seconds — supporting:

- **Express (JavaScript / TypeScript)**
- **NestJS (TypeScript)**
- **Django (Python)**

Create servers, configure databases, set up environments, initialize Git, and auto-generate boilerplates — all from your terminal.

---

## 📦 Installation

```bash
npm install -g create-http-server
```

Or run directly with npx:

```bash
npx create-http-server
```

---

## ⚙️ Usage

```bash
create-http-server [server-name] [target-path]
```

| Argument      | Description               | Default           |
| ------------- | ------------------------- | ----------------- |
| `server-name` | Name of your project      | Prompted          |
| `target-path` | Parent folder for project | Current directory |

### Examples

```bash
create-http-server my-api
create-http-server my-api ./projects
create-http-server my-api /absolute/path
create-http-server
```

Running without arguments triggers full interactive setup.

---

## 🧠 Interactive Setup Options

When the CLI starts, it asks for:

- Server name
- Framework: **Express**, **NestJS**, or **Django**
- For Express: TypeScript or JavaScript
- Database selection:

  - SQLite
  - PostgreSQL
  - MySQL
  - MongoDB
  - Prisma (NestJS only)

- Package manager:

  - npm, yarn, pnpm, bun

- Create `.env` file?
- Initialize Git?
- Add Git remote?

---

## 🏗️ Framework Support

---

# 🟩 1. Express (JavaScript / TypeScript)

### Features:

- JS or TS support
- Basic routing setup
- Environment variable setup
- Database selection
- Optional Git initialization
- Auto-generated README

### Next Steps (example):

```bash
cd my-express-api
npm install
npm run dev
```

**Databases Supported:**

- SQLite
- PostgreSQL
- MongoDB
- MySQL

---

# 🟦 2. NestJS (TypeScript)

Your CLI now supports full **NestJS project generation** using the official Nest CLI — with additional enhancements:

### Features:

- TypeScript enabled by default
- Pre-configured:

  - CORS
  - Validation pipes
  - Environment variables

- Database support:

  - Prisma
  - MongoDB (Mongoose)
  - PostgreSQL / MySQL (TypeORM)

- Auto-generated:

  - `app.module.ts` with database integration
  - Health check endpoint
  - Updated README
  - `.env` + `.env.example`
  - Optional Git setup

### Next steps after generation:

```bash
cd my-nest-api
npm install
npm run start:dev
```

### Prisma-supported workflows:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

---

# 🟧 3. Django (Python)

### Features:

- Creation of Python virtual environment
- Installation of Django & database drivers
- Auto-generated:

  - settings.py with env support
  - API app with routes
  - CORS configuration
  - `.env` and `.env.example`
  - `.gitignore`
  - README.md

- Runs initial migrations
- Optional Git initialization

### Next steps:

```bash
cd my-django-app
source venv/bin/activate   # Windows: venv\Scripts\activate
python manage.py runserver
```

---

## 🧬 Database Support Matrix

| Framework | SQLite | PostgreSQL | MySQL | MongoDB    | Prisma |
| --------- | ------ | ---------- | ----- | ---------- | ------ |
| Express   | ✅     | ✅         | ✅    | ✅         | ✅     |
| NestJS    | ❌     | ✅         | ✅    | ✅         | ✅     |
| Django    | ✅     | ✅         | ✅    | Via Djongo | ❌     |

---

## 📂 Example Project Structures

### Express

```
my-api/
 ├── src/
 ├── package.json
 ├── .env
 ├── .gitignore
 └── README.md
```

### NestJS

```
my-nest-api/
 ├── src/
 ├── prisma/ (if Prisma)
 ├── .env
 ├── tsconfig.json
 ├── nest-cli.json
 └── README.md
```

### Django

```
my-django-api/
 ├── my_django_api/
 ├── api/
 ├── venv/
 ├── requirements.txt
 ├── .env
 └── README.md
```

---

## 🧐 CLI Help

```bash
create-http-server --help
```

---

## 🧰 Features Summary

- Interactive questionnaire
- Three full frameworks supported
- Auto environment setup
- Database-aware templates
- Git initialization
- Cross-platform
- Auto-generated README for each project
- Python venv automation (Django)
- NestJS CLI automation

---

## 🔧 Requirements

- Node.js ≥ 16
- Python ≥ 3.8 (for Django)
- npm / yarn / pnpm / bun
- Git (optional)

---

## 🤝 Contributing

Contributions are welcome!  
If you'd like to add new frameworks, features, or database integrations:

1. Fork this repo [GitHub](https://github.com/Lagnajit09/cmd_tools/tree/main/create-server)
2. Create your feature branch: `git checkout -b feature/new-framework`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-framework`
5. Create a Pull Request

---

## 🧾 License

MIT © 2025 [Lagnajit Moharana]  
Feel free to use, modify, and distribute.

---

## 🌟 Acknowledgments

- [Commander.js](https://github.com/tj/commander.js) for CLI handling
- [Chalk](https://github.com/chalk/chalk) for terminal colors
- [fs-extra](https://github.com/jprichardson/node-fs-extra) for robust file ops
- [Django](https://www.djangoproject.com/) & [Express](https://expressjs.com/) for their power and simplicity

---

## 🌟 Summary

`create-http-server` helps you generate a backend server in **Express**, **NestJS**, or **Django** with database support and full boilerplate — in seconds.
