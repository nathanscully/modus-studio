import { createFileRoute } from "@tanstack/react-router";

import { Generator } from "~/components/Generator.tsx";

export const Route = createFileRoute("/")({
  component: Generator,
});
