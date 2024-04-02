import { PropsWithChildren } from 'react';

type OverlayProps = PropsWithChildren<{
  // No props
}>;

const Overlay = ({ children }: OverlayProps) => (
  <div
    style={{
      margin: 0,
      padding: 0,
      width: '100vw',
      height: '100vh',
      position: 'absolute',
      zIndex: 999999,
      pointerEvents: 'none',
    }}
  >
    {children}
  </div>
);

export default Overlay;
