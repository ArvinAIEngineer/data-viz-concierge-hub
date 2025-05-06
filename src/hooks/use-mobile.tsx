
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkIfMobile)
    
    // Initial check
    checkIfMobile()
    
    return () => mql.removeEventListener("change", checkIfMobile)
  }, [])

  return !!isMobile
}

// Additional breakpoints for more fine-grained control
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<string>("loading")
  
  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      if (width < 640) return setBreakpoint("xs")
      if (width < 768) return setBreakpoint("sm")
      if (width < 1024) return setBreakpoint("md")
      if (width < 1280) return setBreakpoint("lg")
      return setBreakpoint("xl")
    }
    
    window.addEventListener("resize", checkBreakpoint)
    checkBreakpoint()
    
    return () => window.removeEventListener("resize", checkBreakpoint)
  }, [])
  
  return breakpoint
}
