const fs = require("fs-extra");
const path = require("path");

async function generateExpress(
  targetPath,
  serverName,
  useTypeScript,
  database
) {
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
  if (database === "Prisma") {
    packageJson.dependencies["@prisma/client"] = "^5.0.0";
    packageJson.devDependencies["prisma"] = "^5.0.0";
    packageJson.scripts["prisma:generate"] = "prisma generate";
    packageJson.scripts["prisma:migrate"] = "prisma migrate dev";
  } else if (database === "MongoDB") {
    packageJson.dependencies["mongoose"] = "^7.0.0";
  } else if (database === "PostgreSQL") {
    packageJson.dependencies["pg"] = "^8.11.0";
  } else if (database === "MySQL") {
    packageJson.dependencies["mysql2"] = "^3.0.0";
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

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
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

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
`;

  fs.writeFileSync(path.join(srcPath, `index.${extension}`), indexContent);

  // Create .env file
  fs.writeFileSync(path.join(targetPath, ".env"), "PORT=3000\n");

  // Create .gitignore
  fs.writeFileSync(
    path.join(targetPath, ".gitignore"),
    "node_modules\n.env\ndist\n"
  );

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
      },
      include: ["src/**/*"],
      exclude: ["node_modules"],
    };
    fs.writeJsonSync(path.join(targetPath, "tsconfig.json"), tsConfig, {
      spaces: 2,
    });
  }

  // Create Prisma schema if needed
  if (database === "Prisma") {
    const prismaPath = path.join(targetPath, "prisma");
    fs.mkdirSync(prismaPath);
    const schema = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
`;
    fs.writeFileSync(path.join(prismaPath, "schema.prisma"), schema);
  }

  // Create README
  const readme = `# ${serverName}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

${
  database === "Prisma"
    ? `3. Set up Prisma:
   \`\`\`bash
   npm run prisma:generate
   npm run prisma:migrate
   \`\`\``
    : ""
}
`;
  fs.writeFileSync(path.join(targetPath, "README.md"), readme);
}

module.exports = { generateExpress };
