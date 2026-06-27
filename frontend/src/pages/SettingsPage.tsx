import { motion } from 'framer-motion'
import { Bell, Lock, Palette, Users, Database, AlertCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'

interface SettingSection {
  icon: React.ReactNode
  title: string
  description: string
  settings: Array<{
    label: string
    type: 'toggle' | 'select' | 'text'
    value: string | boolean
  }>
}

const settings: SettingSection[] = [
  {
    icon: <Bell size={24} />,
    title: 'Notifications',
    description: 'Manage notification preferences',
    settings: [
      { label: 'Email Alerts', type: 'toggle', value: true },
      { label: 'Pipeline Updates', type: 'toggle', value: true },
      { label: 'Candidate Insights', type: 'toggle', value: false },
    ],
  },
  {
    icon: <Lock size={24} />,
    title: 'Security',
    description: 'Security and access controls',
    settings: [
      { label: 'Two-Factor Authentication', type: 'toggle', value: true },
      { label: 'Login Alerts', type: 'toggle', value: true },
      { label: 'Session Timeout', type: 'select', value: '30 minutes' },
    ],
  },
  {
    icon: <Palette size={24} />,
    title: 'Preferences',
    description: 'Display and behavior settings',
    settings: [
      { label: 'Theme', type: 'select', value: 'Dark Mode' },
      { label: 'Data Density', type: 'select', value: 'Compact' },
      { label: 'Animation', type: 'toggle', value: true },
    ],
  },
  {
    icon: <Users size={24} />,
    title: 'Team',
    description: 'Manage team members and permissions',
    settings: [
      { label: 'Team Members', type: 'text', value: '4 members' },
      { label: 'Default Role', type: 'select', value: 'Analyst' },
      { label: 'Invite New Member', type: 'text', value: '' },
    ],
  },
  {
    icon: <Database size={24} />,
    title: 'Data',
    description: 'Data management and exports',
    settings: [
      { label: 'Auto Backup', type: 'toggle', value: true },
      { label: 'Data Retention', type: 'select', value: '1 year' },
      { label: 'Last Backup', type: 'text', value: 'Today at 03:00 AM' },
    ],
  },
  {
    icon: <AlertCircle size={24} />,
    title: 'Advanced',
    description: 'Advanced settings and danger zone',
    settings: [
      { label: 'API Access', type: 'toggle', value: false },
      { label: 'Debug Mode', type: 'toggle', value: false },
      { label: 'Reset to Defaults', type: 'text', value: '' },
    ],
  },
]

export function SettingsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-80">
        <Topbar />
        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-6 lg:p-8 max-w-6xl"
        >
          <motion.div variants={itemVariants} className="mb-12">
            <h1 className="text-3xl font-space-grotesk font-bold mb-2">Settings</h1>
            <p className="text-muted">Manage your account, preferences, and team settings</p>
          </motion.div>

          {/* Settings Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {settings.map((section, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <GlassCard className="h-full">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">{section.icon}</div>
                    <div>
                      <h3 className="text-lg font-space-grotesk font-semibold">{section.title}</h3>
                      <p className="text-xs text-muted mt-1">{section.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {section.settings.map((setting, setIdx) => (
                      <div key={setIdx} className="flex items-center justify-between">
                        <label className="text-sm font-medium">{setting.label}</label>
                        {setting.type === 'toggle' && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            className={`w-10 h-6 rounded-full transition-colors ${
                              setting.value ? 'bg-primary' : 'bg-surface-elevated'
                            }`}
                          >
                            <motion.div
                              initial={false}
                              animate={{ x: setting.value ? 20 : 0 }}
                              className="w-5 h-5 bg-foreground rounded-full"
                            />
                          </motion.button>
                        )}
                        {setting.type === 'select' && (
                          <select className="px-3 py-1 text-sm rounded-lg glass-elevated outline-none focus:ring-2 ring-primary/30">
                            <option>{setting.value}</option>
                          </select>
                        )}
                        {setting.type === 'text' && (
                          <input
                            type="text"
                            defaultValue={setting.value as string}
                            placeholder="Enter value"
                            className="px-3 py-1 text-sm rounded-lg glass-elevated outline-none focus:ring-2 ring-primary/30"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-6 px-4 py-2 text-sm font-medium rounded-lg border border-border/50 hover:bg-surface/20 transition-colors"
                  >
                    Save Changes
                  </motion.button>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Profile Section */}
          <motion.div variants={itemVariants} className="mt-12">
            <GlassCard className="p-8">
              <h3 className="text-lg font-space-grotesk font-semibold mb-6">Account</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <div>
                    <p className="font-medium">Email Address</p>
                    <p className="text-sm text-muted">account@example.com</p>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted">Last changed 3 months ago</p>
                  </div>
                  <Button variant="outline" size="sm">Update</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account Status</p>
                    <p className="text-sm text-emerald">Active & Verified</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.main>
      </div>
    </div>
  )
}

export default SettingsPage
