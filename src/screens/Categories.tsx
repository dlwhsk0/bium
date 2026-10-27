import { useState } from 'react'
import {
  MAX_CATEGORIES,
  MAX_LABEL,
  MIN_CATEGORIES,
  addCategory,
  labelOf,
  hideCategory,
  updateCategory,
  visibleCategories,
  type Category,
} from '../lib/categories'
import { coverOf, getPack, type PackKey, PACKS, previewIcons } from '../lib/packs'
import { Emoji } from '../components/Emoji'
import { useTwoStep } from '../lib/useTwoStep'
import { Sheet } from '../components/Sheet'

interface Props {
  categories: Category[]
  /** 바꿀 때마다 바로 저장된다 */
  onChange: (list: Category[]) => void
  onDone: () => void
  /** 카드를 꾹 눌러 들어왔으면 그 카테고리의 아이템팩 고르기를 펼친 채로 연다 */
  focusId?: string
}

function DeleteButton({ disabled, onDelete }: { disabled: boolean; onDelete: () => void }) {
  const button = useTwoStep(onDelete)
  return (
    <button
      className={button.confirming ? 'delete-button confirming' : 'delete-button'}
      onClick={button.press}
      disabled={disabled}
    >
      {button.confirming ? '한 번 더' : '삭제'}
    </button>
  )
}

export function Categories({ categories, onChange, onDone, focusId }: Props) {
  const visible = visibleCategories(categories)
  // 아이템팩 고르는 칸이 펼쳐진 카테고리
  const [picking, setPicking] = useState<string | null>(focusId ?? null)
  const pickingCategory = visible.find((c) => c.id === picking)

  function choosePack(c: Category, pack: PackKey) {
    // 이름을 따로 안 바꿨으면(팩 이름 그대로면) 이름도 새 팩 이름으로
    const label = c.label === getPack(c.pack).name ? getPack(pack).name : c.label
    onChange(updateCategory(categories, c.id, { pack, label }))
    setPicking(null)
  }

  function add() {
    // 아직 안 쓰는 팩 중 첫 번째로 만들고 바로 팩 고르기를 연다
    const used = new Set(visible.map((c) => c.pack))
    const pack = PACKS.find((p) => !used.has(p.key))?.key ?? 'goods'
    const next = addCategory(categories, pack)
    onChange(next)
    setPicking(next[next.length - 1].id)
  }

  return (
    <main className="screen categories">
      <div className="scroll-area">
        <header className="summary">
          <h1 className="title">카테고리 편집</h1>
          <p className="body">
            버릴 물건을 나눌 칸이에요.
            <br />
            {MIN_CATEGORIES}개부터 {MAX_CATEGORIES}개까지 둘 수 있어요.
          </p>
        </header>

        <ul className="card edit-list">
          {visible.map((c) => (
            <li key={c.id} className="edit-item">
              <div className="edit-row">
                <button
                  className={picking === c.id ? 'pack-thumb open' : 'pack-thumb'}
                  onClick={() => setPicking(picking === c.id ? null : c.id)}
                  aria-label={`아이템팩 바꾸기, 지금 ${getPack(c.pack).name}`}
                  aria-haspopup="dialog"
                >
                  <Emoji name={coverOf(c.pack)} className="thumb-icon" />
                </button>
                <input
                  className="label-input"
                  value={c.label}
                  maxLength={MAX_LABEL}
                  placeholder={getPack(c.pack).name}
                  aria-label="카테고리 이름"
                  onChange={(e) => onChange(updateCategory(categories, c.id, { label: e.target.value }))}
                  onBlur={(e) => {
                    if (!e.target.value.trim()) onChange(updateCategory(categories, c.id, { label: getPack(c.pack).name }))
                  }}
                />
                <DeleteButton disabled={visible.length <= MIN_CATEGORIES} onDelete={() => onChange(hideCategory(categories, c.id))} />
              </div>

              </li>
          ))}
        </ul>

        <button className="text-button" onClick={add} disabled={visible.length >= MAX_CATEGORIES}>
          {visible.length >= MAX_CATEGORIES ? `카테고리는 ${MAX_CATEGORIES}개까지예요` : '카테고리 추가'}
        </button>
      </div>

      {pickingCategory && (
        <Sheet title={`${labelOf(pickingCategory)} 아이템팩`} onClose={() => setPicking(null)}>
          <div className="pack-grid" role="radiogroup" aria-label="아이템팩">
            {PACKS.map((p) => (
              <button
                key={p.key}
                role="radio"
                aria-checked={p.key === pickingCategory.pack}
                className={p.key === pickingCategory.pack ? 'pack-option selected' : 'pack-option'}
                onClick={() => choosePack(pickingCategory, p.key)}
              >
                <span className="pack-icons">
                  {previewIcons(p.key).map((slug) => (
                    <Emoji key={slug} name={slug} className="preview-icon" />
                  ))}
                </span>
                <span className="pack-name">{p.name}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      <footer className="actions">
        <button className="cta" onClick={onDone}>
          완료
        </button>
      </footer>
    </main>
  )
}
