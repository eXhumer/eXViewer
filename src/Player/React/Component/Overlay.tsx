import { PropsWithChildren } from 'react';
import './Overlay.css';

type OverlayProps = PropsWithChildren<{
  // No props
}>;

const Overlay = ({ children }: OverlayProps) => (
  <div className={'overlay'}>
    {children}
  </div>
);

export default Overlay;
