import { PropsWithChildren } from 'react';
import styles from './Overlay.module.scss';

type OverlayProps = PropsWithChildren<{
  zIndex?: number;
}>;

const Overlay = ({ children, zIndex }: OverlayProps) => (
  <div className={styles['overlay']} style={{ zIndex: zIndex | 999999 }}>
    {children}
  </div>
);

export default Overlay;
