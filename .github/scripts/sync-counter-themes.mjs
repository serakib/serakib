import { mkdir, writeFile } from "node:fs/promises";

const counterId = "serakib.github.readme";
const themes = [
  "asoul",
  "ai-1",
  "booru-vp",
  "booru-smtg",
  "booru-ve",
  "eva",
  "booru-lisu",
  "original-new",
  "cat-girls-yay",
  "booru-nandroid",
  "booru-twifanartsfw",
  "booru-snyde",
];

const statsUrl = `https://count.getloli.com/api/stats/series/${encodeURIComponent(counterId)}`;
const statsResponse = await fetch(statsUrl, {
  headers: {
    accept: "application/json",
    "user-agent": "Mozilla/5.0 (compatible; GitHubActions/1.0)",
    referer: "https://count.getloli.com/",
    origin: "https://count.getloli.com",
  },
});
if (!statsResponse.ok) {
  const errorBody = (await statsResponse.text()).slice(0, 500);
  throw new Error(`Counter stats request failed: HTTP ${statsResponse.status}; ${errorBody}`);
}

const stats = await statsResponse.json();
const count = Number(stats.total);
if (!Number.isSafeInteger(count) || count <= 0) {
  throw new Error(`Invalid live counter total: ${stats.total}`);
}

const outputDir = "assets/counter-themes";
await mkdir(outputDir, { recursive: true });

const images = [{ file: "main.svg", theme: null }, ...themes.map(theme => ({
  file: `${theme}.svg`,
  theme,
}))];

for (const image of images) {
  const params = new URLSearchParams({ num: String(count) });
  if (image.theme) params.set("theme", image.theme);

  const imageUrl = `https://count.getloli.com/get/@${encodeURIComponent(counterId)}?${params}`;
  const response = await fetch(imageUrl, {
    headers: { accept: "image/svg+xml" },
  });
  const svg = await response.text();

  if (!response.ok || !/<svg(?:\s|>)/i.test(svg)) {
    throw new Error(`Could not render ${image.file}: HTTP ${response.status}`);
  }

  await writeFile(`${outputDir}/${image.file}`, svg, "utf8");
}

console.log(`Updated ${images.length} counter images using shared count ${count}.`);
