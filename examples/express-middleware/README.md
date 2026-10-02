# express-middleware

An Express middleware that validates a NIF field of a JSON body with `validate()` and answers `422` with localized errors (error code, SPEC rule and message in the language of `Accept-Language`).

```sh
pnpm start   # the server, at http://localhost:3000
pnpm check   # starts the app on a free port and posts to it (node --test), which is what CI runs
```

The middleware is in [nif-middleware.mjs](nif-middleware.mjs), the routes in [app.mjs](app.mjs) and the test in [app.test.mjs](app.test.mjs).

From the root of the repository, install first with `pnpm examples:install` (see [../README.md](../README.md)). In your own project: `npm install nif-dni-nie-cif-validation express`.
