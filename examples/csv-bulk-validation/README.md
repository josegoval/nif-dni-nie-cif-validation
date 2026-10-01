# csv-bulk-validation

Streams a CSV file with Node streams, validates its NIF column, and reports the invalid rows with their error code and SPEC rule, and the throughput.

```sh
pnpm start    # validates sample.csv (1,000 rows, 62 of them invalid) and prints the report
pnpm check    # the same, and fails unless the file has 1,000 rows and 62 invalid ones, which is what CI runs
pnpm sample   # writes sample.csv again (the seeded generators make the same file every time)
```

A report looks like this:

```text
sample.csv: 1,000 rows, 938 valid, 62 invalid

Invalid rows by error code:
      24  INVALID_CONTROL_CHARACTER
      16  INVALID_LENGTH
      15  INVALID_FORMAT
       7  EMPTY

First 10 invalid rows (line, value, code, rule):
  line 17: "28665600Q"  INVALID_CONTROL_CHARACTER (DNI-2)  The control character is not correct: ...

Throughput: 133,628 rows/s, 3.7 MB/s (0.03 MB in 7.5 ms)
```

Use it on your own file with `node validate-csv.mjs customers.csv --column tax_id --locale es --limit 20` (`--fail-on-invalid` makes the exit code 1 when any row is invalid, for a pipeline). To see the throughput on a big file, make one with `node generate-sample.mjs --rows 1000000 --out /tmp/big.csv`: the file is never held in memory, so its size doesn't change what the script uses.

The streaming is in [validate-csv.mjs](validate-csv.mjs): a `Transform` from text chunks to rows (it keeps the incomplete last line of a chunk for the next one) and a `Writable` that calls `validate()` on each row, joined by `pipeline()`. The CSV reading is minimal (quoted fields are supported, a line break inside quotes is not); use a CSV library for files that need more. The generated NIFs are valid but made up: use them for tests, never as real data.

From the root of the repository, install first with `pnpm examples:install` (see [../README.md](../README.md)). In your own project: `npm install nif-dni-nie-cif-validation`.
