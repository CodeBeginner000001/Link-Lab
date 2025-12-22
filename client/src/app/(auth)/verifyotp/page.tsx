"use client";

import OTPVerification from "@/modules/auth/pages/OTPVerification";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <OTPVerification />
    </Suspense>
  );
}
