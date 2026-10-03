import type { ReactNode } from "react";

export const metadata = { title: "A NIF validated by a server action" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
