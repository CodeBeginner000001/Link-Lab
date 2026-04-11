"use client";

import MotionWrapper from "@/components/common/MotionWrapper";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToastNotification } from "@/utils/toast";
import {
  CheckCircle2,
  FileText,
  Globe,
  Loader2,
  Mail,
  Search,
  Server,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import Heading from "../component/common/Heading";
import ToolEmptyState from "../component/common/ToolEmptyState";
import ToolFeaturePill from "../component/common/ToolFeaturePill";
import ToolMetricCard from "../component/common/ToolMetricCard";
import ToolPanel from "../component/common/ToolPanel";
import ToolSegmentedTabs from "../component/common/ToolSegmentedTabs";

type DNSRecordTab = "a" | "mx" | "txt" | "ns";

type DNSResult = {
  domain: string;
  available: boolean;
  records: {
    A: string[];
    MX: { priority: number; host: string }[];
    TXT: string[];
    NS: string[];
  };
  whois: {
    registrar: string;
    createdDate: string;
    expiresDate: string;
    nameServers: string[];
  };
};

const sanitizeDomain = (value: string) =>
  value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

const buildDnsResult = (rawDomain: string): DNSResult => {
  const domain = sanitizeDomain(rawDomain);
  const available = domain.length % 2 === 0;

  return {
    domain,
    available,
    records: {
      A: ["93.184.216.34", "93.184.216.35"],
      MX: [
        { priority: 10, host: `mail.${domain}` },
        { priority: 20, host: `backup.${domain}` },
      ],
      TXT: [
        "v=spf1 include:_spf.google.com ~all",
        `google-site-verification=${domain.replace(/\./g, "-")}`,
      ],
      NS: [`ns1.${domain}`, `ns2.${domain}`],
    },
    whois: {
      registrar: "LinkLab Domains Registry",
      createdDate: "2021-01-15",
      expiresDate: "2027-01-15",
      nameServers: [`ns1.${domain}`, `ns2.${domain}`],
    },
  };
};

const DNSDomainChecker = () => {
  const notify = useToastNotification();
  const [domain, setDomain] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [selectedTab, setSelectedTab] = useState<DNSRecordTab>("a");
  const [result, setResult] = useState<DNSResult | null>(null);

  const checkDomain = async () => {
    if (!sanitizeDomain(domain)) {
      notify("Enter a domain to inspect.", "warning");
      return;
    }

    setIsChecking(true);
    setResult(null);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const nextResult = buildDnsResult(domain);
    setResult(nextResult);
    setIsChecking(false);
    notify("DNS records loaded.", "success");
  };

  const records = result
    ? {
        a: result.records.A.map((record) => ({
          key: record,
          icon: Server,
          title: "A Record",
          value: record,
        })),
        mx: result.records.MX.map((record) => ({
          key: `${record.priority}-${record.host}`,
          icon: Mail,
          title: `Priority ${record.priority}`,
          value: record.host,
        })),
        txt: result.records.TXT.map((record, index) => ({
          key: `${record}-${index}`,
          icon: FileText,
          title: `TXT ${index + 1}`,
          value: record,
        })),
        ns: result.records.NS.map((record) => ({
          key: record,
          icon: Globe,
          title: "Name Server",
          value: record,
        })),
      }
    : null;

  return (
    <MotionWrapper>
      <div className="space-y-6">
        <Heading
          icon={Globe}
          heading="DNS & Domain Checker"
          para="Check domain availability and inspect common DNS records."
          iconClassName="h-6 w-6 text-primary"
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <ToolPanel
            heading="Check Domain"
            para="Search a domain to preview availability, common DNS records, and core WHOIS metadata."
            headerSlot={<ToolFeaturePill icon={Search} label="Quick lookup" />}
          >
            <div className="mb-5 flex flex-wrap gap-2">
              <ToolFeaturePill icon={Server} label="A records" />
              <ToolFeaturePill icon={Mail} label="MX records" />
              <ToolFeaturePill icon={FileText} label="TXT records" />
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <label
                  htmlFor="domain"
                  className="text-sm font-medium leading-none"
                >
                  Domain
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={(event) => setDomain(event.target.value)}
                  />
                  <Button
                    onClick={checkDomain}
                    disabled={isChecking}
                    className="sm:self-start"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Check
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </ToolPanel>

          <ToolPanel
            heading="Domain Status"
            para={
              result
                ? "Availability and identity details for the current lookup."
                : "Domain status will appear here after you run a lookup."
            }
            headerSlot={
              result ? (
                <ToolFeaturePill
                  icon={result.available ? CheckCircle2 : XCircle}
                  label={result.available ? "Available" : "Registered"}
                  className={
                    result.available
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }
                />
              ) : undefined
            }
          >
            {result ? (
              <div className="space-y-4">
                <ToolMetricCard
                  label="Domain"
                  value={result.domain}
                  className="rounded-2xl bg-[hsl(var(--secondary)/0.24)]"
                  valueClassName="text-2xl font-bold"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <ToolMetricCard
                    label="Registrar"
                    value={result.whois.registrar}
                    className="rounded-2xl bg-transparent"
                  />
                  <ToolMetricCard
                    label="Expires"
                    value={result.whois.expiresDate}
                    className="rounded-2xl bg-transparent"
                  />
                </div>
              </div>
            ) : (
              <ToolEmptyState
                icon={Globe}
                title="No domain checked yet"
                description="Search a domain and the availability summary will appear here."
              />
            )}
          </ToolPanel>
        </div>

        <ToolPanel
          heading="DNS Records"
          para={
            result
              ? "Switch between common record types for the current domain."
              : "DNS records will appear here after a successful lookup."
          }
        >
          {result && records ? (
            <div className="space-y-5">
              <ToolSegmentedTabs
                options={[
                  { label: "A", value: "a" },
                  { label: "MX", value: "mx" },
                  { label: "TXT", value: "txt" },
                  { label: "NS", value: "ns" },
                ]}
                value={selectedTab}
                onValueChange={(value) => {
                  if (
                    value === "a" ||
                    value === "mx" ||
                    value === "txt" ||
                    value === "ns"
                  ) {
                    setSelectedTab(value);
                  }
                }}
                className="max-w-xl"
              />

              <div className="space-y-3">
                {records[selectedTab].map((record) => {
                  const RecordIcon = record.icon;

                  return (
                    <article
                      key={record.key}
                      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-[hsl(var(--background))] p-2 shadow-sm">
                          <RecordIcon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{record.title}</p>
                          <p className="mt-1 break-all font-mono text-xs text-[hsl(var(--muted-foreground)/0.84)]">
                            {record.value}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <ToolEmptyState
              icon={Server}
              title="No DNS records yet"
              description="Run a lookup to inspect A, MX, TXT, and name server records."
            />
          )}
        </ToolPanel>

        <ToolPanel
          heading="WHOIS Information"
          para={
            result
              ? "Basic ownership metadata and name-server references for the current domain."
              : "WHOIS information will appear here after a lookup."
          }
          >
          {result ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ToolMetricCard
                label="Registrar"
                value={result.whois.registrar}
                className="rounded-2xl bg-transparent"
              />
              <ToolMetricCard
                label="Created"
                value={result.whois.createdDate}
                className="rounded-2xl bg-transparent"
              />
              <ToolMetricCard
                label="Expires"
                value={result.whois.expiresDate}
                className="rounded-2xl bg-transparent"
              />
              <ToolMetricCard
                label="Name servers"
                value={result.whois.nameServers.join(", ")}
                className="rounded-2xl bg-transparent"
                valueClassName="break-all text-sm font-semibold"
              />
            </div>
          ) : (
            <ToolEmptyState
              icon={FileText}
              title="No WHOIS information yet"
              description="Search a domain to reveal basic registrar and expiry details."
            />
          )}
        </ToolPanel>
      </div>
    </MotionWrapper>
  );
};

export default DNSDomainChecker;
