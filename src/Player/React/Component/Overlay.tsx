import { PropsWithChildren } from 'react';
import styles from './Overlay.module.css';

type OverlayProps = PropsWithChildren<{
  // No props
}>;

const Overlay = ({ children }: OverlayProps) => (
  <div className={styles.overlay}>
    {children}
  </div>
);

export default Overlay;
