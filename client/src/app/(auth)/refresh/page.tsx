import { redirect } from "next/navigation";

export default function RefreshPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  redirect(
    `/api/auth/refresh?redirect=${encodeURIComponent(
      searchParams.redirect || "/dashboard"
    )}`
  );
}
