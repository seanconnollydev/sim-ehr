import { Suspense } from "react";
import { NewTemplateRedirect } from "./new-template-client";

export default function NewWdlTemplatePage() {
  return (
    <Suspense
      fallback={
        <p className="text-muted-foreground text-sm">Creating a new template…</p>
      }
    >
      <NewTemplateRedirect />
    </Suspense>
  );
}
