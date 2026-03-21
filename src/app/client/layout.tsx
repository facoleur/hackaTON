import { Providers } from "@/app/providers";
import type { PropsWithChildren } from "react";
import { ClientShell } from "./ClientShell";

export default function ClientLayout({ children }: PropsWithChildren) {
  return (
    <Providers role="client">
      <ClientShell>
        <div>{children}</div>
      </ClientShell>
    </Providers>
  );
}
