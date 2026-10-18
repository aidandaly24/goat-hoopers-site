import type { DraftDemo, DraftPick, DraftPlayer } from "@/domain/arcade/roster-draft";

/** Load only the exact approved same-origin portrait paths supplied by the demo. */
function portrait(player: DraftPlayer): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = player.portrait;
  });
}

/** User-initiated, device-local PNG export. No upload, publishing or score submission. */
export async function downloadLineup(demo: DraftDemo, picks: readonly DraftPick[]) {
  if (picks.length !== demo.pickCount) throw new Error("Complete the demo lineup first");
  const root = document.querySelector(".gh-week-two-draft");
  if (!root) throw new Error("Draft preview is unavailable");
  const tokens = getComputedStyle(root);
  const token = (name: string) => tokens.getPropertyValue(name).trim();
  const white = token("--gh-draft-white"), night = token("--gh-draft-night"), gold = token("--gh-draft-gold");
  const rows = picks.map(pick => {
    const team = demo.teams.find(team => team.id === pick.teamId);
    const player = team?.players.find(player => player.id === pick.playerId);
    if (!team || !player) throw new Error("Invalid demo pick");
    return { team, player };
  });
  const images = await Promise.all(rows.map(row => portrait(row.player)));
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Poster export needs canvas support");
  ctx.fillStyle = night; ctx.fillRect(0, 0, 1080, 1350);
  const text = (value: string, x: number, y: number, size: number, color: string, bold = false, mono = false) => {
    ctx.fillStyle = color;
    ctx.font = `${bold ? 800 : 400} ${size}px ${mono ? token("--gh-font-mono") : token("--gh-font-body")}`;
    ctx.fillText(value, x, y);
  };
  text("GOAT HOOPERS / THE ROSTER DRAFT", 64, 65, 19, white, false, true);
  text("82–0", 813, 69, 39, gold, true);
  ctx.strokeStyle = gold; ctx.lineWidth = 2.5;
  for (let ray = 0; ray < 8; ray++) {
    const angle = Math.PI * ray / 4;
    ctx.beginPath(); ctx.moveTo(993, 55); ctx.lineTo(993 + Math.cos(angle) * 17, 55 + Math.sin(angle) * 17); ctx.stroke();
  }
  text("BUILT", 59, 158, 104, white, true);
  text("DIFFERENT.", 59, 251, 104, gold, true);
  text("YOUR DEMO LINEUP / FIVE PICKS", 64, 296, 18, white, false, true);
  rows.forEach(({ team, player }, index) => {
    const y = 330 + index * 170;
    const color = token(`--gh-draft-${team.id}`), ink = token(`--gh-draft-${team.id}-ink`);
    ctx.save();
    ctx.fillStyle = color; ctx.fillRect(64, y, 952, 164);
    ctx.beginPath(); ctx.rect(64, y, 952, 164); ctx.clip();
    const image = images[index];
    if (image) {
      const height = 220, width = image.width / image.height * height;
      ctx.drawImage(image, 1000 - width, y - 6, width, height);
      const gradient = ctx.createLinearGradient(570, 0, 820, 0);
      gradient.addColorStop(0, color); gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient; ctx.fillRect(540, y, 300, 164);
    }
    text(`0${index + 1}`, 84, y + 38, 19, ink, false, true);
    text(player.firstName, 137, y + 49, 27, white);
    let nameSize = 56;
    ctx.font = `800 ${nameSize}px ${token("--gh-font-body")}`;
    while (ctx.measureText(player.lastName).width > 600 && nameSize > 30) {
      nameSize -= 2; ctx.font = `800 ${nameSize}px ${token("--gh-font-body")}`;
    }
    text(player.lastName, 134, y + 107, nameSize, white, true);
    text(`${team.abbreviation} / ${player.position.toUpperCase()}`, 137, y + 140, 16, ink, false, true);
    ctx.restore();
  });
  text("WEEK 02 / UNRANKED DEMO", 64, 1234, 19, gold, false, true);
  text("ILLUSTRATIVE TEAM PAIRINGS · NO SEASON PREDICTION", 64, 1274, 17, white, false, true);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Poster export failed")), "image/png"));
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url; link.download = "goat-hoopers-week-02-demo-lineup.png"; link.click();
  } finally { window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
