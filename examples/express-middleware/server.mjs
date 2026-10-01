import { createApp } from "./app.mjs";

const port = Number(process.env.PORT ?? 3000);

createApp().listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
  console.log(
    `curl -X POST localhost:${port}/customers -H 'content-type: application/json' ` +
      `-H 'accept-language: es' -d '{"nif":"12345678A"}'`
  );
});
