### Step 1: Create the Project Directory

1. Open your terminal or command prompt.
2. Navigate to the location where you want to create your project.
3. Create a new directory for your project:
   ```bash
   mkdir my-project
   cd my-project
   ```

### Step 2: Initialize a New Node.js Project

1. Initialize a new Node.js project:
   ```bash
   npm init -y
   ```

### Step 3: Install TypeScript

1. Install TypeScript as a development dependency:
   ```bash
   npm install typescript --save-dev
   ```

### Step 4: Create a TypeScript Configuration File

1. Create a `tsconfig.json` file in the root of your project:
   ```bash
   npx tsc --init
   ```

2. Modify the `tsconfig.json` file as needed. Here’s a basic example:
   ```json
   {
     "compilerOptions": {
       "target": "es6",
       "module": "commonjs",
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "**/*.spec.ts"]
   }
   ```

### Step 5: Create the `src` Directory Structure

1. Create the `src` directory:
   ```bash
   mkdir src
   ```

2. Inside the `src` directory, create the necessary subdirectories and files based on your project requirements. For example:
   ```bash
   mkdir src/components
   mkdir src/services
   touch src/index.ts
   touch src/components/MyComponent.ts
   touch src/services/MyService.ts
   ```

### Step 6: Add Sample Code

1. Open the files you created and add some sample TypeScript code. For example, in `src/index.ts`:
   ```typescript
   import { MyComponent } from './components/MyComponent';
   import { MyService } from './services/MyService';

   const component = new MyComponent();
   const service = new MyService();

   console.log(component.render());
   console.log(service.getData());
   ```

2. In `src/components/MyComponent.ts`:
   ```typescript
   export class MyComponent {
     render() {
       return 'Hello from MyComponent!';
     }
   }
   ```

3. In `src/services/MyService.ts`:
   ```typescript
   export class MyService {
     getData() {
       return 'Data from MyService!';
     }
   }
   ```

### Step 7: Build and Run the Project

1. Add a build script to your `package.json`:
   ```json
   "scripts": {
     "build": "tsc",
     "start": "node dist/index.js"
   }
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run the project:
   ```bash
   npm start
   ```

### Conclusion

You now have a basic TypeScript project structure set up in your workspace. You can expand upon this structure by adding more components, services, or any other features as needed.