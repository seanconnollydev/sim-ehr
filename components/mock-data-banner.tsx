import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export function MockDataBanner() {
  return (
    <Alert className="rounded-none border-x-0 border-t-0">
      <InfoIcon className="size-4" />
      <AlertTitle>Mock / synthetic data only</AlertTitle>
      <AlertDescription>
        This prototype uses fictional patients and scenarios for education. Do
        not enter real patient or identifiable information.
      </AlertDescription>
    </Alert>
  );
}
