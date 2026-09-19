/* =========================================================
   POST /api/contact

   Runs on Vercel as a Node serverless function. The browser
   never sees the SMTP details: it posts JSON here, and this
   function is what logs in to Gmail and sends the mail.

   Needs these environment variables (Vercel dashboard →
   Settings → Environment Variables):

     SMTP_USER   you@yourdomain.com   the Gmail account that sends
     SMTP_PASS   16-character Google App Password (not the login password)
     CONTACT_TO  where the message should land (defaults to SMTP_USER)

   Never put these in a .env file that gets committed, and never
   in any file the browser downloads.
========================================================= */

import nodemailer from "nodemailer";

const TOPICS = ["Question", "Problem", "Privacy", "Idea"];

const MAX = {
    name: 100,
    email: 200,
    message: 5000
};

/* Best-effort rate limit. Serverless instances come and go, so this
   only slows down a burst from one address on one warm instance. Put
   a real limiter (Upstash, Vercel KV) in front of it before launch. */
const hits = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function tooManyFrom(ip) {
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter(function (time) {
        return now - time < WINDOW_MS;
    });

    recent.push(now);
    hits.set(ip, recent);

    return recent.length > MAX_PER_WINDOW;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* Headers must stay on one line: a newline in the subject or reply-to
   would let someone inject extra mail headers. */
function oneLine(value) {
    return String(value).replace(/[\r\n]+/g, " ").trim();
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export default async function handler(request, response) {
    if (request.method !== "POST") {
        response.setHeader("Allow", "POST");
        return response.status(405).json({ error: "Use POST." });
    }

    /* SMTP_DRY_RUN=1 prints the message instead of sending it, so the
       form can be tested before any mail provider is set up. Only ever
       set this in .env.local, never on the deployed site. */
    const dryRun = process.env.SMTP_DRY_RUN === "1";

    if (!dryRun && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
        console.error("contact: SMTP_USER or SMTP_PASS is not set");
        return response.status(500).json({ error: "The contact form isn't set up yet." });
    }

    const ip =
        (request.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";

    if (tooManyFrom(ip)) {
        return response.status(429).json({ error: "Too many messages. Try again later." });
    }

    /* Vercel parses JSON bodies for us, but be defensive about it */
    let body = request.body;

    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch (error) {
            return response.status(400).json({ error: "Send valid JSON." });
        }
    }

    if (!body || typeof body !== "object") {
        return response.status(400).json({ error: "Send valid JSON." });
    }

    /* A hidden field no person ever fills in. Bots do, so we accept
       the request and quietly drop it rather than telling them why. */
    if (body.company) {
        return response.status(200).json({ ok: true });
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    const topic = TOPICS.includes(body.topic) ? body.topic : "Question";

    /* The browser checks these too, but the browser can be bypassed */
    if (!name || name.length > MAX.name) {
        return response.status(400).json({ error: "Enter your name." });
    }

    if (!isValidEmail(email) || email.length > MAX.email) {
        return response.status(400).json({ error: "Enter a valid email address." });
    }

    if (message.length < 10 || message.length > MAX.message) {
        return response.status(400).json({ error: "Write a little more so we can help." });
    }

    if (dryRun) {
        console.log(
            "\n  --- contact form message (dry run, nothing sent) ---\n" +
            "  From:    " + name + " <" + email + ">\n" +
            "  Topic:   " + topic + "\n" +
            "  Message: " + message + "\n" +
            "  ----------------------------------------------------\n"
        );
        return response.status(200).json({ ok: true, dryRun: true });
    }

    /* Defaults to Gmail, but any SMTP provider works: set SMTP_HOST
       and SMTP_PORT to switch, no code change needed. */
    const port = Number(process.env.SMTP_PORT || 465);

    const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        await transport.sendMail({
            /* Gmail only lets you send as yourself, so From is always
               your own address. replyTo is what makes Reply in your
               mail app go back to the person who wrote in. */
            from: '"HealthCare+ contact form" <' + process.env.SMTP_USER + ">",
            to: process.env.CONTACT_TO || process.env.SMTP_USER,
            replyTo: oneLine(name) + " <" + oneLine(email) + ">",
            subject: "[" + topic + "] Message from " + oneLine(name),
            text:
                "From: " + name + "\n" +
                "Email: " + email + "\n" +
                "Topic: " + topic + "\n\n" +
                message,
            html:
                "<p><strong>From:</strong> " + escapeHTML(name) + "<br>" +
                "<strong>Email:</strong> " + escapeHTML(email) + "<br>" +
                "<strong>Topic:</strong> " + escapeHTML(topic) + "</p>" +
                "<p style=\"white-space: pre-wrap\">" + escapeHTML(message) + "</p>"
        });
    } catch (error) {
        /* Log the real reason for us, tell the visitor nothing useful
           about our mail setup. */
        console.error("contact: sendMail failed", error);
        return response.status(502).json({ error: "We couldn't send that just now. Please try again." });
    }

    return response.status(200).json({ ok: true });
}
