import { useEffect, useState } from 'react'
import { makeBackup, mergeBackup, parseBackup, saveBackupFile } from './lib/backup'
import { finish, startBium, toss, undo, type Bium } from './lib/bium'
import type { Category } from './lib/categories'
import {
  loadActive,
  loadCategories,
  loadHistory,
  loadOnboarded,
  saveActive,
  saveCategories,
  saveHistory,
  saveOnboarded,
} from './lib/storage'
import { Active } from './screens/Active'
import { Categories } from './screens/Categories'
import { Home } from './screens/Home'
import { Mind } from './screens/Mind'
import { Onboarding } from './screens/Onboarding'
import { Result } from './screens/Result'
import { Vent } from './screens/Vent'

type View = { kind: 'home' } | { kind: 'result'; id: string }

export default function App() {
  const [active, setActive] = useState<Bium | null>(loadActive)
  const [history, setHistory] = useState<Bium[]>(loadHistory)
  const [categories, setCategories] = useState<Category[]>(loadCategories)
  const [view, setView] = useState<View>({ kind: 'home' })
  // 카테고리 편집 화면. 홈 버튼이나 카드 꾹 누르기로 열고, 완료하면 원래 화면으로 돌아간다.
  // focusId: 꾹 누른 카드의 카테고리
  const [editing, setEditing] = useState<{ focusId?: string } | null>(null)
  // 마음 비우기 화면. 홈과 비우는 중 어디서든 열고 돌아가면 원래 화면.
  const [mind, setMind] = useState(false)
  // 하소연하기(톡방). 마음 비우기처럼 어디서든 열고 돌아가면 원래 화면.
  const [vent, setVent] = useState(false)
  // 처음 연 사람에게만 소개를 보여준다. 이미 기록이 있으면 본 것으로 친다.
  const [onboarded, setOnboarded] = useState(() => loadOnboarded() || active !== null || history.length > 0)
  // 백업 저장·불러오기 결과를 홈에 한 줄로 알려준다
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => saveActive(active), [active])
  useEffect(() => saveHistory(history), [history])
  useEffect(() => saveCategories(categories), [categories])
  useEffect(() => {
    if (onboarded) saveOnboarded()
  }, [onboarded])

  if (!onboarded) {
    return (
      <Onboarding
        onSkip={() => setOnboarded(true)}
        onStart={() => {
          setOnboarded(true)
          setActive(startBium())
        }}
      />
    )
  }

  if (mind) return <Mind onBack={() => setMind(false)} />
  if (vent) return <Vent onBack={() => setVent(false)} />

  if (editing) {
    return (
      <Categories
        categories={categories}
        onChange={setCategories}
        onDone={() => setEditing(null)}
        focusId={editing.focusId}
      />
    )
  }

  if (active) {
    return (
      <Active
        bium={active}
        categories={categories}
        onEditCategory={(id) => setEditing({ focusId: id })}
        onMind={() => setMind(true)}
        onVent={() => setVent(true)}
        onToss={(c) => setActive((b) => b && toss(b, c))}
        onUndo={() => setActive((b) => b && undo(b))}
        onFinish={() => {
          const done = finish(active)
          setHistory((h) => [done, ...h])
          setActive(null)
          setView({ kind: 'result', id: done.id })
        }}
      />
    )
  }

  const opened = view.kind === 'result' ? history.find((b) => b.id === view.id) : undefined
  if (opened) {
    return (
      <Result
        bium={opened}
        categories={categories}
        onClose={() => setView({ kind: 'home' })}
        onDelete={() => {
          setHistory((h) => h.filter((b) => b.id !== opened.id))
          setView({ kind: 'home' })
        }}
      />
    )
  }

  return (
    <Home
      history={history}
      onStart={() => setActive(startBium())}
      onOpen={(id) => setView({ kind: 'result', id })}
      notice={notice}
      onIntro={() => setOnboarded(false)}
      onEditCategories={() => setEditing({})}
      onMind={() => setMind(true)}
      onVent={() => setVent(true)}
      onExport={async () => {
        const result = await saveBackupFile(makeBackup({ categories, active, history }))
        if (result === 'shared') setNotice('백업 파일을 보냈어요. 잃어버리지 않을 곳에 두세요.')
        if (result === 'downloaded') setNotice('백업 파일을 저장했어요. 다운로드 폴더에 있어요.')
      }}
      onImport={async (file) => {
        try {
          const merged = mergeBackup({ categories, active, history }, parseBackup(await file.text()))
          setCategories(merged.categories)
          setActive(merged.active)
          setHistory(merged.history)
          setNotice(merged.addedCount > 0 ? `기록 ${merged.addedCount}개를 불러왔어요.` : '이미 다 있는 기록이라 새로 불러온 건 없어요.')
        } catch (e) {
          setNotice((e as Error).message)
        }
      }}
    />
  )
}
