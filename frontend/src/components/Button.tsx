import { motion } from 'framer-motion'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'

type MotionButtonProps = ComponentPropsWithoutRef<typeof motion.button>

interface ButtonProps extends MotionButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'font-medium transition-all rounded-lg font-space-grotesk'
    const sizeStyles = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }
    const variantStyles = {
      primary: 'bg-primary text-background hover:bg-primary/90 hover:shadow-glow',
      secondary: 'bg-surface-elevated text-foreground hover:bg-surface-elevated/80',
      outline: 'border border-border text-foreground hover:bg-surface/20',
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    )
  },
)

Button.displayName = 'Button'

export default Button
