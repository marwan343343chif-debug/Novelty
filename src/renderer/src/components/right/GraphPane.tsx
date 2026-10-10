import { useEffect, useMemo, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { extractWikiLinks } from '../../lib/stats'
import type { Note } from '../../store/types'

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  degree: number
  title: string
}

interface Edge {
  a: string
  b: string
}

export function GraphPane(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const activeId = useStore((s) => s.meta.activeNoteId)
  const openNote = useStore((s) => s.openNote)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<Map<string, Node>>(new Map())
  const hoverRef = useRef<string | null>(null)
  const radiusRef = useRef(9)

  const linkSignature = useMemo(() => {
    const parts: string[] = []
    for (const n of notes) {
      if (n.trashed) continue
      const links = n.content.match(/\[\[[^\]]*\]\]/g)
      parts.push(`${n.id}:${n.title}:${links ? links.join(',') : ''}`)
    }
    return parts.join('|')
  }, [notes])

  const { edges, visible } = useMemo(() => {
    const list = notes.filter((n) => !n.trashed)
    const titleMap = new Map(list.map((n) => [n.title.toLowerCase(), n.id]))
    const edgeSet = new Map<string, Edge>()
    for (const note of list) {
      for (const target of extractWikiLinks(note.content)) {
        const targetId = titleMap.get(target.toLowerCase())
        if (!targetId || targetId === note.id) continue
        const key = [note.id, targetId].sort().join('|')
        edgeSet.set(key, { a: note.id, b: targetId })
      }
    }
    return { edges: Array.from(edgeSet.values()), visible: list as Note[] }
  }, [linkSignature])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = wrap.clientWidth
    let height = wrap.clientHeight
    const dpr = window.devicePixelRatio || 1

    const resize = (): void => {
      width = wrap.clientWidth
      height = wrap.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const positionMap = nodesRef.current
    const ids = new Set(visible.map((n) => n.id))
    for (const id of Array.from(positionMap.keys())) if (!ids.has(id)) positionMap.delete(id)
    visible.forEach((n, i) => {
      if (!positionMap.has(n.id)) {
        const angle = (i / visible.length) * Math.PI * 2
        positionMap.set(n.id, {
          id: n.id,
          x: width / 2 + Math.cos(angle) * Math.min(width, height) * 0.32 + (Math.random() - 0.5) * 20,
          y: height / 2 + Math.sin(angle) * Math.min(width, height) * 0.32 + (Math.random() - 0.5) * 20,
          vx: 0,
          vy: 0,
          degree: 0,
          title: n.title,
        })
      }
      const node = positionMap.get(n.id)!
      node.title = n.title
      node.degree = 0
    })
    for (const edge of edges) {
      const a = positionMap.get(edge.a)
      const b = positionMap.get(edge.b)
      if (a) a.degree += 1
      if (b) b.degree += 1
    }

    const nodes = Array.from(positionMap.values())
    const nodeById = new Map(nodes.map((n) => [n.id, n]))

    const simulate = (): void => {
      const cx = width / 2
      const cy = height / 2
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          let dx = a.x - b.x
          let dy = a.y - b.y
          let dist2 = dx * dx + dy * dy
          if (dist2 < 1) {
            dx = Math.random() - 0.5
            dy = Math.random() - 0.5
            dist2 = 1
          }
          const force = 1400 / dist2
          const dist = Math.sqrt(dist2)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          a.vx += fx
          a.vy += fy
          b.vx -= fx
          b.vy -= fy
        }
      }
      for (const edge of edges) {
        const a = nodeById.get(edge.a)
        const b = nodeById.get(edge.b)
        if (!a || !b) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const desired = 78
        const force = (dist - desired) * 0.02
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      }
      for (const node of nodes) {
        node.vx += (cx - node.x) * 0.002
        node.vy += (cy - node.y) * 0.002
        node.vx *= 0.82
        node.vy *= 0.82
        node.x += Math.max(-12, Math.min(12, node.vx))
        node.y += Math.max(-12, Math.min(12, node.vy))
        node.x = Math.max(16, Math.min(width - 16, node.x))
        node.y = Math.max(16, Math.min(height - 16, node.y))
      }
    }

    const draw = (): void => {
      ctx.clearRect(0, 0, width, height)
      const styles = getComputedStyle(document.documentElement)
      const border = styles.getPropertyValue('--border-strong').trim() || '#333'
      const accent = styles.getPropertyValue('--accent').trim() || '#f5a524'
      const textFaint = styles.getPropertyValue('--text-faint').trim() || '#666'
      const text = styles.getPropertyValue('--text').trim() || '#eee'
      const bgPanel = styles.getPropertyValue('--bg-panel').trim() || '#111'

      ctx.lineWidth = 1
      for (const edge of edges) {
        const a = nodeById.get(edge.a)
        const b = nodeById.get(edge.b)
        if (!a || !b) continue
        const active = activeId === edge.a || activeId === edge.b
        ctx.strokeStyle = active ? accent : border
        ctx.globalAlpha = active ? 0.5 : 0.28
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      const hovered = hoverRef.current
      for (const node of nodes) {
        const isActive = node.id === activeId
        const isHover = node.id === hovered
        const r = 4 + Math.min(9, node.degree) + (isActive ? 3 : 0)
        radiusRef.current = r
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = isActive ? accent : isHover ? text : bgPanel
        ctx.strokeStyle = isActive || isHover ? accent : border
        ctx.lineWidth = isActive ? 2.5 : 1.5
        ctx.fill()
        ctx.stroke()
        if (node.degree > 1 || isActive || isHover) {
          ctx.fillStyle = isActive ? accent : textFaint
          ctx.font = `${isActive ? '600 ' : ''}11px ui-sans-serif, system-ui, sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(node.title.length > 22 ? `${node.title.slice(0, 22)}…` : node.title, node.x, node.y + r + 13)
        }
      }
    }

    for (let i = 0; i < 240; i++) simulate()
    draw()

    const hitTest = (mx: number, my: number): Node | null => {
      let best: Node | null = null
      let bestDist = Infinity
      for (const node of nodes) {
        const dx = node.x - mx
        const dy = node.y - my
        const dist = dx * dx + dy * dy
        const r = 6 + Math.min(9, node.degree) + 4
        if (dist < r * r && dist < bestDist) {
          bestDist = dist
          best = node
        }
      }
      return best
    }

    const onClick = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect()
      const node = hitTest(e.clientX - rect.left, e.clientY - rect.top)
      if (node) openNote(node.id)
    }
    const onMove = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect()
      const node = hitTest(e.clientX - rect.left, e.clientY - rect.top)
      const id = node?.id ?? null
      if (id !== hoverRef.current) {
        hoverRef.current = id
        canvas.style.cursor = id ? 'pointer' : 'grab'
        draw()
      }
    }
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', () => {
      hoverRef.current = null
      draw()
    })

    const observer = new ResizeObserver(() => {
      resize()
      for (let i = 0; i < 40; i++) simulate()
      draw()
    })
    observer.observe(wrap)

    return () => {
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('mousemove', onMove)
      observer.disconnect()
    }
  }, [visible, edges, activeId, openNote])

  return (
    <div className="graph-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} className="graph-canvas" />
      <div className="graph-hint">Click a node to open · relations grow with wiki links</div>
    </div>
  )
}
