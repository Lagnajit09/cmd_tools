const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
const chalk = require("chalk");

async function generateDjango(targetPath, config) {
  const {
    serverName,
    djangoAppName,
    database,
    generateEnv,
    gitExists,
    initGit,
  } = config;
  const appName = djangoAppName;

  console.log(chalk.yellow("Setting up Django project..."));

  // Create requirements.txt
  let requirements = "Django>=4.2\ndjango-cors-headers\npython-dotenv\n";

  if (database === "PostgreSQL") {
    requirements += "psycopg2-binary\n";
  } else if (database === "MySQL") {
    requirements += "mysqlclient\n";
  } else if (database === "MongoDB") {
    requirements += "djongo\n";
  }

  fs.writeFileSync(path.join(targetPath, "requirements.txt"), requirements);

  // Create .gitignore (only if Git is initialized)
  if (initGit || gitExists) {
    // Create comprehensive .gitignore for Django
    const gitignoreContent = `# Python
*.pyc
*.pyo
*.pyd
__pycache__/
*.so
*.egg
*.egg-info/
dist/
build/
  
# Django
*.log
db.sqlite3
db.sqlite3-journal
media/
staticfiles/
  
# Environment
.env
.env.local
venv/
env/
ENV/
  
# IDE
.vscode/
.idea/
*.swp
*.swo
*~
  
# OS
.DS_Store
Thumbs.db
  
# Testing
.coverage
htmlcov/
.pytest_cache/
.tox/
  `;
    fs.writeFileSync(path.join(targetPath, ".gitignore"), gitignoreContent);
  }

  // Create .env file if requested
  if (generateEnv) {
    let envContent = `# Django Configuration
DEBUG=True
SECRET_KEY=django-insecure-${generateSecretKey()}

# Server Configuration
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
`;

    if (database === "PostgreSQL") {
      envContent += `
# PostgreSQL Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=${serverName}_db
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/${serverName}_db
`;
    } else if (database === "MySQL") {
      envContent += `
# MySQL Database Configuration
DB_ENGINE=django.db.backends.mysql
DB_NAME=${serverName}_db
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=3306
DATABASE_URL=mysql://root:yourpassword@localhost:3306/${serverName}_db
`;
    } else {
      envContent += `
# SQLite Database Configuration
DATABASE_URL=sqlite:///db.sqlite3
`;
    }

    envContent += `
# Email Configuration (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
`;

    fs.writeFileSync(path.join(targetPath, ".env"), envContent);
    fs.writeFileSync(
      path.join(targetPath, ".env.example"),
      envContent.replace(/=.+/g, "=")
    );
  } else {
    // Create minimal .env even if not requested (needed for Django to run)
    const envContent = `DEBUG=True
SECRET_KEY=django-insecure-${generateSecretKey()}
DATABASE_URL=sqlite:///db.sqlite3
`;
    fs.writeFileSync(path.join(targetPath, ".env"), envContent);
  }

  try {
    // Check if Python is installed
    console.log(chalk.yellow("Checking Python installation..."));
    try {
      execSync("python --version", { stdio: "ignore" });
    } catch (error) {
      try {
        execSync("python3 --version", { stdio: "ignore" });
      } catch (error) {
        console.log(
          chalk.red(
            "Python is not installed. Please install Python 3.8+ and try again."
          )
        );
        return;
      }
    }

    const pythonCmd = getPythonCommand();

    // Create virtual environment
    console.log(chalk.yellow("Creating virtual environment..."));
    execSync(`${pythonCmd} -m venv venv`, {
      cwd: targetPath,
      stdio: "inherit",
    });

    // Get pip command based on OS
    const pipCmd =
      process.platform === "win32"
        ? path.join(targetPath, "venv", "Scripts", "pip")
        : path.join(targetPath, "venv", "bin", "pip");

    const pythonVenvCmd =
      process.platform === "win32"
        ? path.join(targetPath, "venv", "Scripts", "python")
        : path.join(targetPath, "venv", "bin", "python");

    // Install Django and dependencies
    console.log(chalk.yellow("Installing Django and dependencies..."));
    execSync(`"${pipCmd}" install -r requirements.txt`, {
      cwd: targetPath,
      stdio: "inherit",
    });

    // Create Django project
    console.log(chalk.yellow("Creating Django project structure..."));
    const djangoAdminCmd =
      process.platform === "win32"
        ? path.join(targetPath, "venv", "Scripts", "django-admin")
        : path.join(targetPath, "venv", "bin", "django-admin");

    // Create the project in the current directory
    execSync(`"${djangoAdminCmd}" startproject ${serverName} .`, {
      cwd: targetPath,
      stdio: "inherit",
    });

    // Create an API app
    console.log(chalk.yellow(`Creating app: ${appName}...`));
    execSync(`"${pythonVenvCmd}" manage.py startapp ${appName}`, {
      cwd: targetPath,
      stdio: "inherit",
    });

    // Update settings.py to use environment variables and add CORS
    updateSettingsFile(targetPath, serverName, appName, database);

    // Create a basic view in the API app
    createApiViews(targetPath, appName);

    // Create URLs for the API app
    createApiUrls(targetPath, appName);

    // Update main urls.py
    updateMainUrls(targetPath, serverName, appName);

    // Run migrations
    console.log(chalk.yellow("Running initial migrations..."));
    execSync(`"${pythonVenvCmd}" manage.py migrate`, {
      cwd: targetPath,
      stdio: "inherit",
    });

    console.log(chalk.green("Django project setup complete!"));
  } catch (error) {
    console.log(chalk.red("Error during Django setup:"), error.message);
    console.log(chalk.yellow("\nYou can manually set up Django by running:"));
    console.log(chalk.white("1. python -m venv venv"));
    console.log(
      chalk.white(
        "2. source venv/bin/activate  # or venv\\Scripts\\activate on Windows"
      )
    );
    console.log(chalk.white("3. pip install -r requirements.txt"));
    console.log(chalk.white(`4. django-admin startproject ${serverName} .`));
    console.log(chalk.white(`5. python manage.py startapp ${appName}`));
  }

  // Create README
  const readme = `# ${serverName}

Django REST API Server

## Setup Instructions

### Automatic Setup (Already Done)
The project has been set up automatically with:
- Virtual environment created
- Dependencies installed
- Django project and ${appName} app created
- Initial migrations run

### Manual Setup (If Needed)

1. Activate virtual environment:
   \`\`\`bash
   # On Unix/macOS:
   source venv/bin/activate
   
   # On Windows:
   venv\\Scripts\\activate
   \`\`\`

2. Install dependencies (if not already installed):
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Run migrations (if not already run):
   \`\`\`bash
   python manage.py migrate
   \`\`\`

## Running the Server

1. Activate the virtual environment (see above)

2. Start the development server:
   \`\`\`bash
   python manage.py runserver
   \`\`\`

3. Visit http://127.0.0.1:8000/ in your browser

## Project Structure

- \`${serverName}/\` - Main project configuration
- \`${appName}/\` - ${appName} application
- \`manage.py\` - Django management script
- \`.env\` - Environment variables
- \`requirements.txt\` - Python dependencies

## Creating a Superuser

\`\`\`bash
python manage.py createsuperuser
\`\`\`

## Database Configuration

${getDatabaseInstructions(database)}

## API Endpoints

- GET / - Welcome message
- GET /${appName}/ - ${appName} root

## Next Steps

1. Define your models in \`${appName}/models.py\`
2. Create serializers in \`${appName}/serializers.py\`
3. Add views in \`${appName}/views.py\`
4. Configure URLs in \`${appName}/urls.py\`
5. Run \`python manage.py makemigrations\` and \`python manage.py migrate\`

## Useful Commands

- \`python manage.py makemigrations\` - Create database migrations
- \`python manage.py migrate\` - Apply migrations
- \`python manage.py createsuperuser\` - Create admin user
- \`python manage.py runserver\` - Start development server
- \`python manage.py shell\` - Open Django shell
`;
  fs.writeFileSync(path.join(targetPath, "README.md"), readme);
}

function getPythonCommand() {
  try {
    execSync("python --version", { stdio: "ignore" });
    return "python";
  } catch (error) {
    return "python3";
  }
}

function generateSecretKey() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)";
  let key = "";
  for (let i = 0; i < 50; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function updateSettingsFile(targetPath, serverName, appName, database) {
  const settingsPath = path.join(targetPath, serverName, "settings.py");
  let settings = fs.readFileSync(settingsPath, "utf8");

  // Add imports at the top
  // Django always includes "from pathlib import Path" in settings.py
  const pathlibIndex = settings.indexOf("from pathlib import Path");
  if (pathlibIndex === -1) {
    // Fallback: prepend imports if pathlib import not found (shouldn't happen with Django)
    settings =
      `import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

` + settings;
  } else {
    settings =
      `import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

` + settings.substring(pathlibIndex);
  }

  // Update SECRET_KEY
  settings = settings.replace(
    /SECRET_KEY = .+/,
    `SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fallback-key')`
  );

  // Update DEBUG
  settings = settings.replace(
    /DEBUG = .+/,
    `DEBUG = os.getenv('DEBUG', 'False') == 'True'`
  );

  // Update ALLOWED_HOSTS
  settings = settings.replace(
    /ALLOWED_HOSTS = \[\]/,
    `ALLOWED_HOSTS = ['localhost', '127.0.0.1']`
  );

  // Add CORS and app to INSTALLED_APPS
  settings = settings.replace(
    /INSTALLED_APPS = \[/,
    `INSTALLED_APPS = [
    'corsheaders',
    '${appName}',`
  );

  // Add CORS middleware
  settings = settings.replace(
    /MIDDLEWARE = \[/,
    `MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',`
  );

  // Add CORS settings at the end
  settings += `

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = True  # Set to False in production
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
`;

  // Update database configuration if needed
  if (database === "PostgreSQL") {
    settings = settings.replace(
      /'ENGINE': 'django\.db\.backends\.sqlite3',/,
      `'ENGINE': 'django.db.backends.postgresql',`
    );
    settings = settings.replace(
      /'NAME': BASE_DIR \/ 'db\.sqlite3',/,
      `'NAME': os.getenv('DB_NAME', 'postgres'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),`
    );
  } else if (database === "MySQL") {
    settings = settings.replace(
      /'ENGINE': 'django\.db\.backends\.sqlite3',/,
      `'ENGINE': 'django.db.backends.mysql',`
    );
    settings = settings.replace(
      /'NAME': BASE_DIR \/ 'db\.sqlite3',/,
      `'NAME': os.getenv('DB_NAME', 'mysql'),
        'USER': os.getenv('DB_USER', 'root'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '3306'),`
    );
  }

  fs.writeFileSync(settingsPath, settings);
}

function createApiViews(targetPath, appName) {
  const viewsContent = `from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def index(request):
    """API root endpoint"""
    return JsonResponse({
        'message': 'Welcome to the API!',
        'version': '1.0.0',
        'endpoints': {
            '/': 'API root',
            '/${appName}/': '${appName} information',
        }
    })

@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'API is running'
    })
`;

  fs.writeFileSync(path.join(targetPath, appName, "views.py"), viewsContent);
}

function createApiUrls(targetPath, appName) {
  const urlsContent = `from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='${appName}-root'),
    path('health/', views.health_check, name='health-check'),
]
`;

  fs.writeFileSync(path.join(targetPath, appName, "urls.py"), urlsContent);
}

function updateMainUrls(targetPath, serverName, appName) {
  const urlsPath = path.join(targetPath, serverName, "urls.py");
  const urlsContent = `from django.contrib import admin
from django.urls import path, include
from ${appName}.views import index

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index, name='home'),
    path('${appName}/', include('${appName}.urls')),
]
`;

  fs.writeFileSync(urlsPath, urlsContent);
}

function getDatabaseInstructions(database) {
  if (database === "PostgreSQL") {
    return `The project is configured to use PostgreSQL. Update your .env file:

\`\`\`
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
\`\`\`

Make sure PostgreSQL is installed and running.`;
  } else if (database === "MySQL") {
    return `The project is configured to use MySQL. Update your .env file:

\`\`\`
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=3306
\`\`\`

Make sure MySQL is installed and running.`;
  } else {
    return `The project uses SQLite by default (no additional setup required).
The database file will be created as \`db.sqlite3\` in the project root.`;
  }
}

module.exports = { generateDjango };
