function getENV(key: string, defaultValue: string = ""): string {
  const value = import.meta.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  console.log(`Environment variable ${key} is set to: ${value}`);
  return value;
}

function getEnvBool(key: string, defaultValue: boolean = false): boolean {
  const value = getENV(key, defaultValue.toString()).toLowerCase();
  return value === "true" || value === "1";
}

const appConfig = {
  API_BASE_URL: getENV("VITE_API_BASE_URL", "http://localhost:8080"),
  MANIFESTO_MODE: getEnvBool("VITE_MANIFESTO_MODE", true),
};

export default appConfig;
