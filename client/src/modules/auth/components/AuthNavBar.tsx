import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ToggleTheme from "@/components/ui/ToggleTheme";
import Link from "next/link";

export default function AuthNavBar({ link = "/" }: { link: string }) {
  return (
    <div className="flex items-center justify-between mb-8 ">
      <Link href={link}>
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </Link>
      <ToggleTheme />
    </div>
  );
}
