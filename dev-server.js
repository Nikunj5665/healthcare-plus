/* =========================================================
   Local development server.

       node dev-server.js     then open http://localhost:3000

   Serves the static site AND runs api/contact.js, so the
   contact form works the same way it will on Vercel.

   Vercel ignores this file: in production it serves the
   static files itself and runs api/contact.js as a function.
========================================================= */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import contactHandler from "./api/contact.js";

const PORT = process.env.PORT || 3000;
const ROOT = import.meta.dirname;

/* Load .env.local by hand, so plain `node dev-server.js` works */
if (existsSync(join(ROOT, ".env.local"))) {
    for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split("\n")) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (match) {
            process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
        }
    }
}

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".xml": "application/xml",
    ".txt": "text/plain; charset=utf-8"
};

function readBody(request) {
    return new Promise(function (resolve) {
        let data = "";
        request.on("data", function (chunk) { data += chunk; });
        request.on("end", function () {
            try {
                resolve(data ? JSON.parse(data) : {});
            } catch (error) {
                resolve(data);
            }
        });
    });
}

/* The little res.status().json() shim Vercel functions expect */
function vercelResponse(response) {
    response.status = function (code) {
        response.statusCode = code;
        return response;
    };

    response.json = function (payload) {
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(payload));
        return response;
    };

    return response;
}

const server = createServer(async function (request, response) {
    const url = new URL(request.url, "http://" + request.headers.host);

    if (url.pathname === "/api/contact") {
        request.body = await readBody(request);
        try {
            await contactHandler(request, vercelResponse(response));
        } catch (error) {
            console.error("dev-server: handler threw", error);
            if (!response.headersSent) {
                vercelResponse(response).status(500).json({ error: "Something went wrong." });
            }
        }
        return;
    }

    /* Static files. normalize() keeps ../.. from escaping the folder. */
    const wanted = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = join(ROOT, normalize(wanted).replace(/^(\.\.[\\/])+/, ""));

    try {
        const content = await readFile(file);
        response.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
        response.end(content);
    } catch (error) {
        const notFound = join(ROOT, "404.html");
        response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        response.end(existsSync(notFound) ? readFileSync(notFound) : "Not found");
    }
});

server.listen(PORT, function () {
    const configured = process.env.SMTP_USER && process.env.SMTP_PASS;

    let status;

    if (process.env.SMTP_DRY_RUN === "1") {
        status = "DRY RUN — messages print here, no mail is sent";
    } else if (configured) {
        status = "sending as " + process.env.SMTP_USER;
    } else {
        status = "NOT configured — fill in .env.local, or set SMTP_DRY_RUN=1";
    }

    console.log("\n  HealthCare+ running at http://localhost:" + PORT);
    console.log("  Contact form:          http://localhost:" + PORT + "/contact.html");
    console.log("  SMTP:                  " + status);
    console.log("");
});
