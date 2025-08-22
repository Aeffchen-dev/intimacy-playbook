import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  isAnimating?: boolean;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, isAnimating, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-[23px] w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-[18px] w-[18px] rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[23px] data-[state=unchecked]:translate-x-[1.5px] flex items-center justify-center"
      )}
      style={{ backgroundColor: '#ff69b4' }}
    >
      <svg 
        width="10.8" 
        height="10.8" 
        viewBox="0 0 12 12" 
        fill="none" 
        style={{ 
          transform: `rotate(${isAnimating ? '180deg' : '-10deg'})`,
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {/* Eyes */}
        <circle cx="3.5" cy="4" r="0.8" fill="black" />
        <circle cx="8.5" cy="4" r="0.8" fill="black" />
        {/* Mouth */}
        <path d="M3 7.5 C4.5 9, 7.5 9, 9 7.5" stroke="black" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </svg>
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
