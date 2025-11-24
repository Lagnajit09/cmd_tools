const fs = require("fs-extra");
const path = require("path");

async function generateExpress(targetPath, config) {
  const {
    serverName,
    useTypeScript,
    database,
    orm,
    packageManager,
    generateEnv,
    gitExists,
    initGit,
  } = config;

  // Create package.json
  const packageJson = {
    name: serverName,
    version: "1.0.0",
    description: "",
    main: useTypeScript ? "dist/index.js" : "src/index.js",
    scripts: {
      start: useTypeScript ? "node dist/index.js" : "node src/index.js",
      dev: useTypeScript
        ? "ts-node-dev --respawn src/index.ts"
        : "nodemon src/index.js",
      build: useTypeScript ? "tsc" : undefined,
    },
    keywords: [],
    author: "",
    license: "ISC",
    dependencies: {
      express: "^4.18.2",
      cors: "^2.8.5",
      dotenv: "^16.0.3",
    },
    devDependencies: {},
  };

  // Remove undefined scripts
  packageJson.scripts = Object.fromEntries(
    Object.entries(packageJson.scripts).filter(([_, v]) => v !== undefined)
  );

  if (useTypeScript) {
    packageJson.dependencies["@types/express"] = "^4.17.17";
    packageJson.dependencies["@types/cors"] = "^2.8.13";
    packageJson.dependencies["@types/node"] = "^20.0.0";
    packageJson.devDependencies["typescript"] = "^5.0.0";
    packageJson.devDependencies["ts-node-dev"] = "^2.0.0";
  } else {
    packageJson.devDependencies["nodemon"] = "^3.0.0";
  }

  // Add database dependencies
  if (orm === "Prisma") {
    packageManager === "npm"
      ? (packageJson.devDependencies["prisma"] = "latest")
      : (packageJson.devDependencies["prisma"] = "latest");

    packageJson.dependencies["@prisma/client"] = "latest";

    if (database === "PostgreSQL") {
      packageJson.dependencies["@prisma/adapter-pg"] = "latest";
      packageJson.dependencies["pg"] = "latest";
      packageJson.dependencies["@types/pg"] = "latest";
    } else if (database === "MySQL") {
      packageJson.dependencies["mysql2"] = "latest";
    } else if (database === "MongoDB") {
      // No specific adapter needed for Mongo usually
    }
    packageJson.scripts["prisma:generate"] = "prisma generate";
    packageJson.scripts["prisma:migrate"] = "prisma migrate dev";
  } else if (database === "MongoDB") {
    if (orm === "Mongoose") {
      packageJson.dependencies["mongoose"] = "latest";
    } else {
      packageJson.dependencies["mongodb"] = "latest";
      packageJson.dependencies["dotenv"] = "latest";
    }
  } else if (database === "PostgreSQL") {
    packageJson.dependencies["pg"] = "latest";
  } else if (database === "MySQL") {
    packageJson.dependencies["mysql2"] = "latest";
  }

  fs.writeJsonSync(path.join(targetPath, "package.json"), packageJson, {
    spaces: 2,
  });

  // Create src directory
  const srcPath = path.join(targetPath, "src");
  fs.mkdirSync(srcPath);

  // Create main file
  const extension = useTypeScript ? "ts" : "js";
  const indexContent = useTypeScript
    ? `import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to ${serverName}!' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server is running on port \${PORT}\`);
});
`
    : `const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ${serverName}!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server is running on port \${PORT}\`);
});
`;

  fs.writeFileSync(path.join(srcPath, `index.${extension}`), indexContent);

  // Create .env file if requested
  if (generateEnv) {
    let envContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
`;

    if (database === "Prisma") {
      envContent += `
# Database Configuration (Prisma)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
`;
    } else if (database === "MongoDB") {
      envContent += `
# Database Configuration (MongoDB)
MONGODB_URI=mongodb://localhost:27017/${serverName}
DB_NAME=${serverName}
`;
    } else if (database === "PostgreSQL") {
      envContent += `
# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${serverName}
DB_USER=postgres
DB_PASSWORD=yourpassword
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/${serverName}
`;
    } else if (database === "MySQL") {
      envContent += `
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${serverName}
DB_USER=root
DB_PASSWORD=yourpassword
DATABASE_URL=mysql://root:yourpassword@localhost:3306/${serverName}
`;
    }

    envContent += `
# JWT Configuration (if needed)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# API Configuration
API_VERSION=v1
`;

    fs.writeFileSync(path.join(targetPath, ".env"), envContent);
    fs.writeFileSync(
      path.join(targetPath, ".env.example"),
      envContent.replace(/=.+/g, "=")
    );
  }

  // Create .gitignore with comprehensive exclusions (only if Git is initialized)
  if (initGit || gitExists) {
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
coverage/
*.lcov
.nyc_output

# Logs
logs/
*.log

# OS
Thumbs.db

# Misc
.cache/
temp/
tmp/
`;

    // Add package manager specific files
    if (packageManager === "yarn") {
      fs.writeFileSync(
        path.join(targetPath, ".gitignore"),
        gitignoreContent + "\n# Yarn\nyarn.lock\n.yarn/\n.pnp.*\n"
      );
    } else if (packageManager === "pnpm") {
      fs.writeFileSync(
        path.join(targetPath, ".gitignore"),
        gitignoreContent + "\n# pnpm\npnpm-lock.yaml\n.pnpm-debug.log\n"
      );
    } else if (packageManager === "bun") {
      fs.writeFileSync(
        path.join(targetPath, ".gitignore"),
        gitignoreContent + "\n# Bun\nbun.lockb\n"
      );
    } else {
      fs.writeFileSync(
        path.join(targetPath, ".gitignore"),
        gitignoreContent + "\n# npm\npackage-lock.json\n"
      );
    }
  }

  // Create TypeScript config if needed
  if (useTypeScript) {
    const tsConfig = {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        lib: ["ES2020"],
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        moduleResolution: "node",
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    };
    fs.writeJsonSync(path.join(targetPath, "tsconfig.json"), tsConfig, {
      spaces: 2,
    });
  }

  // Create Prisma schema and config if needed
  if (orm === "Prisma") {
    const prismaPath = path.join(targetPath, "prisma");
    fs.mkdirSync(prismaPath);

    // Create prisma.config.ts
    const prismaConfigContent = `import { defineConfig } from '@prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: {
    kind: 'multi',
    folder: 'prisma/schema',
  },
  datasource: {
    provider: '${
      database === "PostgreSQL"
        ? "postgresql"
        : database === "MySQL"
        ? "mysql"
        : "mongodb"
    }',
    url: process.env.DATABASE_URL,
  },
});
`;
    fs.writeFileSync(
      path.join(targetPath, "prisma.config.ts"),
      prismaConfigContent
    );

    // Create schema.prisma (minimal, as config handles connection now mostly, but schema still needed for models)
    // With Prisma 7 config, we might use multi-file schema, but let's stick to standard schema.prisma for simplicity unless 'multi' is enforced.
    // The config above uses 'folder: "prisma/schema"', so we should create that folder.

    const schemaFolderPath = path.join(prismaPath, "schema");
    fs.mkdirSync(schemaFolderPath, { recursive: true });

    const schema = `generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
    fs.writeFileSync(path.join(schemaFolderPath, "schema.prisma"), schema);

    // Create src/lib/db.ts
    const libPath = path.join(targetPath, "src", "lib");
    fs.mkdirSync(libPath, { recursive: true });

    let dbTsContent = "";
    if (database === "PostgreSQL") {
      dbTsContent = `import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
`;
    } else {
      // Fallback for others without adapter for now
      dbTsContent = `import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export default prisma;
`;
    }
    fs.writeFileSync(path.join(libPath, "db.ts"), dbTsContent);
  } else if (database === "MongoDB" && orm !== "Mongoose") {
    // Native MongoDB Driver Setup
    const libPath = path.join(targetPath, "src", "lib");
    fs.mkdirSync(libPath, { recursive: true });

    const dbTsContent = `import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || '${serverName}';

const client = new MongoClient(url);

let db: Db;

export async function connectToDatabase() {
  if (db) return db;
  
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export { client };
`;
    fs.writeFileSync(path.join(libPath, "db.ts"), dbTsContent);
  }

  // Create README
  const installCmd = getInstallCommand(packageManager);
  const devCmd = getDevCommand(packageManager);

  const readme = `# ${serverName}

Express.js ${useTypeScript ? "TypeScript" : "JavaScript"} Server

## Features

- ✅ Express.js server
- ✅ CORS enabled
- ✅ Environment variables support
${useTypeScript ? "- ✅ TypeScript configured" : ""}
${database ? `- ✅ ${database} integration` : ""}
- ✅ Health check endpoint

## Getting Started

### Installation

\`\`\`bash
${installCmd}
\`\`\`

### Environment Variables

${
  generateEnv
    ? "Copy `.env.example` to `.env` and update the values:"
    : "Create a `.env` file in the root directory:"
}

\`\`\`env
PORT=3000
NODE_ENV=development
${database ? "DATABASE_URL=your_database_url" : ""}
\`\`\`

${
  database === "Prisma"
    ? `### Prisma Setup

\`\`\`bash
${packageManager === "npm" ? "npm run" : packageManager} prisma:generate
${packageManager === "npm" ? "npm run" : packageManager} prisma:migrate
\`\`\`
`
    : ""
}

### Running the Server

Development mode:
\`\`\`bash
${devCmd}
\`\`\`

Production mode:
\`\`\`bash
${packageManager === "npm" ? "npm start" : `${packageManager} start`}
\`\`\`

The server will start on http://localhost:3000

## API Endpoints

- \`GET /\` - Welcome message
- \`GET /health\` - Health check

## Project Structure

\`\`\`
${serverName}/
├── src/
│   └── index.${useTypeScript ? "ts" : "js"}    # Main application file
${
  useTypeScript
    ? "├── dist/              # Compiled JavaScript (generated)\n"
    : ""
}${
    database === "Prisma"
      ? "├── prisma/\n│   └── schema.prisma # Prisma schema\n"
      : ""
  }├── .env              # Environment variables
├── .gitignore        # Git ignore rules
├── package.json      # Dependencies and scripts
${
  useTypeScript ? "├── tsconfig.json     # TypeScript configuration\n" : ""
}└── README.md         # This file
\`\`\`

## Package Manager

This project uses **${packageManager}**. 

${
  packageManager !== "npm"
    ? `Make sure you have ${packageManager} installed:
\`\`\`bash
${packageManager === "yarn" ? "npm install -g yarn" : ""}${
        packageManager === "pnpm" ? "npm install -g pnpm" : ""
      }${
        packageManager === "bun"
          ? "curl -fsSL https://bun.sh/install | bash"
          : ""
      }
\`\`\`
`
    : ""
}

## Scripts

- \`${devCmd}\` - Start development server with hot reload
- \`${
    packageManager === "npm" ? "npm start" : `${packageManager} start`
  }\` - Start production server
${
  useTypeScript
    ? `- \`${
        packageManager === "npm" ? "npm run" : packageManager
      } build\` - Compile TypeScript to JavaScript\n`
    : ""
}${
    database === "Prisma"
      ? `- \`${
          packageManager === "npm" ? "npm run" : packageManager
        } prisma:generate\` - Generate Prisma client
- \`${
          packageManager === "npm" ? "npm run" : packageManager
        } prisma:migrate\` - Run database migrations
`
      : ""
  }

## License

MIT
`;

  fs.writeFileSync(path.join(targetPath, "README.md"), readme);
}

function getInstallCommand(packageManager) {
  const commands = {
    npm: "npm install",
    yarn: "yarn install",
    pnpm: "pnpm install",
    bun: "bun install",
  };
  return commands[packageManager] || "npm install";
}

function getDevCommand(packageManager) {
  const commands = {
    npm: "npm run dev",
    yarn: "yarn dev",
    pnpm: "pnpm dev",
    bun: "bun dev",
  };
  return commands[packageManager] || "npm run dev";
}

module.exports = { generateExpress };
