import { cn } from "@/lib/utils"

export type KolamStage = {
  key: string
  label: string
  detail?: string
}

type StageState = "done" | "live" | "pending"

type KolamRouteProps = {
  stages: readonly KolamStage[]
  current: number
  complete?: boolean
  tone?: "threshold" | "sheet"
  orientation?: "horizontal" | "vertical" | "responsive"
  animate?: boolean
  size?: "default" | "compact" | "hero"
  label?: string
  showLabels?: boolean
  className?: string
}

const STEP = 100

type Scale = { gap: number; rings: number[] }
const SCALES: Record<"default" | "hero", Scale> = {
  default: { gap: 22, rings: [-2.6, -1, 1, 2.6] },
  hero: { gap: 40, rings: [-3.4, -2.15, -1, 1, 2.15, 3.4] },
}

function halfOf(scale: Scale) {
  return scale.gap * (Math.max(...scale.rings) + 0.6)
}

// Cross-axis to step ratio of the drawing; the vertical layout sizes its column from it so nodes land on label rows.
function crossRatio(scale: Scale) {
  return (halfOf(scale) * 2) / STEP
}

function stageState(index: number, current: number, complete: boolean): StageState {
  if (index < current || (complete && index === current)) return "done"
  if (index === current) return "live"
  return "pending"
}

const stateText: Record<StageState, string> = {
  done: "done",
  live: "in progress",
  pending: "not yet",
}

function geometry(count: number, scale: Scale) {
  const GAP = scale.gap
  const nodes = Array.from({ length: count }, (_, i) => ({ x: i * STEP, y: 0 }))
  // Each segment wraps ~270° around its lattice dot and crosses itself beneath it, the knot a kolam line makes.
  const arches = nodes.slice(0, -1).map((node, i) => {
    const next = nodes[i + 1]
    const dir = i % 2 === 0 ? -1 : 1
    const mid = node.x + STEP / 2
    const cy = dir * GAP
    const r = GAP * 0.95
    const o = r * Math.SQRT1_2
    const entry = { x: mid - o, y: cy - dir * o }
    const exit = { x: mid + o, y: cy - dir * o }
    const sweep = dir === -1 ? 1 : 0
    const d =
      `C ${node.x + STEP * 0.3} 0 ${entry.x + r * 0.6} ${entry.y - dir * r * 0.6} ${entry.x} ${entry.y} ` +
      `A ${r} ${r} 0 1 ${sweep} ${exit.x} ${exit.y} ` +
      `C ${exit.x - r * 0.6} ${exit.y - dir * r * 0.6} ${next.x - STEP * 0.3} 0 ${next.x} 0`
    return { d, dot: { x: mid, y: cy } }
  })
  const lattice: { x: number; y: number }[] = []
  for (let x = -STEP / 2; x <= (count - 1) * STEP + STEP / 2; x += STEP / 2) {
    for (const ring of scale.rings) lattice.push({ x, y: ring * GAP })
  }
  return { nodes, arches, lattice }
}

function pathFor(arches: { d: string }[], from: number, to: number) {
  if (to <= from) return ""
  return `M ${from * STEP} 0 ` + arches.slice(from, to).map((a) => a.d).join(" ")
}

function KolamSvg({
  count,
  current,
  complete,
  vertical,
  animate,
  scale,
}: {
  count: number
  current: number
  complete: boolean
  vertical: boolean
  animate: boolean
  scale: Scale
}) {
  const { nodes, arches, lattice } = geometry(count, scale)
  const HALF = halfOf(scale)
  const reached = Math.max(0, Math.min(current, count - 1))
  const width = (count - 1) * STEP
  const pad = STEP / 2
  const viewBox = vertical
    ? `${-HALF} ${-pad} ${HALF * 2} ${width + pad * 2}`
    : `${-pad} ${-HALF} ${width + pad * 2} ${HALF * 2}`
  const transform = vertical ? "rotate(90) scale(1 -1)" : undefined

  return (
    <svg
      viewBox={viewBox}
      className="block h-full w-full overflow-visible"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={transform}>
        <g className={cn("fill-current", scale === SCALES.hero ? "opacity-45" : "opacity-25")}>
          {lattice.map((dot) => (
            <circle key={`${dot.x}:${dot.y}`} cx={dot.x} cy={dot.y} r={scale === SCALES.hero ? 2.6 : 1.6} />
          ))}
        </g>
        <g className="fill-current opacity-60">
          {arches.map((arch) => (
            <circle key={arch.dot.x} cx={arch.dot.x} cy={arch.dot.y} r={2.4} />
          ))}
        </g>
        <path
          d={pathFor(arches, 0, count - 1)}
          fill="none"
          className="stroke-current opacity-20"
          strokeWidth={2}
          strokeDasharray="1.5 5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {reached > 0 ? (
          <path
            d={pathFor(arches, 0, reached)}
            fill="none"
            pathLength={1}
            className={cn(
              "stroke-current",
              animate && "[animation:kolam-draw_1.8s_var(--ease-out-expo)_0.25s_both]",
            )}
            style={animate ? { strokeDasharray: 1, ["--kolam-length" as string]: 1 } : undefined}
            strokeWidth={scale === SCALES.hero ? 5 : animate ? 4 : 3}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect={animate ? undefined : "non-scaling-stroke"}
          />
        ) : null}
        {nodes.map((node, index) => {
          const state = stageState(index, current, complete)
          const delay = animate ? `${0.25 + (index / Math.max(1, count - 1)) * 1.6}s` : undefined
          return (
            <g
              key={node.x}
              style={animate ? { animation: `kolam-dot-in 0.5s var(--ease-out-expo) ${delay} both`, transformOrigin: "center", transformBox: "fill-box" } : undefined}
            >
              {state === "done" ? (
                <circle cx={node.x} cy={0} r={7.5} className="fill-current" />
              ) : null}
              {state === "live" ? (
                <>
                  <circle cx={node.x} cy={0} r={12} className="fill-none stroke-warning" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
                  <circle cx={node.x} cy={0} r={5.5} className="fill-warning" />
                </>
              ) : null}
              {state === "pending" ? (
                <circle cx={node.x} cy={0} r={6} className="fill-none stroke-current opacity-60" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              ) : null}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export function KolamRoute({
  stages,
  current,
  complete = false,
  tone = "sheet",
  orientation = "responsive",
  animate = false,
  size = "default",
  label = "Rescue progress",
  showLabels = true,
  className,
}: KolamRouteProps) {
  const count = stages.length
  const hero = size === "hero"
  const scale = hero ? SCALES.hero : SCALES.default
  const ratio = crossRatio(scale)
  const horizontal = !hero && (orientation === "horizontal" || orientation === "responsive")
  const vertical = hero || orientation === "vertical" || orientation === "responsive"
  const row = size === "compact" ? "3.25rem" : "6rem"
  const shared = { stages, current, complete, animate, tone }

  return (
    <figure
      className={cn(
        tone === "threshold" ? "text-threshold-foreground" : "text-foreground",
        className,
      )}
    >
      <figcaption className="sr-only">{label}</figcaption>

      {horizontal ? (
        <div
          className={cn("mx-auto w-full", orientation === "responsive" && "hidden sm:block")}
          style={{ maxWidth: `${count * (size === "compact" ? 7 : 11)}rem` }}
        >
          <div style={{ aspectRatio: `${count} / ${ratio}` }}>
            <KolamSvg count={count} current={current} complete={complete} vertical={false} animate={animate} scale={scale} />
          </div>
          <ol className={cn("grid pt-2", !showLabels && "sr-only")} style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
            {stages.map((stage, index) => (
              <StageLabel key={stage.key} stage={stage} state={stageState(index, current, complete)} tone={tone} align="center" size={size} />
            ))}
          </ol>
        </div>
      ) : null}

      {vertical && hero ? (
        <>
          <VerticalKolam {...shared} scale={SCALES.default} row="6rem" labelSize="default" className="sm:hidden" />
          <VerticalKolam {...shared} scale={SCALES.hero} row="clamp(5rem, 11vh, 7rem)" labelSize="hero" className="hidden sm:grid" />
        </>
      ) : vertical ? (
        <VerticalKolam
          {...shared}
          scale={scale}
          row={row}
          labelSize={size}
          className={cn(orientation === "responsive" && "sm:hidden")}
        />
      ) : null}
    </figure>
  )
}

function StageLabel({
  stage,
  state,
  tone,
  align,
  size,
}: {
  stage: KolamStage
  state: StageState
  tone: "threshold" | "sheet"
  align: "center" | "start"
  size: "default" | "compact" | "hero"
}) {
  const quiet = tone === "threshold" ? "text-threshold-muted" : "text-muted-foreground"

  return (
    <li
      className={cn(
        "flex min-w-0 flex-col justify-center gap-0.5",
        align === "center" ? "items-center text-center" : "items-start text-left",
      )}
    >
      <span
        className={cn(
          "font-semibold leading-tight",
          size === "compact" ? "text-sm" : size === "hero" ? "text-lg sm:text-xl" : "text-base",
          state === "pending" && quiet,
        )}
      >
        {stage.label}
        <span className="sr-only">, {stateText[state]}</span>
      </span>
      {stage.detail && size !== "compact" ? (
        <span className={cn("leading-snug", size === "hero" ? "text-sm sm:text-base" : "text-sm", quiet)}>{stage.detail}</span>
      ) : null}
    </li>
  )
}

function VerticalKolam({
  stages,
  current,
  complete,
  animate,
  tone,
  scale,
  row,
  labelSize,
  className,
}: {
  stages: readonly KolamStage[]
  current: number
  complete: boolean
  animate: boolean
  tone: "threshold" | "sheet"
  scale: Scale
  row: string
  labelSize: "default" | "compact" | "hero"
  className?: string
}) {
  const count = stages.length
  return (
    <div
      className={cn("grid gap-x-4 sm:gap-x-6", className)}
      style={{
        ["--kolam-row" as string]: row,
        gridTemplateColumns: `calc(var(--kolam-row) * ${crossRatio(scale).toFixed(4)}) minmax(0, 1fr)`,
      }}
    >
      <div style={{ height: `calc(var(--kolam-row) * ${count})` }}>
        <KolamSvg count={count} current={current} complete={complete} vertical animate={animate} scale={scale} />
      </div>
      <ol className="grid" style={{ gridTemplateRows: `repeat(${count}, var(--kolam-row))` }}>
        {stages.map((stage, index) => (
          <StageLabel key={stage.key} stage={stage} state={stageState(index, current, complete)} tone={tone} align="start" size={labelSize} />
        ))}
      </ol>
    </div>
  )
}
