/* eslint-disable @next/next/no-img-element -- Approved pre-sized logo variants. */
import styles from "./ThemedLogo.module.css";

/** CSS selects one existing readable variant, including before hydration. */
export function ThemedLogo() {
  return <span className={styles.logo}>
    <img className={styles.light} src="/courtside/GOAT-HOOPERS-horizontal-black.svg" alt="GOAT Hoopers" width="208" height="55" />
    <img className={styles.dark} src="/courtside/GOAT-HOOPERS-horizontal-white.svg" alt="GOAT Hoopers" width="208" height="55" />
  </span>;
}
