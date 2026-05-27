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
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileText,
  Gauge,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  StepBack,
  StepForward,
  Timer,
  Upload,
  Users,
} from "lucide-react";
import {
  buildDistanceTimeTable,
  distanceAtTime,
  elapsedTimeBetweenFrames,
  evalPoly,
  fmt,
  frameSpeeds,
  median,
  parseNum,
  polyFitCubic,
  rowsToCsv,
} from "./lib.js";

const DEFAULT_STATE = {
  date: "2026-05-17",
  leg: "3→4走",
  giver: "平野",
  receiver: "森田",
  attempt: "1回目",
  steps: "",
  timingMemo: "0.5",
  earlyLate: "歩 早出",
  fps: "59.94",
  startFrame: "343",
  markFrame: "353",
  handFrame: "453",
  passFrame: "483",
  frames: {
    giverMinus5: "360",
    giver0: "393",
    receiver5: "403",
    giver5: "426",
    receiver10: "450",
    giver10: "462",
    receiver15: "489",
    giver15: "497",
    receiver20: "527",
    giver20: "535",
    receiver25: "562",
    giver25: "575",
    receiver30: "597.5",
    receiver35: "631",
    receiver40: "665",
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

function Field({ label, value, onChange, type = "text", unit, inputMode = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-slate-400">
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} inputMode={inputMode} className="w-full bg-transparent py-3 text-base font-semibold outline-none" />
        {unit ? <span className="text-xs text-slate-400">{unit}</span> : null}
      </div>
    </label>
  );
}

function StatCard({ icon: Icon, label, value, unit }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium"><Icon className="h-4 w-4" />{label}</div>
      <div className="mt-2 flex items-end gap-1"><span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span><span className="pb-1 text-sm text-slate-500">{unit}</span></div>
    </div>
  );
}

function SpeedTable({ title, rows }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
      <h2 className="mb-3 text-sm font-bold text-slate-700">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2 text-left">区間</th><th className="px-3 py-2 text-right">時間</th><th className="px-3 py-2 text-right">速度</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => <tr key={`${row.label}-${row.start}`}><td className="px-3 py-2 font-medium text-slate-700">{row.label}</td><td className="px-3 py-2 text-right text-slate-500">{fmt(row.time)} s</td><td className="px-3 py-2 text-right font-semibold text-slate-900">{fmt(row.speed)} m/s</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const videoRef = useRef(null);
  const [form, setForm] = useState(DEFAULT_STATE);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoName, setVideoName] = useState("");
  const [duration, setDuration] = useState(NaN);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [taskIndex, setTaskIndex] = useState(0);
  const [fpsStatus, setFpsStatus] = useState("動画を読み込むとFPSの自動推定を試みます。必要に応じて手動補正できます。");

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setFrame = (key, value) => setForm((prev) => ({ ...prev, frames: { ...prev.frames, [key]: value } }));
  const fpsNum = parseNum(form.fps);
  const currentFrame = Number.isFinite(fpsNum) && fpsNum > 0 ? Math.round(currentTime * fpsNum) : NaN;
  const activeTask = SELECTION_TASKS[taskIndex];
  const getTaskValue = (task) => (task.type === "frame" ? form.frames[task.key] : form[task.key]);

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
    } catch {
      finish("自動再生が制限されたためFPS推定を開始できませんでした。再生ボタン後に「FPS再推定」を押してください。");
    }
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

  const seekToFrame = (frame) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(fpsNum) || fpsNum <= 0 || !Number.isFinite(frame)) return;
    const nextTime = Math.max(0, Math.min(frame / fpsNum, Number.isFinite(duration) ? duration : frame / fpsNum));
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };
  const stepFrames = (frames) => seekToFrame((Number.isFinite(currentFrame) ? currentFrame : 0) + frames);
  const togglePlay = async () => { const video = videoRef.current; if (!video) return; if (video.paused) await video.play(); else video.pause(); };
  const saveCurrentFrameToTask = () => {
    if (!Number.isFinite(currentFrame)) return;
    if (activeTask.type === "frame") setFrame(activeTask.key, String(currentFrame));
    else setField(activeTask.key, String(currentFrame));
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
    if (!Number.isFinite(fps) || fps <= 0) warnings.push("FPSは正の数で入力してください。");
    if (!(hand >= start)) warnings.push("挙手コマは動き出しコマ以降にしてください。");
    if (!(pass >= start)) warnings.push("パス完了コマは動き出しコマ以降にしてください。");
    if (receiverValid.length < 4) warnings.push("受け手の距離推定には、少なくとも4区間分の速度が必要です。");
    if (giverValid.length < 4) warnings.push("渡し手の3次曲線表示には、少なくとも4区間分の速度が必要です。");
    const handTime = Number.isFinite(fps) && fps > 0 ? (hand - start) / fps : NaN;
    const passTime = Number.isFinite(fps) && fps > 0 ? (pass - start) / fps : NaN;
    const startTiming = Number.isFinite(fps) && fps > 0 ? (start - mark) / fps : NaN;
    const receiverCoeff = receiverValid.length >= 4 ? polyFitCubic(receiverValid.map((row) => row.midpoint), receiverValid.map((row) => row.speed)) : null;
    const giverCoeff = giverValid.length >= 4 ? polyFitCubic(giverValid.map((row) => row.midpoint), giverValid.map((row) => row.speed)) : null;
    const receiverTable = receiverCoeff ? buildDistanceTimeTable(receiverCoeff) : [];
    const handDistance = receiverTable.length ? distanceAtTime(receiverTable, handTime) : NaN;
    const passDistance = receiverTable.length ? distanceAtTime(receiverTable, passTime) : NaN;
    const baton30Time = elapsedTimeBetweenFrames(form.frames.giver0, form.frames.receiver30, fps);
    const baton40Time = elapsedTimeBetweenFrames(form.frames.giver0, form.frames.receiver40, fps);
    const speedChartData = [];
    for (let x = -5; x <= 40; x += 0.5) {
      const receiverVelocity = receiverCoeff && x >= 0 && x <= 40 ? Math.max(evalPoly(receiverCoeff, x), 0) : null;
      const giverVelocity = giverCoeff && x >= -5 && x <= 25 ? Math.max(evalPoly(giverCoeff, x), 0) : null;
      speedChartData.push({ distance: Number(x.toFixed(1)), receiverVelocity, giverVelocity });
    }
    const distanceTimeChartData = receiverTable.filter((_, i) => i % 10 === 0).map((row) => ({ distance: Number(row.distance.toFixed(1)), time: Number(row.time.toFixed(3)) }));
    return { receiverRows, giverRows, handTime, passTime, startTiming, handDistance, passDistance, handToPassTime: passTime - handTime, handToPassDistance: passDistance - handDistance, baton30Time, baton40Time, speedChartData, distanceTimeChartData, warnings };
  }, [form]);

  const reset = () => { setForm(DEFAULT_STATE); setTaskIndex(0); };
  const exportCsv = () => {
    const rows = [
      ["項目", "値", "単位"], ["動画ファイル", videoName, ""], ["日付", form.date, ""], ["走順", form.leg, ""], ["渡し手", form.giver, ""], ["受け手", form.receiver, ""], ["回数", form.attempt, ""],
      ["FPS", form.fps, "fps"], ["動き出しコマ（受け手つま先離地）", form.startFrame, "frame"], ["渡し手マーク通過コマ", form.markFrame, "frame"], ["挙手コマ（受ける姿勢で静止した初めのコマ）", form.handFrame, "frame"], ["パス完了コマ", form.passFrame, "frame"],
      ["動き出し〜挙手", fmt(result.handTime), "s"], ["動き出し〜パス完了", fmt(result.passTime), "s"], ["挙手時距離", fmt(result.handDistance), "m"], ["パス完了時距離", fmt(result.passDistance), "m"], ["挙手〜パス完了時間", fmt(result.handToPassTime), "s"], ["挙手〜パス完了距離", fmt(result.handToPassDistance), "m"], ["出のタイミング", fmt(result.startTiming), "s"], ["バトン30m通過タイム", fmt(result.baton30Time), "s"], ["バトン40m通過タイム", fmt(result.baton40Time), "s"],
      [], ["選択コマ"], ["ラベル", "コマ"], ...SELECTION_TASKS.map((task) => [task.label, getTaskValue(task)]), [], ["渡し手速度"], ["区間", "時間", "速度"], ...result.giverRows.map((row) => [row.label, fmt(row.time), fmt(row.speed)]), [], ["受け手速度"], ["区間", "時間", "速度"], ...result.receiverRows.map((row) => [row.label, fmt(row.time), fmt(row.speed)]),
    ];
    const blob = new Blob(["\ufeff" + rowsToCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "baton_analysis_result.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-md px-4 pb-28 pt-5">
        <header className="mb-5"><div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm"><Activity className="h-3.5 w-3.5" />Relay Baton Analyzer</div><h1 className="mt-3 text-2xl font-bold tracking-tight">バトンパス分析</h1><p className="mt-1 text-sm leading-6 text-slate-500">動画をアップロードし、指示に従ってコマ送りで必要なコマを登録します。登録後、渡し手・受け手の速度とパス位置を自動計算します。</p></header>
        <section className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100"><div className="mb-3 flex items-center gap-2"><Upload className="h-4 w-4 text-slate-500" /><h2 className="text-sm font-bold text-slate-700">動画アップロード</h2></div><label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center active:scale-[0.99]"><Upload className="h-6 w-6 text-slate-400" /><span className="mt-2 text-sm font-bold text-slate-700">動画を選択</span><span className="mt-1 text-xs text-slate-400">mp4 / mov など</span><input className="hidden" type="file" accept="video/*" onChange={handleVideoUpload} /></label>{videoName ? <p className="mt-2 truncate text-xs text-slate-500">読み込み中: {videoName}</p> : null}<p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">{fpsStatus}</p></section>
        {videoUrl ? <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100"><video ref={videoRef} src={videoUrl} playsInline className="w-full rounded-2xl bg-black" onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); setCurrentTime(e.currentTarget.currentTime || 0); estimateFps(); }} onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} onSeeked={(e) => setCurrentTime(e.currentTarget.currentTime)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} /><div className="mt-3 grid grid-cols-3 gap-3"><Field label="FPS" value={form.fps} onChange={(v) => setField("fps", v)} unit="fps" inputMode="decimal" /><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">現在時刻</p><p className="mt-1 text-base font-bold">{fmt(currentTime)} s</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">現在コマ</p><p className="mt-1 text-base font-bold">{Number.isFinite(currentFrame) ? currentFrame : "--"}</p></div></div><input type="range" min="0" max={Number.isFinite(duration) ? duration : 0} step={Number.isFinite(fpsNum) && fpsNum > 0 ? 1 / fpsNum : 0.001} value={currentTime} onChange={(e) => { const t = Number(e.target.value); if (videoRef.current) videoRef.current.currentTime = t; setCurrentTime(t); }} className="mt-4 w-full" /><div className="mt-3 grid grid-cols-5 gap-2"><button onClick={() => stepFrames(-10)} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="10コマ戻る"><ChevronsLeft className="mx-auto h-4 w-4" /></button><button onClick={() => stepFrames(-1)} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="1コマ戻る"><StepBack className="mx-auto h-4 w-4" /></button><button onClick={togglePlay} className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm" aria-label="再生停止">{isPlaying ? <Pause className="mx-auto h-4 w-4" /> : <Play className="mx-auto h-4 w-4" />}</button><button onClick={() => stepFrames(1)} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="1コマ進む"><StepForward className="mx-auto h-4 w-4" /></button><button onClick={() => stepFrames(10)} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="10コマ進む"><ChevronsRight className="mx-auto h-4 w-4" /></button></div><button onClick={estimateFps} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"><ScanLine className="h-4 w-4" />FPS再推定</button></section> : null}
        <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-700">コマ選択ウィザード</h2><p className="mt-1 text-xs text-slate-500">{taskIndex + 1} / {SELECTION_TASKS.length}</p></div><div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">現在値: {getTaskValue(activeTask) || "未選択"}</div></div><div className="rounded-3xl bg-slate-900 p-4 text-white"><p className="text-xs text-slate-300">次に選択するコマ</p><h3 className="mt-1 text-xl font-bold">{activeTask.label}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{activeTask.help}</p></div><div className="mt-3 grid grid-cols-3 gap-2"><button onClick={() => setTaskIndex(Math.max(0, taskIndex - 1))} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">前へ</button><button onClick={saveCurrentFrameToTask} className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-3 text-sm font-bold text-white shadow-sm"><CheckCircle2 className="h-4 w-4" />登録</button><button onClick={() => setTaskIndex(Math.min(SELECTION_TASKS.length - 1, taskIndex + 1))} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">次へ</button></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-slate-900" style={{ width: `${((taskIndex + 1) / SELECTION_TASKS.length) * 100}%` }} /></div></section>
        <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100"><div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-slate-500" /><h2 className="text-sm font-bold text-slate-700">分析情報</h2></div><div className="grid grid-cols-2 gap-3"><Field label="日付" type="date" value={form.date} onChange={(v) => setField("date", v)} /><Field label="走順" value={form.leg} onChange={(v) => setField("leg", v)} /><Field label="渡し手" value={form.giver} onChange={(v) => setField("giver", v)} /><Field label="受け手" value={form.receiver} onChange={(v) => setField("receiver", v)} /><Field label="回数" value={form.attempt} onChange={(v) => setField("attempt", v)} /><Field label="歩数" value={form.steps} onChange={(v) => setField("steps", v)} inputMode="decimal" /><Field label="タイミング" value={form.timingMemo} onChange={(v) => setField("timingMemo", v)} inputMode="decimal" /><Field label="遅い/速い" value={form.earlyLate} onChange={(v) => setField("earlyLate", v)} /></div></section>
        <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100"><h2 className="mb-3 text-sm font-bold text-slate-700">選択済みコマ一覧</h2><div className="grid grid-cols-2 gap-3"><Field label="渡し手マーク通過" value={form.markFrame} onChange={(v) => setField("markFrame", v)} unit="frame" inputMode="decimal" /><Field label="動き出し（受け手つま先離地）" value={form.startFrame} onChange={(v) => setField("startFrame", v)} unit="frame" inputMode="decimal" /><Field label="挙手（受ける姿勢で静止）" value={form.handFrame} onChange={(v) => setField("handFrame", v)} unit="frame" inputMode="decimal" /><Field label="パス完了" value={form.passFrame} onChange={(v) => setField("passFrame", v)} unit="frame" inputMode="decimal" />{FRAME_FIELDS.map((field) => <Field key={field.key} label={field.label.replace(" 通過コマ", "")} value={form.frames[field.key]} onChange={(v) => setFrame(field.key, v)} unit="frame" inputMode="decimal" />)}</div></section>
        {result.warnings.length > 0 ? <section className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4"><div className="flex gap-2 text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4 flex-none" /><div><h2 className="text-sm font-bold">確認してください</h2><ul className="mt-1 list-disc pl-4 text-xs leading-5">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div></div></section> : null}
        <section className="mt-4"><h2 className="mb-3 px-1 text-sm font-bold text-slate-700">主要結果</h2><div className="grid grid-cols-2 gap-3"><StatCard icon={Timer} label="挙手まで" value={fmt(result.handTime)} unit="s" /><StatCard icon={Timer} label="パス完了まで" value={fmt(result.passTime)} unit="s" /><StatCard icon={MapPin} label="挙手時距離" value={fmt(result.handDistance)} unit="m" /><StatCard icon={MapPin} label="パス完了時距離" value={fmt(result.passDistance)} unit="m" /></div><div className="mt-3 rounded-3xl bg-slate-900 p-4 text-white shadow-sm"><div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-slate-300">挙手〜パス完了時間</p><p className="mt-1 text-xl font-bold">{fmt(result.handToPassTime)} <span className="text-sm font-medium text-slate-300">s</span></p></div><div><p className="text-xs text-slate-300">挙手〜パス完了距離</p><p className="mt-1 text-xl font-bold">{fmt(result.handToPassDistance)} <span className="text-sm font-medium text-slate-300">m</span></p></div></div></div></section>
        <section className="mt-4 grid grid-cols-2 gap-3"><StatCard icon={Users} label="出のタイミング" value={fmt(result.startTiming)} unit="s" /><StatCard icon={Gauge} label="バトン30m通過" value={fmt(result.baton30Time)} unit="s" /><StatCard icon={Gauge} label="バトン40m通過" value={fmt(result.baton40Time)} unit="s" /><StatCard icon={MapPin} label="完了位置" value={fmt(result.passDistance)} unit="m" /></section>
        <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100"><h2 className="mb-2 text-sm font-bold text-slate-700">バトン通過タイムの定義</h2><p className="text-xs leading-5 text-slate-500">バトン30m通過タイムは「受け手30m通過コマ − 渡し手0m通過コマ」をFPSで除して算出します。バトン40m通過タイムも同様に「受け手40m通過コマ − 渡し手0m通過コマ」をFPSで除して算出します。</p></section>
        <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100"><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-700">渡し手・受け手の速度比較</h2><span className="text-xs text-slate-400">3次回帰</span></div><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.speedChartData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="distance" type="number" domain={[-5, 40]} tick={{ fontSize: 11 }} unit="m" /><YAxis tick={{ fontSize: 11 }} domain={[0, "auto"]} /><Tooltip formatter={(value, name) => [`${fmt(Number(value))} m/s`, name === "receiverVelocity" ? "受け手" : "渡し手"]} labelFormatter={(label) => `${label} m地点`} /><Legend verticalAlign="bottom" height={28} formatter={(value) => (value === "receiverVelocity" ? "受け手" : "渡し手")} />{Number.isFinite(result.handDistance) ? <ReferenceLine x={Number(result.handDistance.toFixed(1))} strokeDasharray="3 3" label={{ value: "挙手", fontSize: 11 }} /> : null}{Number.isFinite(result.passDistance) ? <ReferenceLine x={Number(result.passDistance.toFixed(1))} strokeDasharray="3 3" label={{ value: "完了", fontSize: 11 }} /> : null}<Line type="monotone" dataKey="giverVelocity" strokeWidth={3} dot={false} connectNulls name="giverVelocity" /><Line type="monotone" dataKey="receiverVelocity" strokeWidth={3} dot={false} connectNulls name="receiverVelocity" /></LineChart></ResponsiveContainer></div></section>
        <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-100"><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-700">受け手の距離−時間</h2><span className="text-xs text-slate-400">T(x)=∫dx/v(x)</span></div><div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.distanceTimeChartData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" type="number" domain={[0, "auto"]} tick={{ fontSize: 11 }} unit="s" /><YAxis dataKey="distance" tick={{ fontSize: 11 }} unit="m" domain={[0, 40]} /><Tooltip formatter={(value, name) => [`${value} ${name === "distance" ? "m" : "s"}`, name === "distance" ? "距離" : "時間"]} labelFormatter={(label) => `${label} s`} />{Number.isFinite(result.handTime) ? <ReferenceLine x={Number(result.handTime.toFixed(3))} strokeDasharray="3 3" label={{ value: "挙手", fontSize: 11 }} /> : null}{Number.isFinite(result.passTime) ? <ReferenceLine x={Number(result.passTime.toFixed(3))} strokeDasharray="3 3" label={{ value: "完了", fontSize: 11 }} /> : null}<Line type="monotone" dataKey="distance" strokeWidth={3} dot={false} name="distance" /></LineChart></ResponsiveContainer></div></section>
        <section className="mt-4 space-y-4"><SpeedTable title="渡し手の区間速度" rows={result.giverRows} /><SpeedTable title="受け手の区間速度" rows={result.receiverRows} /></section>
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur"><div className="mx-auto grid max-w-md grid-cols-2 gap-3"><button onClick={reset} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm active:scale-[0.99]"><RotateCcw className="h-4 w-4" />リセット</button><button onClick={exportCsv} className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm active:scale-[0.99]"><Download className="h-4 w-4" />CSV出力</button></div></div>
    </div>
  );
}
