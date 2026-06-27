import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  id: number
}

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Initialize nodes
    const nodeCount = 26
    const nodes: Node[] = []
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        id: i,
      })
    }
    nodesRef.current = nodes

    let animationId: number
    let panX = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Pan background slowly
      panX += 0.1
      const offsetX = Math.sin(panX * 0.001) * 20

      // Draw grid
      ctx.strokeStyle = 'rgba(147, 112, 219, 0.05)'
      ctx.lineWidth = 1
      const gridSize = 50

      for (let x = -gridSize + (offsetX % gridSize); x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Update and draw nodes
      nodes.forEach((node) => {
        node.x += node.vx
        node.y += node.vy

        // Bounce off edges with damping
        if (node.x < 0 || node.x > canvas.width) node.vx *= -0.8
        if (node.y < 0 || node.y > canvas.height) node.vy *= -0.8

        node.x = Math.max(0, Math.min(canvas.width, node.x))
        node.y = Math.max(0, Math.min(canvas.height, node.y))

        // Add slight gravity towards center
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const dx = centerX - node.x
        const dy = centerY - node.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < 400) {
          node.vx += (dx / distance) * 0.0001
          node.vy += (dy / distance) * 0.0001
        }

        // Draw node
        ctx.fillStyle = `rgba(147, 112, 219, 0.8)`
        ctx.beginPath()
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw connections
      nodes.forEach((node1, i) => {
        nodes.slice(i + 1).forEach((node2) => {
          const dx = node2.x - node1.x
          const dy = node2.y - node1.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            const gradient = ctx.createLinearGradient(node1.x, node1.y, node2.x, node2.y)
            const alpha = (1 - distance / 150) * 0.3
            gradient.addColorStop(0, `rgba(147, 112, 219, ${alpha})`)
            gradient.addColorStop(1, `rgba(0, 200, 200, ${alpha})`)

            ctx.strokeStyle = gradient
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(node1.x, node1.y)
            ctx.lineTo(node2.x, node2.y)
            ctx.stroke()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none -z-20"
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-surface" />
      <motion.div
        animate={{
          background: [
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(147, 112, 219, 0.2), transparent)',
            'radial-gradient(ellipse 80% 50% at 60% -10%, rgba(147, 112, 219, 0.15), transparent)',
            'radial-gradient(ellipse 80% 50% at 40% -30%, rgba(147, 112, 219, 0.2), transparent)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="fixed inset-0 -z-10 pointer-events-none"
      />
    </>
  )
}

export default HeroBackground
