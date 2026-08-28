# Preview / Distribution Sprint

The trainer now has two preview paths.

## 1. Validated build artifact

Every CI run that reaches a successful production build uploads the complete `dist/` directory as a GitHub Actions artifact named:

`regional-anesthesia-trainer-preview-<commit-sha>`

The artifact is retained for 14 days. It contains the built React application and `START_PREVIEW.txt`.

Because the trainer uses ES modules and a Dedicated Web Worker, do not open `index.html` directly via `file://`. Serve the extracted folder through a small local HTTP server, for example:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

## 2. GitHub Pages

After the preview workflow is merged to `main`, pushes to `main` build a Pages-specific bundle using the repository base path `/RegionalAnesthesiaTrainer/` and deploy it through GitHub Pages.

Expected public URL after Pages is enabled for GitHub Actions:

`https://olioli140.github.io/RegionalAnesthesiaTrainer/`

If Pages has not yet been enabled in repository settings, the validated CI artifact remains available and the deployment job may require a one-time repository setting change.

## Validation gate

Preview artifacts are generated only after:

- public regional core smoke test
- TypeScript strict typecheck
- trainer regression tests
- production build

The preview contains no alternate simulation logic. It is a distribution of the same React/Worker/Core application validated by CI.
