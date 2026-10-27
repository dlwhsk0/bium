/**
 * 고른 사진을 정사각형으로 가운데 잘라 작게 줄인 JPEG data URL로 만든다.
 * localStorage에 넣어도 부담 없는 크기(대략 10KB 안팎)가 되게.
 */
export async function toAvatar(file: File, size = 160): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('사진을 처리할 수 없어요.')
  // JPEG는 투명을 못 담아 검게 나오므로 흰 바탕을 먼저 깐다(투명 PNG 대비)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}

/**
 * 배경화면용: 긴 변을 maxSide로 줄인 JPEG data URL(비율 유지, 자르지 않음).
 * 폰 화면을 채우기에 충분하면서 localStorage에 넣을 만한 크기(대략 100~200KB).
 */
export async function toWallpaper(file: File, maxSide = 1200): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('사진을 처리할 수 없어요.')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.8)
}
