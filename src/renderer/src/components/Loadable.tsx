import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'

export function loadable<P extends object>(factory: () => Promise<{ default: ComponentType<P> }>, fallback?: ReactNode): ComponentType<P> {
  const Lazy = lazy(factory) as unknown as ComponentType<P>
  return function Loadable(props: P): ReactNode {
    return (
      <Suspense fallback={fallback ?? <div className="lazy-fallback" />}>
        <Lazy {...props} />
      </Suspense>
    )
  }
}