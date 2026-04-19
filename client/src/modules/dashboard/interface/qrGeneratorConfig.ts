export type QRContentType = "url" | "text" | "email" | "wifi";
export type QrApiContentType = "URL" | "TEXT" | "EMAIL" | "WIFI";

type ContentConfig = {
  label: string;
  fieldLabel: string;
  inputType: "url" | "text" | "email";
  placeholder: string;
};

export const QR_CONTENT_CONFIG: Record<QRContentType, ContentConfig> = {
  url: {
    label: "URL",
    fieldLabel: "URL",
    inputType: "url",
    placeholder: "https://example.com",
  },
  text: {
    label: "Text",
    fieldLabel: "Text",
    inputType: "text",
    placeholder: "Type any text message",
  },
  email: {
    label: "Email",
    fieldLabel: "Email",
    inputType: "email",
    placeholder: "hello@example.com",
  },
  wifi: {
    label: "WiFi",
    fieldLabel: "WiFi Payload",
    inputType: "text",
    placeholder: "WIFI:T:WPA;S:MyNetwork;P:password123;;",
  },
};

export const QR_CONTENT_TYPE_TO_API: Record<QRContentType, QrApiContentType> = {
  url: "URL",
  text: "TEXT",
  email: "EMAIL",
  wifi: "WIFI",
};

export const QR_CONTENT_TYPE_FROM_API: Record<QrApiContentType, QRContentType> = {
  URL: "url",
  TEXT: "text",
  EMAIL: "email",
  WIFI: "wifi",
};

export const isQRContentType = (value: string): value is QRContentType =>
  value in QR_CONTENT_CONFIG;

export const isQrApiContentType = (value: string): value is QrApiContentType =>
  value in QR_CONTENT_TYPE_FROM_API;

export type WifiSecurityType = "WPA" | "WEP" | "nopass";

export type WiFiFormState = {
  ssid: string;
  security: WifiSecurityType;
  password: string;
  hidden: boolean;
};
