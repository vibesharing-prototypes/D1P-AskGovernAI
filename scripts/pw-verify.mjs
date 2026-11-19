import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (msg) => { if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text()); });
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

await page.goto("http://localhost:5180/admin/books", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/pw-1-books.png" });
console.log("Loaded /admin/books");

await browser.close();
