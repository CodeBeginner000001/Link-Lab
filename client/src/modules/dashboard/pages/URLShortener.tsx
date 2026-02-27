import MotionWrapper from "@/components/common/MotionWrapper";
import UrlInput from "@/components/common/UrlInput";
import { Button } from "@/components/ui/Button";
import { Link2 } from "lucide-react";
import BoxHeading from "../component/common/BoxHeading";
import Heading from "../component/common/Heading";

const URLShortener = () => {
  return (
    <MotionWrapper>
      <div className="space-y-6">
        <Heading
          icon={Link2}
          heading="URL Shortener"
          para="Create short, memorable links that redirect to any URL. "
          headingClassName="text-2xl"
          iconClassName="w-6 h-6 text-[hsl(var(--primary))]"
          paraClassName="text-base"
        />

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <BoxHeading
            heading="Shorten a URL"
            para="Enter a long URL to create a short, shareable link."
          />

          <div className="flex flex-col gap-6">
            <UrlInput
              id="longURL"
              name="longURL"
              label="Long URL"
              required
              placeholder="https://example.com/very-long-url-that-needs-shortening"
            />
            <UrlInput
              id="customURLAlias"
              name="customURLAlias"
              label="Custom Alias"
              required
              placeholder="my-custom-link"
            />
            <Button className="w-38 rounded-lg cursor-pointer">
              <Link2 className="w-5 h-5" />
              Shorten URL
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <BoxHeading heading="Your Shortened URLs" para="0 URLs created" />
          <div className="w-full flex flex-col justify-center items-center h-50 text-[hsl(var(--muted-foreground)/0.8)]">
            <Link2 className="w-14 h-14" />
            <p className="text-center">
              No shortened URLs yet{" "}
              <span className="block">Create your first short link above</span>
            </p>
          </div>
        </div>
      </div>
    </MotionWrapper>
  );
};

export default URLShortener;
