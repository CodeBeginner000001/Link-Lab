"use client";

import { Button } from "@/components/ui/Button";
import { Github } from "lucide-react";
import { signIn } from "next-auth/react";

export default function GithubButton() {
  return (
    <Button
      type="button"
      variant="github"
      className="mb-6 w-full font-medium"
      size="lg"
      onClick={() => signIn("github", {
        callbackUrl: "/OAuth/github"
      })}
    >
      <Github className="size-4.5" />
      Continue with GitHub
    </Button>
  );
}
