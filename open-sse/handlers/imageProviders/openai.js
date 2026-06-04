// OpenAI-compatible adapter (used by openai, minimax, openrouter, recraft)

const ENDPOINTS = {
  openai: "https://api.openai.com/v1/images/generations",
  minimax: "https://api.minimaxi.com/v1/images/generations",
  openrouter: "https://openrouter.ai/api/v1/images/generations",
  recraft: "https://external.api.recraft.ai/v1/images/generations",
  "volcengine-ark-agent": "https://ark.cn-beijing.volces.com/api/plan/v3/images/generations",
  sensenova: "https://token.sensenova.cn/v1/images/generations",
};

// Valid SenseNova sizes (from API response)
const SENSENOVA_VALID_SIZES = new Set([
  "1024x1024",
  "1664x2496", "2496x1664",
  "1760x2368", "2368x1760",
  "1824x2272", "2272x1824",
  "2720x1536", "1536x2720",
  "2752x1536", "1536x2752",
  "1216x2752", "2752x1216",
]);

const SENSENOVA_DEFAULT_SIZE = "1664x2496";

function isSensenovaSize(s) {
  return s && SENSENOVA_VALID_SIZES.has(s);
}

export default function createOpenAIAdapter(providerId) {
  return {
    buildUrl: () => ENDPOINTS[providerId],
    buildHeaders: (creds) => {
      const headers = { "Content-Type": "application/json" };
      const key = creds?.apiKey || creds?.accessToken;
      if (key) headers["Authorization"] = `Bearer ${key}`;
      if (providerId === "openrouter") {
        headers["HTTP-Referer"] = "https://endpoint-proxy.local";
        headers["X-Title"] = "Endpoint Proxy";
      }
      return headers;
    },
    buildBody: (model, body) => {
      const { prompt, n = 1, size = "1024x1024", quality, style, response_format } = body;

      // xAI only accepts prompt, model, n, response_format
      if (providerId === "xai") {
        const req = { model, prompt, n };
        if (response_format) req.response_format = response_format;
        return req;
      }

      // SenseNova has restricted size set — fallback to default if invalid
      if (providerId === "sensenova") {
        const actualSize = isSensenovaSize(size) ? size : SENSENOVA_DEFAULT_SIZE;
        const req = { model, prompt, n, size: actualSize };
        if (response_format) req.response_format = response_format;
        return req;
      }

      const req = { model, prompt, n, size };
      if (quality) req.quality = quality;
      if (style) req.style = style;
      if (response_format) req.response_format = response_format;
      return req;
    },
    normalize: (responseBody) => responseBody,
  };
}
