import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  createRootRouteWithContext,
  type ErrorComponentProps,
} from "@tanstack/react-router";

import { Button } from "~/components/ui/button.tsx";
import { Toaster } from "~/components/ui/sonner.tsx";
import { REPO_URL } from "~/lib/site.ts";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <Outlet />
      <Toaster />
    </>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </main>
  );
}

function NotFound() {
  return (
    <Shell title="Page not found">
      <p className="text-muted-foreground max-w-md text-sm">
        There is nothing at this address. The gallery lists every theme.
      </p>
      <Button asChild size="sm">
        <Link to="/">Back to the gallery</Link>
      </Button>
    </Shell>
  );
}

function ErrorPage({ error, reset }: ErrorComponentProps) {
  return (
    <Shell title="Something went wrong">
      <pre className="bg-muted max-w-xl overflow-x-auto rounded-md p-3 text-left font-mono text-xs">
        {error.message}
      </pre>
      <div className="flex gap-2">
        <Button size="sm" onClick={reset}>
          Try again
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={`${REPO_URL}/issues/new`} target="_blank" rel="noreferrer">
            Report it
          </a>
        </Button>
      </div>
    </Shell>
  );
}
