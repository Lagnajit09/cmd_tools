# 🚀 create-http-server

A powerful interactive CLI tool to **bootstrap fully configured HTTP servers** in seconds — powered by **Node.js** and supporting both **Express** and **Django** frameworks.

Create servers, configure databases, initialize Git, and set up environments — all from your terminal.

---

## 📦 Installation

Install globally via npm:

```bash
npm install -g create-http-server
```

Or use it directly via `npx` (no installation required):

```bash
npx create-http-server
```

---

## ⚙️ Usage

```bash
create-http-server [server-name] [target-path]
```

| Argument      | Description                              | Default             |
| ------------- | ---------------------------------------- | ------------------- |
| `server-name` | Name of your new server project          | Prompted if missing |
| `target-path` | Path where the project should be created | Current directory   |

### Example Commands

```bash
# Create in current directory
create-http-server my-api

# Create explicitly in current directory
create-http-server my-api .

# Create inside a subfolder
create-http-server my-api ./projects

# Create at an absolute path
create-http-server my-api /path/to/backend
```

---

## 🧠 Interactive Setup

When you run the command without arguments, it will guide you through prompts such as:

- Server name
- Framework choice (`Express` or `Django`)
- Language preference (`JavaScript` or `TypeScript` for Express)
- Database selection (`SQLite`, `PostgreSQL`, `MySQL`, `MongoDB`)
- Package manager (`npm`, `yarn`, `pnpm`, or `bun`)
- Environment file creation
- Git initialization (with optional remote setup)

---

## 🏗️ Generated Project Types

### 🟢 **Express (Node.js)**

If you choose **Express**, the tool:

- Creates a complete Express boilerplate
- Supports both **JavaScript** and **TypeScript**
- Adds database setup files
- Generates `.env` and `.gitignore`
- Installs dependencies automatically
- Configures a package manager of your choice
- Initializes Git (if selected)

**Next steps (example):**

```bash
cd my-api
npm install
npm run dev
```

---

### 🔵 **Django (Python)**

If you choose **Django**, the tool:

- Creates a Python virtual environment (`venv`)
- Installs Django and dependencies
- Generates a REST-ready project with:

  - CORS configuration
  - Environment variable integration
  - Auto-generated `.env` and `.env.example`
  - Custom app (you name it)

- Initializes Git and `.gitignore`
- Runs initial migrations

**Next steps (example):**

```bash
cd my-django-api
source venv/bin/activate   # or venv\Scripts\activate on Windows
python manage.py runserver
```

---

## 💾 Databases Supported

| Framework | Supported Databases                             |
| --------- | ----------------------------------------------- |
| Express   | SQLite, PostgreSQL, MySQL, MongoDB              |
| Django    | SQLite, PostgreSQL, MySQL, MongoDB (via Djongo) |

Each setup automatically configures the environment and `.env` variables.

---

## 🧰 Features

✅ Interactive CLI prompts  
 ✅ Express or Django project generator  
 ✅ TypeScript support (for Express)  
 ✅ Virtual environment setup (for Django)  
 ✅ Auto-generated `.env` and `.gitignore`  
 ✅ Database configuration  
 ✅ Git initialization (with remote option)  
 ✅ Cross-platform compatibility (Windows, macOS, Linux)

---

## 📄 Example Workflow

```bash
$ create-http-server
🚀 Welcome to Create Server!

? Enter your server name: my-server
? Choose a framework: Express
? Use TypeScript? Yes
? Choose a database: PostgreSQL
? Do you want to create a .env file? Yes
? Initialize a Git repository? Yes
? Add a remote Git origin? No

📦 Creating your server...
✅ Server created successfully!

Next steps:
  cd my-server
  npm install
  npm run dev
```

---

## 🧪 Project Structure (Example)

### Express (TypeScript)

```
my-api/
├── src/
│   ├── index.ts
│   ├── routes/
│   └── config/
├── package.json
├── tsconfig.json
├── .env
├── .gitignore
└── README.md
```

### Django

```
my-django-api/
├── my_django_api/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── api/
│   ├── views.py
│   ├── urls.py
│   └── models.py
├── venv/
├── .env
├── requirements.txt
└── README.md
```

---

## 🧑‍💻 CLI Help

```bash
create-http-server --help
```

**Output:**

```
Usage: create-http-server [server-name] [target-path]

Create a new server project

Arguments:
  server-name    Name of the server project
  target-path    Path where to create the server (default: current directory)

Examples:
  $ create-http-server my-api
  $ create-http-server my-api ./projects
  $ create-http-server my-api /path/to/projects
```

---

## 🐙 Git Integration

- Automatically initializes a Git repository (if chosen)
- Adds `.gitignore` suited for Express or Django
- Optionally adds a remote origin

---

## 🛠️ Requirements

- Node.js ≥ 16.0
- Python ≥ 3.8 (for Django projects)
- npm / yarn / pnpm / bun
- Git (optional but recommended)

---

## 🌍 Cross-Platform Support

Tested on:

- 🪟 Windows 10/11
- 🐧 Ubuntu / WSL
- 🍎 macOS Ventura+

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

> ⚡ **create-http-server** — from zero to running backend in seconds.
