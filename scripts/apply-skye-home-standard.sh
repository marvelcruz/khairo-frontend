#!/usr/bin/env bash
set -euo pipefail

curl -fsSL "https://raw.githubusercontent.com/marvelcruz/khairo-frontend/feature/skye-home-standard/.github/workflows/apply-skye-home-standard.yml" -o /tmp/skye-template.yml
python - <<'PY'
from pathlib import Path
text = Path('/tmp/skye-template.yml').read_text(encoding='utf-8')
start_marker = "          python - <<'PY'\n"
end_marker = "\n          PY\n\n      - name: Install Lenis"
start = text.index(start_marker) + len(start_marker)
end = text.index(end_marker, start)
code = '\n'.join(line[10:] if line.startswith('          ') else line for line in text[start:end].splitlines())
exec(compile(code, 'skye-home-standard-generator.py', 'exec'))
PY

python - <<'PY'
from pathlib import Path
p = Path('src/app/dashboard/clients/[id]/page.tsx')
if p.exists():
    s = p.read_text(encoding='utf-8')
    head = s.split('type DailyLog = {', 1)[0]
    marker = '  currentWeightKg?: number;\n'
    if 'type Client = {' in head and 'calorieCalculation?:' not in head and marker in s:
        addition = '  calorieCalculation?: {\n    gender?: string;\n    age?: number;\n    heightCm?: number;\n    weightKg?: number;\n    activityLevel?: string;\n    tdeeKcal?: number;\n    updatedAt?: string;\n  };\n'
        p.write_text(s.replace(marker, marker + addition, 1), encoding='utf-8')
PY

npm install lenis@^1.3.26 --save
npm run build

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -A
if ! git diff --cached --quiet; then
  git commit -m "Standardize homepage with Skye design system"
  git push origin HEAD:feature/skye-home-standard
fi
