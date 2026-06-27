import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, BarChart3, Users, GitCompare, Lightbulb, Zap } from 'lucide-react'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Candidates', href: '/candidates', icon: Users },
  { name: 'Compare', href: '/compare', icon: GitCompare },
  { name: 'Insights', href: '/insights', icon: Lightbulb },
  { name: 'Pipeline', href: '/pipeline', icon: Zap },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const location = useLocation()

  const containerVariants = {
    open: { width: '280px' },
    closed: { width: '80px' },
  }

  const textVariants = {
    open: { opacity: 1, display: 'block' },
    closed: { opacity: 0, display: 'none' },
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg glass md:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <motion.div
        variants={containerVariants}
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex fixed left-0 top-0 h-screen glass-elevated flex-col py-8 px-4 border-r border-border z-40"
      >
        <div className="mb-8">
          <motion.div
            variants={textVariants}
            className="text-xl font-space-grotesk font-bold gradient-text"
          >
            PRISM
          </motion.div>
        </div>

        <nav className="flex-1 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href

            return (
              <Link key={item.href} to={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={20} />
                  <motion.span
                    variants={textVariants}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-lg"
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

      </motion.div>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          className="md:hidden fixed left-0 top-0 h-screen w-72 glass-elevated flex flex-col py-8 px-4 z-30"
        >
          <div className="mb-8">
            <div className="text-2xl font-space-grotesk font-bold gradient-text">PRISM</div>
          </div>

          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </motion.div>
      )}
    </>
  )
}

export default Sidebar
