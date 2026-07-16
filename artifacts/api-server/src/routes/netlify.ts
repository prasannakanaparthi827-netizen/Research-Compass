/**
 * Thin adapter that bridges the Netlify serverless function format
 * (handler(event) → { statusCode, headers, body }) to Express req/res.
 *
 * The Netlify functions live in nca-research-compass/netlify/functions/ and
 * are loaded as CommonJS modules via createRequire.
 */
import { Router, type Request, type Response } from "express";
import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);
// process.cwd() is artifacts/api-server/ when run via pnpm, so resolve up two levels.
const FUNCTIONS_DIR = path.resolve(
  process.cwd(),
  "../../nca-research-compass/netlify/functions",
);

interface NetlifyEvent {
  httpMethod: string;
  path: string;
  queryStringParameters: Record<string, string>;
  headers: Record<string, string>;
  body: string | null;
  isBase64Encoded: boolean;
}

interface NetlifyResult {
  statusCode: number;
  headers?: Record<string, string>;
  body?: string;
}

function makeEvent(req: Request): NetlifyEvent {
  return {
    httpMethod: req.method,
    path: req.path,
    queryStringParameters: (req.query as Record<string, string>) ?? {},
    headers: req.headers as Record<string, string>,
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
  };
}

async function callHandler(
  functionName: string,
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const fnPath = path.join(FUNCTIONS_DIR, `${functionName}.js`);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fn = require(fnPath) as { handler: (e: NetlifyEvent) => Promise<NetlifyResult> };
    const result = await fn.handler(makeEvent(req));
    const headers: Record<string, string> = result.headers ?? {};
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
    res.status(result.statusCode ?? 200).set(headers).send(result.body);
  } catch (err) {
    req.log.error({ err }, "Netlify handler error");
    res.status(500).json({ error: "Internal server error" });
  }
}

const router = Router();

router.all("/auth-login", (req, res) => void callHandler("auth-login", req, res));
router.all("/auth-signup", (req, res) => void callHandler("auth-signup", req, res));
router.all("/projects", (req, res) => void callHandler("projects", req, res));
router.all("/project", (req, res) => void callHandler("project", req, res));
router.all("/problem-statements", (req, res) =>
  void callHandler("problem-statements", req, res),
);
router.all("/generate-stage", (req, res) =>
  void callHandler("generate-stage", req, res),
);
router.all("/save-stage", (req, res) => void callHandler("save-stage", req, res));

export default router;
