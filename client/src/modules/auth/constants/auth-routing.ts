export type AuthFlowSource = "signup"| "forgetpassword" | "signin";

type BackRouteMap = {
  [pathname: string]: {
    default: string;
    from?: Partial<Record<AuthFlowSource, string>>;
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
      forgetpassword: "/forgetpassword?from=signin",
    },
  },
  "/forgetpassword":{
    default: "/",
    from: {
      signin: "/signin"
    }
  },

};

export const AUTH_SUCCESS_ROUTE_MAP = {
  forgetpassword: "successfulresetlink",
  signup:"dashboard"
};
export type AuthSuccessFlow = keyof typeof AUTH_SUCCESS_ROUTE_MAP;