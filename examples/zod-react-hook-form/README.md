# zod-react-hook-form

A Vite + React form (React Hook Form with `@hookform/resolvers`) that validates a DNI/NIE and a CIF with the `/zod` schemas of this package, with the messages in Spanish.

```sh
pnpm start   # the form, at http://localhost:5173
pnpm check   # type-checks and builds, which is what CI runs
```

The schema is in [src/schema.ts](src/schema.ts), the form in [src/CustomerForm.tsx](src/CustomerForm.tsx). The schemas output the normalized value, so `" 12.345.678-z "` reaches `onSubmit` as `"12345678Z"`.

From the root of the repository, install first with `pnpm examples:install` (see [../README.md](../README.md)). In your own project: `npm install nif-dni-nie-cif-validation zod react-hook-form @hookform/resolvers`.
