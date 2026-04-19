import {
  QRContentType,
  WiFiFormState,
} from "../../interface/qrGeneratorConfig";

export type QRBasicContentState = {
  url: string;
  text: string;
  email: string;
};

export type QRBasicContentType = keyof QRBasicContentState;

export const MAX_TEXT_WORDS = 400;

export const DEFAULT_WIFI_FORM: WiFiFormState = {
  ssid: "",
  security: "WPA",
  password: "",
  hidden: false,
};

export const getEmptyBasicContentState = (): QRBasicContentState => ({
  url: "",
  text: "",
  email: "",
});

export const countWords = (value: string) => value.match(/\S+/g)?.length ?? 0;

export const trimToWordLimit = (value: string, limit: number) => {
  const words = value.match(/\S+/g);

  if (!words || words.length <= limit) {
    return value;
  }

  return words.slice(0, limit).join(" ");
};

export const buildWifiPayload = ({
  ssid,
  security,
  password,
  hidden,
}: WiFiFormState) => {
  const trimmedSSID = ssid.trim();
  const trimmedPassword = password.trim();
  const passwordPart = security === "nopass" ? "" : `P:${trimmedPassword};`;
  const hiddenPart = hidden ? "H:true;" : "";

  return `WIFI:T:${security};S:${trimmedSSID};${passwordPart}${hiddenPart};`;
};

export const getDraftContent = (
  selectedType: QRContentType,
  contentByType: QRBasicContentState,
  wifiForm: WiFiFormState,
) =>
  selectedType === "wifi"
    ? buildWifiPayload(wifiForm)
    : contentByType[selectedType];
