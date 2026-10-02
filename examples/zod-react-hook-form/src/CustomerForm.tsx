import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { type Customer, type CustomerInput, customerSchema } from "./schema";

export function CustomerForm() {
  const [saved, setSaved] = useState<Customer | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput, unknown, Customer>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", nif: "", cif: "" },
  });

  return (
    <form onSubmit={handleSubmit(setSaved)} noValidate>
      <label>
        Nombre
        <input {...register("name")} />
      </label>
      {errors.name && <p role="alert">{errors.name.message}</p>}

      <label>
        DNI o NIE
        <input {...register("nif")} placeholder="12345678Z" />
      </label>
      {/* The message comes from validate(), in Spanish. */}
      {errors.nif && <p role="alert">{errors.nif.message}</p>}

      <label>
        CIF de la empresa (opcional)
        <input {...register("cif")} placeholder="B12345674" />
      </label>
      {errors.cif && <p role="alert">{errors.cif.message}</p>}

      <button type="submit">Guardar</button>

      {/* The NIF arrives normalized: no spaces, dots or hyphens, upper case. */}
      {saved && <pre>{JSON.stringify(saved, null, 2)}</pre>}
    </form>
  );
}
