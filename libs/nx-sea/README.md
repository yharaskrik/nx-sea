# nx-sea

A Nx executor for compiling Single Executable Apps (SEA) with Node v20

Add a new target to your apps `project.json`

```json5
{
  "build": {}, // Existing Build target
  "sea": {
    "executor": "nx-sea:build",
    "outputs": ["{options.outputPath}"],
    "options": {
      "entryPoint": "<entry point>", // Name of the JavaScript file to be used as the entry point.
      "directory": "dist/apps/<app name>",
      "outputPath": ["dist/apps/<app name>/sea"],
    },
    "dependsOn": ["build"]
  }
}
```

Run `nx sea <app>`.
