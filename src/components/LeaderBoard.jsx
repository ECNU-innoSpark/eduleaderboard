import { useMemo, useRef, useState } from "react";
import leaderboardCsv from "../../data/实验结果整理 - 主要模型实验对比.csv?raw";
import "./LeaderBoard.css";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        continue;
      }
      field += ch;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (ch === "\r") continue;
    if (ch === "\n") {
      row.push(field);
      field = "";
      const isEmpty = row.every((v) => String(v ?? "").trim() === "");
      if (!isEmpty) rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  row.push(field);
  const isEmpty = row.every((v) => String(v ?? "").trim() === "");
  if (!isEmpty) rows.push(row);

  return rows;
}

function toNumberLoose(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/[%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function makeUniqueHeaderKeys(headers) {
  const seen = new Map();
  return headers.map((h) => {
    const base = String(h ?? "").trim() || "字段";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const key = n === 1 ? base : `${base}__${n}`;
    const label = n === 1 ? base : `${base}（${n}）`;
    return { base, key, label };
  });
}

function guessScoreColumns(rows, headerMeta) {
  const excluded = new Set(["模型名", "版本号", "备注", "模型路径"]);
  const header = rows[0].map((h) => String(h ?? "").trim());
  const hasAvgHeader = header.some((h) => h.includes("平均值"));
  const candidates = [];

  for (let c = 0; c < header.length; c++) {
    const name = header[c];
    if (!name || excluded.has(name)) continue;
    if (hasAvgHeader && name.includes("平均值")) continue;
    const hasCJK = /[\u4e00-\u9fa5]/.test(name);
    if (!hasCJK) continue;

    let numericCount = 0;
    let nonEmptyCount = 0;
    const sampleValues = [];

    for (const r of rows.slice(1)) {
      const raw = r[c];
      const s = String(raw ?? "").trim();
      if (!s) continue;
      nonEmptyCount++;
      const n = toNumberLoose(s);
      if (n != null) {
        numericCount++;
        if (sampleValues.length < 20) sampleValues.push(n);
      }
    }

    if (nonEmptyCount === 0) continue;
    const numericRatio = numericCount / nonEmptyCount;
    if (numericRatio < 0.7) continue;

    const max = sampleValues.length ? Math.max(...sampleValues) : 0;
    candidates.push({
      colIndex: c,
      baseName: name,
      label: headerMeta[c]?.label ?? name,
      key: headerMeta[c]?.key ?? name,
      max,
    });
  }

  candidates.sort((a, b) => {
    const aIsAvg = a.baseName.includes("平均");
    const bIsAvg = b.baseName.includes("平均");
    if (aIsAvg !== bIsAvg) return aIsAvg ? -1 : 1;
    return a.colIndex - b.colIndex;
  });

  return candidates;
}

function buildLeaderboardFromCsv(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return { models: [], dimensions: [] };

  const header = rows[0].map((h) => String(h ?? "").trim());
  const headerMeta = makeUniqueHeaderKeys(header);
  const idx = (name) => header.findIndex((h) => h === name);

  const iName = idx("模型名");
  const iVer = idx("版本号");
  const iOrg = idx("备注");
  const iParams = idx("模型路径");

  const scoreCols = guessScoreColumns(rows, headerMeta);
  const dimensions = scoreCols.map((c) => ({ key: c.key, label: c.label, colIndex: c.colIndex }));

  let id = 1;
  const models = [];
  for (const r of rows.slice(1)) {
    const name = String(r[iName] ?? "").trim();
    if (!name) continue;

    const scores = {};
    let hasAnyScore = false;
    for (const c of scoreCols) {
      const n = toNumberLoose(r[c.colIndex]);
      if (n != null) hasAnyScore = true;
      scores[c.key] = n;
    }
    if (!hasAnyScore) continue;

    models.push({
      id: id++,
      name,
      version: String(r[iVer] ?? "").trim(),
      organization: String(r[iOrg] ?? "").trim(),
      params: String(r[iParams] ?? "").trim(),
      trend: 0,
      scores,
    });
  }

  return { models, dimensions };
}

function useLeaderboard() {
  const { models, dimensions } = useMemo(() => buildLeaderboardFromCsv(leaderboardCsv), []);
  const [currentDimension, setCurrentDimension] = useState(dimensions[0]?.key ?? "");

  const currentDimensionMax = useMemo(() => {
    if (!currentDimension) return 0;
    let max = 0;
    for (const m of models) {
      const raw = m.scores?.[currentDimension];
      if (raw == null) continue;
      const v = Number(raw);
      if (Number.isFinite(v)) max = Math.max(max, v);
    }
    return max;
  }, [currentDimension, models]);

  const rankedModels = useMemo(() => {
    const sorted = [...models].sort((a, b) => {
      return b.scores[currentDimension] - a.scores[currentDimension];
    });

    let lastScore = null;
    let lastRank = 0;

    return sorted.map((m, index) => {
      const score = m.scores[currentDimension];
      if (score !== lastScore) {
        lastRank = index + 1;
        lastScore = score;
      }
      return { ...m, _rank: lastRank };
    });
  }, [currentDimension, models]);

  const getScorePercent = (v) => {
    const max = currentDimensionMax;
    if (v == null) return 0;
    const n = Number(v);
    if (!Number.isFinite(n) || max <= 0) return 0;
    return Math.max(0, Math.min(100, (n / max) * 100));
  };

  const formatScore = (v) => {
    if (v == null) return "";
    const n = Number(v);
    if (!Number.isFinite(n)) return "";
    const decimals = Math.abs(n - Math.round(n)) < 1e-9 ? 0 : 2;
    return n.toFixed(decimals);
  };

  return {
    dimensions,
    currentDimension,
    setCurrentDimension,
    rankedModels,
    getScorePercent,
    formatScore,
  };
}

function isEnglishLabel(label) {
  if (!label) return false;
  const s = String(label).trim();
  const hasLatin = /[A-Za-z]/.test(s);
  const hasCJK = /[\u4e00-\u9fa5]/.test(s);
  return hasLatin && !hasCJK;
}

function displayDimLabel(label) {
  if (!label) return "";
  const s = String(label).trim();
  return isEnglishLabel(s) ? s.toUpperCase() : s;
}

export default function LeaderBoard() {
  const { dimensions, currentDimension, setCurrentDimension, rankedModels, getScorePercent, formatScore } =
    useLeaderboard();
  const scrollRef = useRef(null);

  const scrollTabs = (delta) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: delta,
      behavior: "smooth",
    });
  };

  const scrollLeft = () => scrollTabs(-160);
  const scrollRight = () => scrollTabs(160);

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2>LLM 排行榜</h2>
        <p className="subtitle">基于多维度评测的模型排名</p>
      </div>

      <div className="dimension-tabs-wrapper">
        <button className="tab-arrow left" type="button" onClick={scrollLeft}>
          ‹
        </button>

        <div className="dimension-tabs" ref={scrollRef}>
          {dimensions.map((dim) => (
            <button
              key={dim.key}
              className={`tab ${currentDimension === dim.key ? "active" : ""}`}
              onClick={() => setCurrentDimension(dim.key)}
            >
              <span
                className={`tab-label ${
                  isEnglishLabel(dim.label) ? "tab-label-en" : ""
                }`}
              >
                {displayDimLabel(dim.label)}
              </span>
            </button>
          ))}
        </div>

        <button className="tab-arrow right" type="button" onClick={scrollRight}>
          ›
        </button>
      </div>

      <div className="table-container">
        <table className="ranking-table">
          <thead>
            <tr>
              <th className="rank-col">排名</th>
              <th className="model-col">模型</th>
              <th className="score-col">评分</th>
              <th className="trend-col">趋势</th>
            </tr>
          </thead>
          <tbody>
            {rankedModels.map((model) => (
              <tr
                key={model.id}
                className={`model-row ${model._rank <= 3 ? "highlight" : ""}`}
              >
                <td className="rank-col">
                  <div className={`rank-badge rank-${model._rank}`}>
                    {model._rank}
                  </div>
                </td>
                <td className="model-col">
                  <div className="model-info">
                    <span className="model-name">{model.name}</span>
                  </div>
                </td>
                <td className="score-col">
                  <div className="score-display">
                    <span className="score-value">
                      {formatScore(model.scores[currentDimension])}
                    </span>
                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{
                          width: `${getScorePercent(
                            model.scores[currentDimension]
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="trend-col">
                  <span
                    className={`trend ${
                      model.trend > 0
                        ? "up"
                        : model.trend < 0
                        ? "down"
                        : "same"
                    }`}
                  >
                    {model.trend > 0 && <>↑ {model.trend}</>}
                    {model.trend < 0 && <>↓ {Math.abs(model.trend)}</>}
                    {model.trend === 0 && "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

