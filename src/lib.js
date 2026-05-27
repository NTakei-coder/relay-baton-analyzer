export function parseNum(value) {
  const text = String(value ?? "").trim();
  if (text === "") return NaN;
  const parsed = Number(text.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function median(values) {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function fmt(value, digits = 3) {
  return Number.isFinite(value) ? value.toFixed(digits) : "--";
}

export function elapsedTimeBetweenFrames(startFrame, endFrame, fps) {
  const start = parseNum(startFrame);
  const end = parseNum(endFrame);
  return Number.isFinite(fps) && fps > 0 && Number.isFinite(start) && Number.isFinite(end) ? (end - start) / fps : NaN;
}

export function frameSpeeds(points, frameMap, fps) {
  const rows = [];
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    const f1 = parseNum(frameMap[previous.key]);
    const f2 = parseNum(frameMap[current.key]);
    const distance = current.distance - previous.distance;
    const time = elapsedTimeBetweenFrames(f1, f2, fps);
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

export function solveLinearSystem(matrix, vector) {
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

export function polyFitCubic(xs, ys) {
  const order = 4;
  const matrix = Array.from({ length: order }, () => Array(order).fill(0));
  const vector = Array(order).fill(0);
  for (let i = 0; i < xs.length; i += 1) {
    const basis = [1, xs[i], xs[i] ** 2, xs[i] ** 3];
    for (let row = 0; row < order; row += 1) {
      vector[row] += basis[row] * ys[i];
      for (let col = 0; col < order; col += 1) matrix[row][col] += basis[row] * basis[col];
    }
  }
  return solveLinearSystem(matrix, vector);
}

export function evalPoly(coeffs, x) {
  if (!coeffs) return NaN;
  return coeffs[0] + coeffs[1] * x + coeffs[2] * x ** 2 + coeffs[3] * x ** 3;
}

export function buildDistanceTimeTable(coeffs, maxDistance = 40, step = 0.05) {
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

export function distanceAtTime(table, targetTime) {
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

export function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function rowsToCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}
