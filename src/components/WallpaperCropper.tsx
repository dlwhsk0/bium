import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react'

interface Props {
  /** 고른 사진(object URL) */
  src: string
  onDone: (dataUrl: string) => void
  onCancel: () => void
}

const MAX_ZOOM = 4
/** 저장할 배경화면 폭(px). 높이는 화면 비율에 맞춘다. */
const OUTPUT_WIDTH = 900

/**
 * 배경화면 자르기: 폰 화면 비율의 틀 안에서 사진을 끌어 옮기고(한 손가락/마우스),
 * 두 손가락·슬라이더·휠로 크기를 조절한다. 사진은 언제나 틀을 꽉 채운다.
 */
export function WallpaperCropper({ src, onDone, onCancel }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const frameRef = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState({ w: 0, h: 0 })
  // 화면 비율 그대로(세로로 긴 폰이면 그만큼 긴 틀)
  const [aspect] = useState(() => window.innerWidth / window.innerHeight)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchFrom = useRef<{ dist: number; zoom: number } | null>(null)

  useEffect(() => {
    const el = new Image()
    el.onload = () => setImg(el)
    el.src = src
  }, [src])

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const measure = () => setFrame({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 틀을 꽉 채우는 최소 배율 × 사용자가 키운 만큼
  const base = img && frame.w ? Math.max(frame.w / img.naturalWidth, frame.h / img.naturalHeight) : 1
  const scale = base * zoom
  const drawnW = (img?.naturalWidth ?? 0) * scale
  const drawnH = (img?.naturalHeight ?? 0) * scale

  // 사진 가장자리가 틀 안으로 들어오지 않게(빈 곳이 생기지 않게) 옮길 수 있는 범위를 막는다
  const clamp = (o: { x: number; y: number }, w = drawnW, h = drawnH) => ({
    x: Math.max(-(w - frame.w) / 2, Math.min((w - frame.w) / 2, o.x)),
    y: Math.max(-(h - frame.h) / 2, Math.min((h - frame.h) / 2, o.y)),
  })

  function setZoomClamped(z: number) {
    const next = Math.max(1, Math.min(MAX_ZOOM, z))
    setZoom(next)
    if (img) setOffset((o) => clamp(o, img.naturalWidth * base * next, img.naturalHeight * base * next))
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchFrom.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom }
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && pinchFrom.current) {
      const [a, b] = [...pointers.current.values()]
      setZoomClamped((pinchFrom.current.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / pinchFrom.current.dist)
    } else if (pointers.current.size === 1) {
      setOffset((o) => clamp({ x: o.x + e.clientX - prev.x, y: o.y + e.clientY - prev.y }))
    }
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchFrom.current = null
  }

  function onWheel(e: WheelEvent<HTMLDivElement>) {
    setZoomClamped(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))
  }

  function done() {
    if (!img) return
    // 틀에 보이는 부분을 사진 원본 좌표로 바꿔 잘라낸다
    const sx = (drawnW / 2 - offset.x - frame.w / 2) / scale
    const sy = (drawnH / 2 - offset.y - frame.h / 2) / scale
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_WIDTH
    canvas.height = Math.round(OUTPUT_WIDTH / aspect)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, sx, sy, frame.w / scale, frame.h / scale, 0, 0, canvas.width, canvas.height)
    onDone(canvas.toDataURL('image/jpeg', 0.82))
  }

  return (
    <div className="cropper">
      <p className="cropper-hint">끌어서 옮기고, 두 손가락이나 아래 막대로 크기를 조절해요</p>
      <div
        ref={frameRef}
        className="cropper-frame"
        style={{ aspectRatio: String(aspect) }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {img && (
          <img
            src={src}
            alt=""
            draggable={false}
            style={{
              width: drawnW,
              height: drawnH,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
          />
        )}
      </div>
      <input
        className="cropper-zoom"
        type="range"
        min={1}
        max={MAX_ZOOM}
        step={0.01}
        value={zoom}
        onChange={(e) => setZoomClamped(Number(e.target.value))}
        aria-label="사진 크기"
      />
      <div className="cropper-actions">
        <button className="text-button" onClick={onCancel}>
          취소
        </button>
        <button className="cta" onClick={done} disabled={!img}>
          배경화면으로 설정
        </button>
      </div>
    </div>
  )
}
