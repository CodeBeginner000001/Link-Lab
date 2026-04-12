"use client";

import UrlInput from "@/components/common/UrlInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { CreateShortUrl } from "@/service/dashboard/url-shortener";
import { ShortUrlItem } from "@/service/dashboard/url-shortener/type";
import { useToastNotification } from "@/utils/toast";
import { FormEvent, useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";

const normalizeUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;

type URLShortenerFormProps = {
  onCreated?: (item: ShortUrlItem) => void;
};

const URLShortenerForm = ({ onCreated }: URLShortenerFormProps) => {
  const router = useRouter();
  const notify = useToastNotification();
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!url.trim()) {
      notify("Enter a URL to shorten.", "warning");
      return;
    }

    try {
      setIsLoading(true);

      const longUrl = normalizeUrl(url.trim());
      const alias = customAlias.trim() || undefined;

      const res = await CreateShortUrl(longUrl, alias);
      if ("error" in res) {
        const rawMessage = res.error?.message;
        const message = Array.isArray(rawMessage)
          ? (rawMessage[0] ?? "Failed to create short URL.")
          : (rawMessage ?? "Failed to create short URL.");

        notify(message, "error");
        return;
      }

      const created = res.result.data.shortUrl;
      setUrl("");
      setCustomAlias("");
      notify(`Short URL created: ${created.shortUrl}`, "success");
      onCreated?.(created);
      router.refresh();
    } catch {
      notify("Something went wrong. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-[350px]:space-y-3">
      <UrlInput
        id="long-url"
        name="long-url"
        label="Long URL"
        required
        placeholder="https://example.com/very-long-url-that-needs-shortening"
        value={url}
        className="max-sm:text-xs max-sm:placeholder:text-xs max-[350px]:h-10 max-[350px]:px-2.5 max-[350px]:text-[11px] max-[350px]:placeholder:text-[11px]"
        onChange={(event) => setUrl(event.target.value)}
      />

      <div className="grid gap-2">
        <Label
          htmlFor="custom-alias"
          className="max-sm:text-xs max-[350px]:text-[11px]"
        >
          Custom Alias
        </Label>
        <Input
          id="custom-alias"
          name="custom-alias"
          placeholder="my-custom-link"
          value={customAlias}
          className="max-sm:text-xs max-sm:placeholder:text-xs max-[350px]:h-10 max-[350px]:px-2.5 max-[350px]:text-[11px] max-[350px]:placeholder:text-[11px]"
          onChange={(event) => setCustomAlias(event.target.value)}
        />
        <p className="cursor-default text-[10px] text-[hsl(var(--muted-foreground)/0.85)] max-[350px]:text-[9px] max-[350px]:leading-4 sm:text-xs">
          Letters, numbers, and hyphens only. Leave it blank to auto-generate
          one.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full max-sm:text-xs max-[350px]:h-9 max-[350px]:gap-1.5 max-[350px]:px-3 max-[350px]:text-[11px] sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Shortening...
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            Shorten URL
          </>
        )}
      </Button>
    </form>
  );
};

export default URLShortenerForm;
