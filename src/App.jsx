import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  Download,
  RotateCcw,
  Activity,
  Timer,
  MapPin,
  AlertCircle,
  Gauge,
  Users,
  FileText,
  Upload,
  StepBack,
  StepForward,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Play,
  Pause,
  ScanLine,
} from "lucide-react";

const DEFAULT_STATE = {
  date: "",
  leg: "",
  giver: "",
  receiver: "",
  attempt: "",
  steps: "",
  fps: "",
  startFrame: "",
  markFrame: "",
  handFrame: "",
  passFrame: "",
  frames: {
    giverMinus5: "",
    giver0: "",
    receiver5: "",
    giver5: "",
    receiver10: "",
    giver10: "",
    receiver15: "",
    giver15: "",
    receiver20: "",
    giver20: "",
    receiver25: "",
    giver25: "",
    receiver30: "",
    receiver35: "",
    receiver40: "",
  },
};

const SELECTION_TASKS = [
  { type: "form", key: "markFrame", label: "渡し手マーク通過コマ", help: "渡し手が受け手のスタートマークを通過する瞬間のコマを選択してください。" },
  { type: "form", key: "startFrame", label: "動き出しコマ", help: "受け手のつま先が地面から離れた瞬間のコマを選択してください。" },
  { type: "frame", key: "giverMinus5", label: "渡し手 -5m 通過コマ", help: "渡し手が -5m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "giver0", label: "渡し手 0m 通過コマ", help: "渡し手が 0m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "receiver5", label: "受け手 5m 通過コマ", help: "受け手が 5m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "giver5", label: "渡し手 5m 通過コマ", help: "渡し手が 5m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "receiver10", label: "受け手 10m 通過コマ", help: "受け手が 10m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "giver10", label: "渡し手 10m 通過コマ", help: "渡し手が 10m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "receiver15", label: "受け手 15m 通過コマ", help: "受け手が 15m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "giver15", label: "渡し手 15m 通過コマ", help: "渡し手が 15m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "receiver20", label: "受け手 20m 通過コマ", help: "受け手が 20m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "giver20", label: "渡し手 20m 通過コマ", help: "渡し手が 20m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "receiver25", label: "受け手 25m 通過コマ", help: "受け手が 25m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "giver25", label: "渡し手 25m 通過コマ", help: "渡し手が 25m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "receiver30", label: "受け手 30m 通過コマ", help: "受け手が 30m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "receiver35", label: "受け手 35m 通過コマ", help: "受け手が 35m 地点を通過するコマを選択してください。" },
  { type: "frame", key: "receiver40", label: "受け手 40m 通過コマ", help: "受け手が 40m 地点を通過するコマを選択してください。" },
  { type: "form", key: "handFrame", label: "挙手コマ", help: "受け手の手が上がり、受ける姿勢で静止した初めのコマを選択してください。" },
  { type: "form", key: "passFrame", label: "バトンパス完了コマ", help: "バトンが受け手に渡り切った瞬間のコマを選択してください。" },
];

const FRAME_FIELDS = SELECTION_TASKS.filter((task) => task.type === "frame");

const RECEIVER_FRAME_POINTS = [
  { key: "startFrame", distance: 0, label: "0-5m" },
  { key: "receiver5", distance: 5, label: "0-5m" },
  { key: "receiver10", distance: 10, label: "5-10m" },
  { key: "receiver15", distance: 15, label: "10-15m" },
  { key: "receiver20", distance: 20, label: "15-20m" },
  { key: "receiver25", distance: 25, label: "20-25m" },
  { key: "receiver30", distance: 30, label: "25-30m" },
  { key: "receiver35", distance: 35, label: "30-35m" },
  { key: "receiver40", distance: 40, label: "35-40m" },
];

const GIVER_FRAME_POINTS = [
  { key: "giverMinus5", distance: -5, label: "-5-0m" },
  { key: "giver0", distance: 0, label: "-5-0m" },
  { key: "giver5", distance: 5, label: "0-5m" },
  { key: "giver10", distance: 10, label: "5-10m" },
  { key: "giver15", distance: 15, label: "10-15m" },
  { key: "giver20", distance: 20, label: "15-20m" },
  { key: "giver25", distance: 25, label: "20-25m" },
];

function parseNum(value) {
  const text = String(value ?? "").trim();
  if (text === "") return NaN;
  const parsed = Number(text.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function median(values) {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function solveLinearSystem(matrix, vector) {
  const n = vector.length;
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivot][col])) pivot = row;
    }
    if (Math.abs(augmented[pivot][col]) < 1e-12) return null;

    [augmented[col], augmented[pivot]] = [augmented[pivot], augmented[col]];
    const divisor = augmented[col][col];
    for (let j = col; j <= n; j += 1) augmented[col][j] /= divisor;

    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = col; j <= n; j += 1) augmented[row][j] -= factor * augmented[col][j];
    }
  }

  return augmented.map((row) => row[n]);
}

function polyFitCubic(xs, ys) {
  const order = 4;
  const matrix = Array.from({ length: order }, () => Array(order).fill(0));
  const vector = Array(order).fill(0);

  for (let i = 0; i < xs.length; i += 1) {
    const basis = [1, xs[i], xs[i] ** 2, xs[i] ** 3];
    for (let row = 0; row < order; row += 1) {
      vector[row] += basis[row] * ys[i];
      for (let col = 0; col < order; col += 1) {
        matrix[row][col] += basis[row] * basis[col];
      }
    }
  }

  return solveLinearSystem(matrix, vector);
}

function evalPoly(coeffs, x) {
  if (!coeffs) return NaN;
  return coeffs[0] + coeffs[1] * x + coeffs[2] * x ** 2 + coeffs[3] * x ** 3;
}

function buildDistanceTimeTable(coeffs, maxDistance = 40, step = 0.05) {
  const table = [{ distance: 0, time: 0, velocity: Math.max(evalPoly(coeffs, 0), 0.1) }];
  let time = 0;

  for (let x = step; x <= maxDistance + 1e-9; x += step) {
    const previousX = x - step;
    const v1 = Math.max(evalPoly(coeffs, previousX), 0.1);
    const v2 = Math.max(evalPoly(coeffs, x), 0.1);
    time += step * ((1 / v1 + 1 / v2) / 2);
    table.push({ distance: Number(x.toFixed(3)), time, velocity: v2 });
  }

  return table;
}

function distanceAtTime(table, targetTime) {
  if (!table.length || !Number.isFinite(targetTime) || targetTime < 0) return NaN;
  if (targetTime <= table[0].time) return 0;
  if (targetTime >= table[table.length - 1].time) return table[table.length - 1].distance;

  for (let i = 1; i < table.length; i += 1) {
    if (table[i].time >= targetTime) {
      const previous = table[i - 1];
      const current = table[i];
      const ratio = (targetTime - previous.time) / (current.time - previous.time);
      return previous.distance + ratio * (current.distance - previous.distance);
    }
  }

  return NaN;
}

function elapsedTimeBetweenFrames(startFrame, endFrame, fps) {
  const start = parseNum(startFrame);
  const end = parseNum(endFrame);
  return Number.isFinite(fps) && fps > 0 && Number.isFinite(start) && Number.isFinite(end) ? (end - start) / fps : NaN;
}

function frameSpeeds(points, frameMap, fps) {
  const rows = [];

  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    const f1 = parseNum(frameMap[previous.key]);
    const f2 = parseNum(frameMap[current.key]);
    const distance = current.distance - previous.distance;
    const time = Number.isFinite(fps) && fps > 0 && Number.isFinite(f1) && Number.isFinite(f2) ? (f2 - f1) / fps : NaN;
    const speed = Number.isFinite(time) && time > 0 ? distance / time : NaN;

    rows.push({
      label: current.label,
      start: previous.distance,
      end: current.distance,
      midpoint: (previous.distance + current.distance) / 2,
      time,
      speed,
    });
  }

  return rows;
}

function fmt(value, digits = 3) {
  return Number.isFinite(value) ? value.toFixed(digits) : "--";
}

function runSelfTests() {
  const close = (actual, expected, tolerance = 1e-6) => Math.abs(actual - expected) <= tolerance;
  console.assert(parseNum("1,234.5") === 1234.5, "parseNum should handle commas");
  console.assert(Number.isNaN(parseNum("")), "parseNum should return NaN for empty text");
  console.assert(median([3, 1, 2]) === 2, "median should work for odd length");
  console.assert(median([4, 1, 2, 3]) === 2.5, "median should work for even length");

  const rows = frameSpeeds(
    [
      { key: "a", distance: 0, label: "0-5m" },
      { key: "b", distance: 5, label: "0-5m" },
    ],
    { a: "0", b: "60" },
    60,
  );
  console.assert(close(rows[0].time, 1), "frameSpeeds should compute elapsed time");
  console.assert(close(rows[0].speed, 5), "frameSpeeds should compute speed");
  console.assert(close(elapsedTimeBetweenFrames("100", "160", 60), 1), "elapsedTimeBetweenFrames should compute frame difference divided by fps");
  console.assert(Number.isNaN(elapsedTimeBetweenFrames("160", "100", NaN)), "elapsedTimeBetweenFrames should return NaN for invalid fps");

  const coeffs = polyFitCubic([0, 5, 10, 15], [1, 2, 3, 4]);
  console.assert(Array.isArray(coeffs) && coeffs.length === 4, "polyFitCubic should return four coefficients when enough points are available");

  const table = buildDistanceTimeTable([5, 0, 0, 0], 10, 1);
  console.assert(close(distanceAtTime(table, 1), 5, 0.05), "distanceAtTime should invert distance-time table for constant velocity");

  console.assert(SELECTION_TASKS[SELECTION_TASKS.length - 2].key === "handFrame", "handFrame task should be second to last");
  console.assert(SELECTION_TASKS[SELECTION_TASKS.length - 1].key === "passFrame", "passFrame task should be last");
  console.assert(DEFAULT_STATE.date === "" && DEFAULT_STATE.leg === "", "analysis info defaults should be blank");
}

function Field({ label, value, onChange, type = "text", unit, inputMode = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-slate-400">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode={inputMode}
          className="w-full bg-transparent py-3 text-base font-semibold outline-none"
        />
        {unit ? <span className="text-xs text-slate-400">{unit}</span> : null}
      </div>
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder = "選択してください" }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-slate-400">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none bg-transparent py-3 text-base font-semibold outline-none"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    </label>
  );
}

function StatCard({ icon: Icon, label, value, unit }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        <span className="pb-1 text-sm text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

function SpeedTable({ title, rows }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
      <h2 className="mb-3 text-sm font-bold text-slate-700">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">区間</th>
              <th className="px-3 py-2 text-right">時間</th>
              <th className="px-3 py-2 text-right">速度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={`${row.label}-${row.start}`}>
                <td className="px-3 py-2 font-medium text-slate-700">{row.label}</td>
                <td className="px-3 py-2 text-right text-slate-500">{fmt(row.time, 3)} s</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-900">{fmt(row.speed, 3)} m/s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RelayBatonAnalyzerPrototype() {
  const videoRef = useRef(null);
  const [form, setForm] = useState(DEFAULT_STATE);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoName, setVideoName] = useState("");
  const [duration, setDuration] = useState(NaN);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [taskIndex, setTaskIndex] = useState(0);
  const [fpsStatus, setFpsStatus] = useState("動画を読み込むとFPSの自動推定を試みます。必要に応じて手動補正できます。");

  useEffect(() => {
    runSelfTests();
  }, []);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const setField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const setFrame = (key, value) => setForm((previous) => ({ ...previous, frames: { ...previous.frames, [key]: value } }));

  const fpsNum = parseNum(form.fps);
  const currentFrame = Number.isFinite(fpsNum) && fpsNum > 0 ? Math.round(currentTime * fpsNum) : NaN;
  const activeTask = SELECTION_TASKS[taskIndex];
  const instructionCardClass = taskIndex % 2 === 0
    ? "rounded-3xl bg-slate-900 p-4 text-white"
    : "rounded-3xl bg-indigo-900 p-4 text-white";

  const getTaskValue = (task) => {
    if (!task) return "";
    return task.type === "frame" ? form.frames[task.key] : form[task.key];
  };

  const handleVideoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);

    const nextUrl = URL.createObjectURL(file);
    setVideoUrl(nextUrl);
    setVideoName(file.name);
    setTaskIndex(0);
    setFpsStatus("動画を読み込み中です。読み込み後にFPSの自動推定を試みます。");
  };

  const estimateFps = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (typeof video.requestVideoFrameCallback !== "function") {
      setFpsStatus("このブラウザではFPSの自動推定が制限されています。FPS欄を手動で補正してください。");
      return;
    }

    setFpsStatus("FPSを推定中です。短時間だけ動画を再生してフレーム間隔を測定します。");
    const oldTime = video.currentTime || 0;
    const oldMuted = video.muted;
    const wasPaused = video.paused;
    const deltas = [];
    let lastMediaTime = null;
    let finished = false;

    const finish = (message) => {
      if (finished) return;
      finished = true;
      if (wasPaused) video.pause();
      video.muted = oldMuted;
      video.currentTime = oldTime;

      const dt = median(deltas.filter((delta) => delta > 0.003 && delta < 0.2));
      const estimated = Number.isFinite(dt) ? 1 / dt : NaN;

      if (Number.isFinite(estimated) && estimated >= 15 && estimated <= 240) {
        setField("fps", estimated.toFixed(3));
        setFpsStatus(`FPSを約 ${estimated.toFixed(3)} fps と推定しました。必要に応じて手動補正してください。`);
      } else {
        setFpsStatus(message || "FPSを十分に推定できませんでした。FPS欄を手動で補正してください。");
      }
    };

    const collect = (_now, metadata) => {
      if (lastMediaTime !== null) {
        const delta = metadata.mediaTime - lastMediaTime;
        if (delta > 0) deltas.push(delta);
      }
      lastMediaTime = metadata.mediaTime;
      if (deltas.length >= 24) finish();
      else video.requestVideoFrameCallback(collect);
    };

    try {
      video.muted = true;
      video.requestVideoFrameCallback(collect);
      await video.play();
      window.setTimeout(() => finish("FPS推定がタイムアウトしました。FPS欄を手動で補正してください。"), 2500);
    } catch (_error) {
      finish("自動再生が制限されたためFPS推定を開始できませんでした。再生ボタン後に「FPS再推定」を押してください。");
    }
  };

  const seekToFrame = (frame) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(fpsNum) || fpsNum <= 0 || !Number.isFinite(frame)) return;

    const nextTime = Math.max(0, Math.min(frame / fpsNum, Number.isFinite(duration) ? duration : frame / fpsNum));
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const stepFrames = (frames) => {
    seekToFrame((Number.isFinite(currentFrame) ? currentFrame : 0) + frames);
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play();
    else video.pause();
  };

  const saveCurrentFrameToTask = () => {
    if (!activeTask || !Number.isFinite(currentFrame)) return;
    const value = String(currentFrame);

    if (activeTask.type === "frame") setFrame(activeTask.key, value);
    else setField(activeTask.key, value);

    if (taskIndex < SELECTION_TASKS.length - 1) setTaskIndex(taskIndex + 1);
  };

  const result = useMemo(() => {
    const fps = parseNum(form.fps);
    const start = parseNum(form.startFrame);
    const mark = parseNum(form.markFrame);
    const hand = parseNum(form.handFrame);
    const pass = parseNum(form.passFrame);
    const frameMap = { ...form.frames, startFrame: form.startFrame };

    const receiverRows = frameSpeeds(RECEIVER_FRAME_POINTS, frameMap, fps);
    const giverRows = frameSpeeds(GIVER_FRAME_POINTS, frameMap, fps);
    const receiverValid = receiverRows.filter((row) => Number.isFinite(row.speed) && row.speed > 0);
    const giverValid = giverRows.filter((row) => Number.isFinite(row.speed) && row.speed > 0);
    const warnings = [];

    if (form.fps && (!Number.isFinite(fps) || fps <= 0)) warnings.push("FPSは正の数で入力してください。");
    if (Number.isFinite(hand) && Number.isFinite(start) && hand < start) warnings.push("挙手コマは動き出しコマ以降にしてください。");
    if (Number.isFinite(pass) && Number.isFinite(start) && pass < start) warnings.push("パス完了コマは動き出しコマ以降にしてください。");
    if (receiverValid.length < 4) warnings.push("受け手の距離推定には、少なくとも4区間分の速度が必要です。");
    if (giverValid.length < 4) warnings.push("渡し手の3次曲線表示には、少なくとも4区間分の速度が必要です。");

    const handTime = Number.isFinite(fps) && fps > 0 ? (hand - start) / fps : NaN;
    const passTime = Number.isFinite(fps) && fps > 0 ? (pass - start) / fps : NaN;
    const startTiming = Number.isFinite(fps) && fps > 0 ? (start - mark) / fps : NaN;

    const receiverCoeff = receiverValid.length >= 4 ? polyFitCubic(receiverValid.map((row) => row.midpoint), receiverValid.map((row) => row.speed)) : null;
    const giverCoeff = giverValid.length >= 4 ? polyFitCubic(giverValid.map((row) => row.midpoint), giverValid.map((row) => row.speed)) : null;
    const receiverTable = receiverCoeff ? buildDistanceTimeTable(receiverCoeff) : [];
    const maxReceiverTime = receiverTable.length ? receiverTable[receiverTable.length - 1].time : NaN;

    if (Number.isFinite(handTime) && Number.isFinite(maxReceiverTime) && handTime > maxReceiverTime) {
      warnings.push("挙手時刻が受け手40m到達時間を超えています。40mで打ち切って表示します。");
    }
    if (Number.isFinite(passTime) && Number.isFinite(maxReceiverTime) && passTime > maxReceiverTime) {
      warnings.push("パス完了時刻が受け手40m到達時間を超えています。40mで打ち切って表示します。");
    }

    const handDistance = receiverTable.length ? distanceAtTime(receiverTable, handTime) : NaN;
    const passDistance = receiverTable.length ? distanceAtTime(receiverTable, passTime) : NaN;
    const baton30Time = elapsedTimeBetweenFrames(form.frames.giver0, form.frames.receiver30, fps);
    const baton40Time = elapsedTimeBetweenFrames(form.frames.giver0, form.frames.receiver40, fps);

    const speedChartData = [];
    for (let x = -5; x <= 40; x += 0.5) {
      const receiverVelocity = receiverCoeff && x >= 0 && x <= 40 ? Math.max(evalPoly(receiverCoeff, x), 0) : null;
      const giverVelocity = giverCoeff && x >= -5 && x <= 25 ? Math.max(evalPoly(giverCoeff, x), 0) : null;
      speedChartData.push({
        distance: Number(x.toFixed(1)),
        receiverVelocity: receiverVelocity === null ? null : Number(receiverVelocity.toFixed(3)),
        giverVelocity: giverVelocity === null ? null : Number(giverVelocity.toFixed(3)),
      });
    }

    return {
      receiverRows,
      giverRows,
      handTime,
      passTime,
      startTiming,
      handDistance,
      passDistance,
      handToPassTime: passTime - handTime,
      handToPassDistance: passDistance - handDistance,
      baton30Time,
      baton40Time,
      speedChartData,
      warnings,
    };
  }, [form]);

  const reset = () => {
    setForm(DEFAULT_STATE);
    setTaskIndex(0);
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-area { max-width: none !important; width: 100% !important; padding: 0 !important; }
          .rounded-3xl, .rounded-2xl { border-radius: 12px !important; }
          section, .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="print-area mx-auto max-w-md px-4 pb-28 pt-5">
          <header className="mb-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              <Activity className="h-3.5 w-3.5" />
              Relay Baton Analyzer
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">バトンパス分析</h1>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              動画をアップロードし、指示に従ってコマ送りで必要なコマを登録します。登録後、渡し手・受け手の速度とパス位置を自動計算します。
            </p>
          </header>

          <section className="no-print rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
            <div className="mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-700">動画アップロード</h2>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center active:scale-[0.99]">
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="mt-2 text-sm font-bold text-slate-700">動画を選択</span>
              <span className="mt-1 text-xs text-slate-400">mp4 / mov など</span>
              <input className="hidden" type="file" accept="video/*" onChange={handleVideoUpload} />
            </label>
            {videoName ? <p className="mt-2 truncate text-xs text-slate-500">読み込み中: {videoName}</p> : null}
            <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">{fpsStatus}</p>
          </section>

          {videoUrl ? (
            <section className="no-print mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
              <div className={instructionCardClass}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs opacity-80">次に選択するコマ</p>
                  <p className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{taskIndex + 1} / {SELECTION_TASKS.length}</p>
                </div>
                <h3 className="text-xl font-bold">{activeTask.label}</h3>
                <p className="mt-2 text-sm leading-6 opacity-90">{activeTask.help}</p>
                <p className="mt-2 text-xs opacity-80">現在値: {getTaskValue(activeTask) || "未選択"}</p>
              </div>

              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                className="mt-3 w-full rounded-2xl bg-black"
                onLoadedMetadata={(event) => {
                  setDuration(event.currentTarget.duration);
                  setCurrentTime(event.currentTarget.currentTime || 0);
                  estimateFps();
                }}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onSeeked={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              <div className="mt-3 grid grid-cols-3 gap-3">
                <Field label="FPS" value={form.fps} onChange={(value) => setField("fps", value)} unit="fps" inputMode="decimal" />
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">現在時刻</p>
                  <p className="mt-1 text-base font-bold">{fmt(currentTime, 3)} s</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">現在コマ</p>
                  <p className="mt-1 text-base font-bold">{Number.isFinite(currentFrame) ? currentFrame : "--"}</p>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max={Number.isFinite(duration) ? duration : 0}
                step={Number.isFinite(fpsNum) && fpsNum > 0 ? 1 / fpsNum : 0.001}
                value={currentTime}
                onChange={(event) => {
                  const nextTime = Number(event.target.value);
                  if (videoRef.current) videoRef.current.currentTime = nextTime;
                  setCurrentTime(nextTime);
                }}
                className="mt-4 w-full"
              />

              <div className="mt-3 grid grid-cols-5 gap-2">
                <button onClick={() => stepFrames(-10)} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="10コマ戻る">
                  <ChevronsLeft className="mx-auto h-4 w-4" />
                </button>
                <button onClick={() => stepFrames(-1)} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="1コマ戻る">
                  <StepBack className="mx-auto h-4 w-4" />
                </button>
                <button onClick={togglePlay} className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm" aria-label="再生停止">
                  {isPlaying ? <Pause className="mx-auto h-4 w-4" /> : <Play className="mx-auto h-4 w-4" />}
                </button>
                <button onClick={() => stepFrames(1)} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="1コマ進む">
                  <StepForward className="mx-auto h-4 w-4" />
                </button>
                <button onClick={() => stepFrames(10)} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="10コマ進む">
                  <ChevronsRight className="mx-auto h-4 w-4" />
                </button>
              </div>

              <button onClick={saveCurrentFrameToTask} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-base font-bold text-white shadow-sm active:scale-[0.99]">
                <CheckCircle2 className="h-4 w-4" />
                現在コマを登録して次へ
              </button>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button onClick={() => setTaskIndex(Math.max(0, taskIndex - 1))} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">
                  前の指示
                </button>
                <button onClick={estimateFps} className="flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 shadow-sm">
                  <ScanLine className="h-4 w-4" />
                  FPS再推定
                </button>
                <button onClick={() => setTaskIndex(Math.min(SELECTION_TASKS.length - 1, taskIndex + 1))} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">
                  次の指示
                </button>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-slate-900" style={{ width: `${((taskIndex + 1) / SELECTION_TASKS.length) * 100}%` }} />
              </div>
            </section>
          ) : null}

          <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-700">分析情報</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="日付" type="date" value={form.date} onChange={(value) => setField("date", value)} />
              <SelectField label="走順" value={form.leg} onChange={(value) => setField("leg", value)} options={["1-2走", "2-3走", "3-4走"]} />
              <Field label="渡し手" value={form.giver} onChange={(value) => setField("giver", value)} />
              <Field label="受け手" value={form.receiver} onChange={(value) => setField("receiver", value)} />
              <Field label="試技回数" value={form.attempt} onChange={(value) => setField("attempt", value)} />
              <Field label="歩数" value={form.steps} onChange={(value) => setField("steps", value)} inputMode="decimal" />
            </div>
          </section>

          {result.warnings.length > 0 ? (
            <section className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-2 text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <h2 className="text-sm font-bold">確認してください</h2>
                  <ul className="mt-1 list-disc pl-4 text-xs leading-5">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-4">
            <h2 className="mb-3 px-1 text-sm font-bold text-slate-700">主要結果</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Timer} label="挙手まで" value={fmt(result.handTime)} unit="s" />
              <StatCard icon={Timer} label="パス完了まで" value={fmt(result.passTime)} unit="s" />
              <StatCard icon={MapPin} label="挙手時距離" value={fmt(result.handDistance)} unit="m" />
              <StatCard icon={MapPin} label="パス完了時距離" value={fmt(result.passDistance)} unit="m" />
            </div>
            <div className="mt-3 rounded-3xl bg-slate-900 p-4 text-white shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-300">挙手〜パス完了時間</p>
                  <p className="mt-1 text-xl font-bold">
                    {fmt(result.handToPassTime)} <span className="text-sm font-medium text-slate-300">s</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-300">挙手〜パス完了距離</p>
                  <p className="mt-1 text-xl font-bold">
                    {fmt(result.handToPassDistance)} <span className="text-sm font-medium text-slate-300">m</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-3">
            <StatCard icon={Users} label="出のタイミング" value={fmt(result.startTiming)} unit="s" />
            <StatCard icon={Gauge} label="バトン30m通過" value={fmt(result.baton30Time)} unit="s" />
            <StatCard icon={Gauge} label="バトン40m通過" value={fmt(result.baton40Time)} unit="s" />
            <StatCard icon={MapPin} label="完了位置" value={fmt(result.passDistance)} unit="m" />
          </section>

          <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
            <h2 className="mb-2 text-sm font-bold text-slate-700">バトン通過タイムの定義</h2>
            <p className="text-xs leading-5 text-slate-500">
              バトン30m通過タイムは「受け手30m通過コマ − 渡し手0m通過コマ」をFPSで除して算出します。バトン40m通過タイムも同様に「受け手40m通過コマ − 渡し手0m通過コマ」をFPSで除して算出します。
            </p>
          </section>

          <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">渡し手・受け手の速度比較</h2>
              <span className="text-xs text-slate-400">3次回帰</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.speedChartData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="distance" type="number" domain={[-5, 40]} tick={{ fontSize: 11 }} unit="m" />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, "auto"]} />
                  <Tooltip
                    formatter={(value, name) => [`${value} m/s`, name === "receiverVelocity" ? "受け手" : "渡し手"]}
                    labelFormatter={(label) => `${label} m地点`}
                  />
                  <Legend verticalAlign="bottom" height={28} formatter={(value) => (value === "receiverVelocity" ? "受け手" : "渡し手")} />
                  {Number.isFinite(result.handDistance) ? (
                    <ReferenceLine x={Number(result.handDistance.toFixed(1))} strokeDasharray="4 4" label={{ value: "挙手位置", fontSize: 11 }} />
                  ) : null}
                  {Number.isFinite(result.passDistance) ? (
                    <ReferenceLine x={Number(result.passDistance.toFixed(1))} strokeDasharray="4 4" label={{ value: "完了位置", fontSize: 11 }} />
                  ) : null}
                  <Line type="monotone" dataKey="giverVelocity" strokeWidth={3} dot={false} connectNulls name="giverVelocity" />
                  <Line type="monotone" dataKey="receiverVelocity" strokeWidth={3} dot={false} connectNulls name="receiverVelocity" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mt-4 space-y-4">
            <SpeedTable title="渡し手の区間速度" rows={result.giverRows} />
            <SpeedTable title="受け手の区間速度" rows={result.receiverRows} />
          </section>

          <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
            <h2 className="mb-1 text-sm font-bold text-slate-700">選択済みコマ一覧</h2>
            <p className="mb-3 text-xs leading-5 text-slate-500">自動登録後でも、必要に応じて各コマを手入力で修正できます。</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="渡し手マーク通過" value={form.markFrame} onChange={(value) => setField("markFrame", value)} unit="frame" inputMode="decimal" />
              <Field label="動き出し（受け手つま先離地）" value={form.startFrame} onChange={(value) => setField("startFrame", value)} unit="frame" inputMode="decimal" />
              <Field label="挙手（受ける姿勢で静止）" value={form.handFrame} onChange={(value) => setField("handFrame", value)} unit="frame" inputMode="decimal" />
              <Field label="パス完了" value={form.passFrame} onChange={(value) => setField("passFrame", value)} unit="frame" inputMode="decimal" />
              {FRAME_FIELDS.map((field) => (
                <Field
                  key={field.key}
                  label={field.label.replace(" 通過コマ", "")}
                  value={form.frames[field.key]}
                  onChange={(value) => setFrame(field.key, value)}
                  unit="frame"
                  inputMode="decimal"
                />
              ))}
            </div>
          </section>
        </div>

        <div className="no-print fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
            <button onClick={reset} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm active:scale-[0.99]">
              <RotateCcw className="h-4 w-4" />
              リセット
            </button>
            <button onClick={exportPdf} className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm active:scale-[0.99]">
              <Download className="h-4 w-4" />
              PDF出力
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
