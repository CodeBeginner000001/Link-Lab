export type AuthFlowSource = "signup" | "signin";

type BackRouteMap = {
  [pathname: string]: {
    default: string;
    from?: Record<AuthFlowSource, string>;
  };
};

export const AUTH_BACK_ROUTE_MAP: BackRouteMap = {
  "/signin": {
    default: "/",
  },
  "/signup": {
    default: "/",
  },
  "/verifyotp": {
    default: "/",
    from: {
      signup: "/signup",
      signin: "/signin",
    },
  },
};
