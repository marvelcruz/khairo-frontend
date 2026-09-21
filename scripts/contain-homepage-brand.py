from pathlib import Path
import os
import re
import subprocess

REPO = os.environ["GITHUB_REPOSITORY"].split("/")[-1]

PALETTES = {
    "khairo-frontend": {"background":"#081310","surface":"#0E201B","surfaceSoft":"#16322B","text":"#FFFFFF","muted":"#B8C8C2","primaryColor":"#0D9488","secondaryColor":"#3BE0A0","accentColor":"#E8C56A","buttonColor":"#0D9488","buttonTextColor":"#FFFFFF"},
    "Fitlunge-frontend": {"background":"#0A0A0B","surface":"#16161A","surfaceSoft":"#252529","text":"#FFFFFF","muted":"#B8B8C0","primaryColor":"#EC008C","secondaryColor":"#FF6FB5","accentColor":"#E8C56A","buttonColor":"#EC008C","buttonTextColor":"#FFFFFF"},
    "getslim-weight-loss-center-frontend": {"background":"#0A1720","surface":"#102533","surfaceSoft":"#183746","text":"#FFFFFF","muted":"#B7C8CE","primaryColor":"#0E7486","secondaryColor":"#58C4C8","accentColor":"#B8E3E0","buttonColor":"#0E7486","buttonTextColor":"#FFFFFF"},
    "dr-dammies-weightloss-clinic-frontend": {"background":"#24131F","surface":"#351C2F","surfaceSoft":"#4A2841","text":"#FFF8FB","muted":"#D4BBC9","primaryColor":"#9B365F","secondaryColor":"#E09AAF","accentColor":"#F3C9D5","buttonColor":"#9B365F","buttonTextColor":"#FFFFFF"},
    "noureesh-nutrition-clinic-frontend": {"background":"#10251A","surface":"#173423","surfaceSoft":"#21482F","text":"#FFFDF6","muted":"#C5D2C7","primaryColor":"#5B7F1D","secondaryColor":"#A3A791","accentColor":"#FBBB7B","buttonColor":"#5B7F1D","buttonTextColor":"#FFFFFF"},
    "one2one-diet-west-africa-frontend": {"background":"#221A3F","surface":"#302354","surfaceSoft":"#44316F","text":"#FFFFFF","muted":"#D7CFE7","primaryColor":"#6A3FA0","secondaryColor":"#EF6E93","accentColor":"#F7B5C7","buttonColor":"#6A3FA0","buttonTextColor":"#FFFFFF"},
    "poisera-nutrition-frontend": {"background":"#143126","surface":"#1D4434","surfaceSoft":"#285B45","text":"#FFFDF8","muted":"#C5D5CC","primaryColor":"#2F7D5A","secondaryColor":"#86B98B","accentColor":"#D7B96E","buttonColor":"#2F7D5A","buttonTextColor":"#FFFFFF"},
    "quincy-wellness-frontend": {"background":"#19251C","surface":"#243429","surfaceSoft":"#304936","text":"#FFF9EA","muted":"#C7CEBF","primaryColor":"#356B45","secondaryColor":"#7FA36A","accentColor":"#C7A55B","buttonColor":"#C7A55B","buttonTextColor":"#182019"},
    "lifemd-weight-management-frontend": {"background":"#073D4B","surface":"#0B4B59","surfaceSoft":"#125E69","text":"#FFFFFF","muted":"#C0DADF","primaryColor":"#56C6C6","secondaryColor":"#9BE0E1","accentColor":"#FFFFFF","buttonColor":"#56C6C6","buttonTextColor":"#073D4B"},
    "medi-weightloss-frontend": {"background":"#25272A","surface":"#32353A","surfaceSoft":"#44484D","text":"#FFFFFF","muted":"#C9CBCD","primaryColor":"#21B6B0","secondaryColor":"#7B7D82","accentColor":"#8EE1DD","buttonColor":"#21B6B0","buttonTextColor":"#FFFFFF"},
    "mochi-health-frontend": {"background":"#372627","surface":"#4A3232","surfaceSoft":"#60403F","text":"#FFF8F2","muted":"#E3CCC1","primaryColor":"#E98A74","secondaryColor":"#F1B6A3","accentColor":"#F6D7A7","buttonColor":"#E98A74","buttonTextColor":"#2D2020"},
    "form-health-frontend": {"background":"#28170E","surface":"#3B2114","surfaceSoft":"#50301E","text":"#FFF9F4","muted":"#E1C6B8","primaryColor":"#FF5A1F","secondaryColor":"#FF8A55","accentColor":"#FFD1B8","buttonColor":"#FF5A1F","buttonTextColor":"#FFFFFF"},
    "ro-body-frontend": {"background":"#1C1C1C","surface":"#292929","surfaceSoft":"#3B3A3A","text":"#F0EFED","muted":"#B6B3B0","primaryColor":"#F0EFED","secondaryColor":"#888787","accentColor":"#D8D3CC","buttonColor":"#F0EFED","buttonTextColor":"#1C1C1C"},
    "options-medical-weight-loss-frontend": {"background":"#073B3B","surface":"#0A5050","surfaceSoft":"#126767","text":"#FFFFFF","muted":"#C2DCDD","primaryColor":"#0B6263","secondaryColor":"#48AEB7","accentColor":"#8ED7DC","buttonColor":"#0B6263","buttonTextColor":"#FFFFFF"},
    "felix-health-frontend": {"background":"#0D1F4B","surface":"#142A61","surfaceSoft":"#1C397D","text":"#FFFFFF","muted":"#C7D0E4","primaryColor":"#173A78","secondaryColor":"#6B8CD5","accentColor":"#BFD0FF","buttonColor":"#173A78","buttonTextColor":"#FFFFFF"},
    "jill-health-frontend": {"background":"#3A232A","surface":"#503039","surfaceSoft":"#6A404B","text":"#FFF9F8","muted":"#E6CED2","primaryColor":"#F0A6A4","secondaryColor":"#F6C3C1","accentColor":"#FFE1D9","buttonColor":"#F0A6A4","buttonTextColor":"#3A232A"},
    "science-and-humans-frontend": {"background":"#0A0A0A","surface":"#171717","surfaceSoft":"#242424","text":"#FFFFFF","muted":"#B8B8B8","primaryColor":"#FFFFFF","secondaryColor":"#A7A7A7","accentColor":"#D8D8D8","buttonColor":"#FFFFFF","buttonTextColor":"#000000"},
    "wharton-medical-clinic-frontend": {"background":"#0D2B3A","surface":"#123B4E","surfaceSoft":"#194D63","text":"#FFFFFF","muted":"#C4D3DB","primaryColor":"#2A7594","secondaryColor":"#6FB5C8","accentColor":"#B7DEE7","buttonColor":"#2A7594","buttonTextColor":"#FFFFFF"},
    "jack-health-frontend": {"background":"#111C2C","surface":"#18283C","surfaceSoft":"#22384F","text":"#FFFFFF","muted":"#C3CDD8","primaryColor":"#214D7A","secondaryColor":"#65A1C7","accentColor":"#AED5EA","buttonColor":"#214D7A","buttonTextColor":"#FFFFFF"},
    "circle-health-frontend": {"background":"#07365A","surface":"#0A4A77","surfaceSoft":"#0F5D95","text":"#FFFFFF","muted":"#C6DDF0","primaryColor":"#0F5D95","secondaryColor":"#1999F5","accentColor":"#7EC9FF","buttonColor":"#1999F5","buttonTextColor":"#FFFFFF"},
    "juniper-uk-frontend": {"background":"#26213A","surface":"#342D4C","surfaceSoft":"#453B61","text":"#FFFDF9","muted":"#D6CEE5","primaryColor":"#7D65A9","secondaryColor":"#C6B4E2","accentColor":"#E6D8B8","buttonColor":"#7D65A9","buttonTextColor":"#FFFFFF"},
    "second-nature-health-frontend": {"background":"#172021","surface":"#273227","surfaceSoft":"#39443A","text":"#FAF0E2","muted":"#C9C8B8","primaryColor":"#5B7F1D","secondaryColor":"#FBBB7B","accentColor":"#FAF0E2","buttonColor":"#5B7F1D","buttonTextColor":"#FFFFFF"},
    "voy-frontend": {"background":"#122215","surface":"#19301E","surfaceSoft":"#2B4030","text":"#F4F1E7","muted":"#B7BBAF","primaryColor":"#19301E","secondaryColor":"#FFA87C","accentColor":"#3860BE","buttonColor":"#FFA87C","buttonTextColor":"#19301E"},
    "the-slimming-clinic-frontend": {"background":"#073E42","surface":"#0C5356","surfaceSoft":"#14696B","text":"#FFFFFF","muted":"#C5DDDE","primaryColor":"#168B8B","secondaryColor":"#69C5C0","accentColor":"#B8E9E5","buttonColor":"#168B8B","buttonTextColor":"#FFFFFF"},
    "numan-frontend": {"background":"#272357","surface":"#353068","surfaceSoft":"#48417F","text":"#FFFFFF","muted":"#D2CEE0","primaryColor":"#96D2FA","secondaryColor":"#A299AF","accentColor":"#C8E9FF","buttonColor":"#96D2FA","buttonTextColor":"#272357"},
    "weightgone-frontend": {"background":"#2A1840","surface":"#3A2254","surfaceSoft":"#4B2D69","text":"#FFFFFF","muted":"#D9CBE5","primaryColor":"#7B4BA3","secondaryColor":"#C28BD9","accentColor":"#E5C7F1","buttonColor":"#7B4BA3","buttonTextColor":"#FFFFFF"},
    "weightwatchers-clinic-frontend": {"background":"#101C57","surface":"#182870","surfaceSoft":"#23388E","text":"#FFFFFF","muted":"#CED5F1","primaryColor":"#2E5BFF","secondaryColor":"#6F8CFF","accentColor":"#B8C5FF","buttonColor":"#2E5BFF","buttonTextColor":"#FFFFFF"},
}

if REPO not in PALETTES:
    raise SystemExit(f"No homepage palette configured for {REPO}")

theme = PALETTES[REPO]

subprocess.run(["git", "fetch", "origin", "main"], check=True)
for path in ["src/components/layout/navbar.tsx", "src/components/layout/footer.tsx"]:
    subprocess.run(["git", "checkout", "origin/main", "--", path], check=True)

dashboard = Path("src/app/dashboard/clients/[id]/page.tsx")
if dashboard.exists():
    subprocess.run(["git", "checkout", "origin/main", "--", str(dashboard)], check=True)
    d = dashboard.read_text(encoding="utf-8")
    head = d.split("type DailyLog = {", 1)[0]
    marker = "  currentWeightKg?: number;\n"
    if "type Client = {" in head and "calorieCalculation?:" not in head and marker in d and ".calorieCalculation" in d:
        addition = """  calorieCalculation?: {
    gender?: string;
    age?: number;
    heightCm?: number;
    weightKg?: number;
    activityLevel?: string;
    tdeeKcal?: number;
    updatedAt?: string;
  };
"""
        dashboard.write_text(d.replace(marker, marker + addition, 1), encoding="utf-8")

config = Path("src/config/homepage.ts")
s = config.read_text(encoding="utf-8")
replacement = '''  theme: {
    primaryColor: "{primaryColor}",
    secondaryColor: "{secondaryColor}",
    accentColor: "{accentColor}",
    buttonColor: "{buttonColor}",
    buttonTextColor: "{buttonTextColor}",
    background: "{background}",
    surface: "{surface}",
    surfaceSoft: "{surfaceSoft}",
    text: "{text}",
    muted: "{muted}",
  },
  nav:'''.format(**theme)
s, count = re.subn(r"  theme: \{.*?\n  \},\n  nav:", replacement, s, count=1, flags=re.S)
if count != 1:
    raise SystemExit("Could not locate homepageConfig.theme")
config.write_text(s, encoding="utf-8")

Path("src/components/home/hero-video.tsx").write_text(r'''import { homepageConfig, type HomepageVideoConfig } from "@/config/homepage";

export function HeroVideo({ video }: { video: HomepageVideoConfig }) {
  const desktop = video.desktop || video.bgVideoUrl;
  const hasVideo = Boolean(desktop || video.tablet || video.mobile);
  const theme = homepageConfig.theme;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {hasVideo ? (
        <video autoPlay muted loop playsInline preload="metadata" poster={video.poster || undefined} className="h-full w-full object-cover object-center">
          {video.mobile ? <source media="(max-width: 767px)" src={video.mobile} /> : null}
          {video.tablet ? <source media="(min-width: 768px) and (max-width: 1023px)" src={video.tablet} /> : null}
          {desktop ? <source src={desktop} /> : null}
        </video>
      ) : (
        <div className="h-full w-full" style={{ background: `radial-gradient(circle at 74% 28%, ${theme.secondaryColor}55 0%, transparent 32%), radial-gradient(circle at 18% 76%, ${theme.primaryColor}44 0%, transparent 36%), linear-gradient(135deg, ${theme.background} 0%, ${theme.surface} 58%, ${theme.background} 100%)` }} />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.82)_0%,rgba(0,0,0,.46)_50%,rgba(0,0,0,.18)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08)_0%,rgba(0,0,0,.1)_55%,rgba(0,0,0,.72)_100%)]" />
    </div>
  );
}
''', encoding="utf-8")

home = Path("src/components/home/standard-homepage.tsx")
h = home.read_text(encoding="utf-8")
old = '''        "--home-bg": homepageConfig.theme.background,
        "--home-surface": homepageConfig.theme.surface,
        "--home-text": homepageConfig.theme.text,
        "--home-muted": homepageConfig.theme.muted,
        "--home-accent": homepageConfig.theme.accent,
        "--home-accent-text": homepageConfig.theme.accentText,'''
new = '''        "--home-bg": homepageConfig.theme.background,
        "--home-surface": homepageConfig.theme.surface,
        "--home-surface-soft": homepageConfig.theme.surfaceSoft,
        "--home-text": homepageConfig.theme.text,
        "--home-muted": homepageConfig.theme.muted,
        "--home-primary": homepageConfig.theme.primaryColor,
        "--home-secondary": homepageConfig.theme.secondaryColor,
        "--home-accent": homepageConfig.theme.accentColor,
        "--home-button": homepageConfig.theme.buttonColor,
        "--home-button-text": homepageConfig.theme.buttonTextColor,'''
if old not in h:
    raise SystemExit("Could not locate homepage CSS variable block")
h = h.replace(old, new, 1)
h = h.replace("bg-[var(--home-accent)]", "bg-[var(--home-button)]")
h = h.replace("text-[var(--home-accent-text)]", "text-[var(--home-button-text)]")
h = h.replace("border-[var(--home-accent)] bg-[var(--home-button)] text-[var(--home-button-text)]", "border-[var(--home-primary)] bg-[var(--home-primary)] text-[var(--home-button-text)]")
home.write_text(h, encoding="utf-8")

print(f"Homepage-only brand correction applied to {REPO}")
