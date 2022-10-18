# Instructions for Contributing Code

## Build Locally (Includes Compiling, Linting, Testing)

```bash
   npm run build
```

## Interactive Development

Watch for compile errors:

```bash
   npm run tscWatch
```

Run the dev server:

```bash
   npm run webpack-dev-server
```

* Open [http://localhost:9000/test/](http://localhost:9000/test/)
* Change the code
* The tests should automatically run for every code change

## Publishing a Release

Increment the version in package.json and commit
Workflow will detect the change creating a tag and publish to npm.
