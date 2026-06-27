import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, CheckCircle } from 'lucide-react'
import HeroBackground from '../components/HeroBackground'
import Button from '../components/Button'

export function LandingPage() {
  const navigate = useNavigate()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 },
    },
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <HeroBackground />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="fixed top-0 z-50 w-full glass border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-2xl font-space-grotesk font-bold gradient-text"
          >
            PRISM
          </motion.div>

          <div className="hidden sm:flex items-center gap-8">
            <a href="#pipeline" className="text-sm hover:text-primary transition-colors">
              Pipeline
            </a>
            <a href="#intelligence" className="text-sm hover:text-primary transition-colors">
              Intelligence
            </a>
            <a href="#trust" className="text-sm hover:text-primary transition-colors">
              Trust
            </a>
          </div>

          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 text-xs font-mono bg-emerald/10 px-3 py-1.5 rounded-full border border-emerald/30"
            >
              <span className="w-2 h-2 bg-emerald rounded-full animate-pulse" />
              Live
            </motion.div>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="primary"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="text-center space-y-8">
          <motion.div variants={itemVariants}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-space-grotesk font-bold gradient-text leading-tight">
              PRISM
            </h1>
          </motion.div>

          <motion.p variants={itemVariants} className="text-xl text-muted max-w-2xl mx-auto">
            AI Recruitment Intelligence Platform
          </motion.p>

          <motion.p variants={itemVariants} className="text-lg text-foreground/80 max-w-3xl mx-auto">
            Enterprise AI platform transforming candidate data into explainable recruitment intelligence.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={() => navigate('/analyze')}
              variant="primary"
              size="lg"
              className="flex items-center justify-center gap-2"
            >
              Analyze Candidates
              <ArrowRight size={20} />
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="lg"
              className="flex items-center justify-center gap-2"
            >
              View Dashboard
              <ArrowRight size={20} />
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="pt-8 text-sm font-mono text-muted border-t border-border/50"
          >
            <p>104,286 Profiles Indexed</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <motion.h2
          variants={itemVariants}
          className="text-3xl sm:text-4xl font-space-grotesk font-bold text-center mb-16"
        >
          Capabilities
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap size={32} className="text-primary" />,
              title: 'Explainable AI',
              description: 'Transparent decision-making with detailed reasoning for every candidate assessment',
            },
            {
              icon: <Shield size={32} className="text-emerald" />,
              title: 'Fairness Validated',
              description: 'Bias detection and mitigation across demographic dimensions',
            },
            {
              icon: <CheckCircle size={32} className="text-accent-cyan" />,
              title: 'Seven Phase Pipeline',
              description: 'Comprehensive analysis from data ingestion to final intelligence reports',
            },
          ].map((capability, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="glass p-8 rounded-2xl text-center"
            >
              <div className="flex justify-center mb-4">{capability.icon}</div>
              <h3 className="font-space-grotesk font-semibold text-lg mb-2">{capability.title}</h3>
              <p className="text-muted text-sm">{capability.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 px-4 sm:px-6 lg:px-8 text-center"
      >
        <div className="max-w-2xl mx-auto glass-elevated p-12 rounded-2xl">
          <h3 className="text-2xl font-space-grotesk font-bold mb-4">Ready to Transform Your Recruitment?</h3>
          <p className="text-muted mb-8">Experience the future of intelligent candidate analysis</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/dashboard')} variant="primary" size="lg">
              Enter Dashboard
            </Button>
            <Button onClick={() => navigate('/analyze')} variant="outline" size="lg">
              Start Analysis
            </Button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

export default LandingPage
