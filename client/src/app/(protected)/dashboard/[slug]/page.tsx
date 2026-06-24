import SchemaToolPage from "@/modules/dashboard/component/SchemaToolPage";
import { loadSchemaPageData } from "@/modules/dashboard/schema-driven/data-loader";
import {
    getFeatureToolSchema,
    schemaSlugs,
} from "@/modules/dashboard/schema-driven/registry";
import { getFeaturePanelSlots } from "@/modules/dashboard/schema-driven/slot-registry";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

type SchemaToolRouteProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 10;

export function generateStaticParams() {
  return schemaSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: SchemaToolRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const schema = await getFeatureToolSchema(slug);

  if (!schema) {
    return {};
  }

  return {
    title: schema.header.title,
    description: schema.header.description,
    alternates: {
      canonical: schema.header.canonical,
    },
  };
}

export default async function SchemaDrivenToolPage({
  params,
  searchParams,
}: SchemaToolRouteProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const requestHeaders = {
    Cookie: cookieStore.toString(),
  };
  const schema = await getFeatureToolSchema(slug, requestHeaders);

  if (!schema) {
    notFound();
  }

  const { items, analytics, pagination } = await loadSchemaPageData(
    schema,
    requestHeaders,
    resolvedSearchParams,
  );

  return (
    <SchemaToolPage
      schema={schema}
      items={items}
      analytics={analytics}
      pagination={pagination}
      slots={getFeaturePanelSlots(schema, items)}
    />
  );
}
