const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const DATA = path.join(__dirname, "data");
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));
const write = (f, d) =>
    fs.writeFileSync(path.join(DATA, f), JSON.stringify(d, null, 2));

const COMPANIES = { acme: "Acme Labs", zenith: "Zenith Systems" };

// Failure switch: fires ONCE, then resets to 'off'
// modes: off | 500 | timeout | ghost
// ghost = saves the application, THEN returns 500 (tests duplicate protection)
let failMode = "off";

const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8">
<title>${title}</title>
<style>
body{font-family:sans-serif;max-width:640px;margin:40px auto;padding:0 16px}
input,textarea{display:block;margin:8px 0;padding:8px;width:100%;box-sizing:border-box}
button{padding:8px 16px;cursor:pointer}
.job{border:1px solid #ddd;padding:12px;margin:12px 0;border-radius:6px}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px;text-align:left}
</style></head><body>${body}</body></html>`;

// ---------- Career pages ----------
app.get("/:co/jobs", (req, res) => {
    const { co } = req.params;
    if (!COMPANIES[co]) return res.status(404).send("Not found");
    const jobs = read("jobs.json")[co];
    const html = jobs
        .map(
            (j) => `
    <div class="job" data-job-id="${j.id}">
      <h3>${j.title}</h3>
      <p>${j.location} | ${j.remote ? "Remote" : "On-site"} | ${j.minExp}-${j.maxExp} yrs</p>
      <p>Skills: ${j.skills.join(", ")}</p>
      <a href="/${co}/apply/${j.id}">Apply</a>
    </div>`,
        )
        .join("");
    res.send(
        page(
            `${COMPANIES[co]} Careers`,
            `<h1>${COMPANIES[co]} Careers</h1>${html}`,
        ),
    );
});

app.get("/:co/apply/:id", (req, res) => {
    const { co, id } = req.params;
    const job = (read("jobs.json")[co] || []).find((j) => j.id === id);
    if (!job) return res.status(404).send("Job not found");

    if (co === "acme") {
        // Single-page form
        return res.send(
            page(
                "Apply",
                `
      <h2>Apply: ${job.title}</h2>
      <form method="POST" action="/acme/submit">
        <input type="hidden" name="jobId" value="${id}">
        <input name="name" placeholder="Full name" required>
        <input name="email" placeholder="Email" required>
        <input name="resume" placeholder="Resume filename" required>
        <button type="submit">Submit application</button>
      </form>`,
            ),
        );
    }
    // Zenith: 2-step form with different field names
    res.send(
        page(
            "Apply",
            `
    <h2>Step 1 of 2: ${job.title}</h2>
    <form method="POST" action="/zenith/step2">
      <input type="hidden" name="jobId" value="${id}">
      <input name="applicant_name" placeholder="Your name" required>
      <input name="applicant_email" placeholder="Your email" required>
      <button type="submit">Next</button>
    </form>`,
        ),
    );
});

app.post("/zenith/step2", (req, res) => {
    const { jobId, applicant_name, applicant_email } = req.body;
    res.send(
        page(
            "Apply",
            `
    <h2>Step 2 of 2</h2>
    <form method="POST" action="/zenith/submit">
      <input type="hidden" name="jobId" value="${jobId}">
      <input type="hidden" name="applicant_name" value="${applicant_name}">
      <input type="hidden" name="applicant_email" value="${applicant_email}">
      <textarea name="why_us" placeholder="Why Zenith?" required></textarea>
      <button type="submit">Send application</button>
    </form>`,
        ),
    );
});

function submitApp(co, req, res, name, email) {
    const apps = read("applications.json");
    const record = {
        id: `${Date.now()}-${apps.length}`,
        company: co,
        jobId: req.body.jobId,
        name,
        email,
        at: new Date().toISOString(),
    };
    const mode = failMode;

    if (mode === "500") {
        failMode = "off";
        return res.status(500).send(page("Error", "<h1>500 Server error</h1>"));
    }
    if (mode === "timeout") {
        failMode = "off";
        return; // never responds, nothing saved
    }
    apps.push(record); // NOTE: server does NOT block duplicates; the operator must
    write("applications.json", apps);
    if (mode === "ghost") {
        failMode = "off";
        return res.status(500).send(page("Error", "<h1>500 Server error</h1>"));
    }
    res.send(
        page(
            "Thanks",
            `<h1 id="confirmation">Application received</h1><p>Ref: ${record.id}</p>`,
        ),
    );
}

app.post("/acme/submit", (req, res) =>
    submitApp("acme", req, res, req.body.name, req.body.email),
);
app.post("/zenith/submit", (req, res) =>
    submitApp(
        "zenith",
        req,
        res,
        req.body.applicant_name,
        req.body.applicant_email,
    ),
);

// ---------- Tracker ----------
app.get("/tracker", (req, res) => {
    const rows = read("applications.json")
        .map(
            (a) =>
                `<tr><td>${a.company}</td><td>${a.jobId}</td><td>${a.name}</td><td>${a.email}</td><td>${a.at}</td></tr>`,
        )
        .join("");
    res.send(
        page(
            "Tracker",
            `<h1>Application Tracker</h1>
    <table id="tracker"><tr><th>Company</th><th>Job</th><th>Name</th><th>Email</th><th>Time</th></tr>${rows}</table>`,
        ),
    );
});
app.get("/api/applications", (req, res) => res.json(read("applications.json")));

// ---------- Mock WhatsApp ----------
app.get("/whatsapp", (req, res) => {
    const msgs = read("messages.json")
        .map((m) => `<p class="msg"><b>HireHand Bot:</b> ${m.text}</p>`)
        .join("");
    res.send(
        page(
            "WhatsApp",
            `<h1>WhatsApp (mock)</h1>${msgs}
    <form method="POST" action="/whatsapp/send">
      <textarea id="msg" name="text" placeholder="Type a message" required></textarea>
      <button id="send" type="submit">Send</button>
    </form>`,
        ),
    );
});
app.post("/whatsapp/send", (req, res) => {
    const msgs = read("messages.json");
    msgs.push({ text: req.body.text, at: new Date().toISOString() });
    write("messages.json", msgs);
    res.redirect("/whatsapp");
});
app.get("/api/messages", (req, res) => res.json(read("messages.json")));

// ---------- Admin (for demos) ----------
app.get("/admin/fail/:mode", (req, res) => {
    failMode = req.params.mode;
    res.send(`failMode = ${failMode}`);
});
app.get("/admin/reset", (req, res) => {
    write("applications.json", []);
    write("messages.json", []);
    failMode = "off";
    res.send("reset done");
});

app.listen(4000, () => console.log("Mock world on http://localhost:4000"));
