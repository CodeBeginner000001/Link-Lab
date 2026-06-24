export function getValueByPath(source: unknown, path: string) {
  return path.split(".").reduce<unknown>((value, key) => {
    if (Array.isArray(value) && key === "length") {
      return value.length;
    }

    if (!value || typeof value !== "object") {
      return undefined;
    }

    return (value as Record<string, unknown>)[key];
  }, source);
}

export function toDisplayValue(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US").format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}
