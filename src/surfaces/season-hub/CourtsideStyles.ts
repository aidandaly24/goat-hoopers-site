import styles from "./CourtsideHome.module.css";
export function cs(...names: string[]) {
  return names
    .map((name) => styles[name])
    .filter(Boolean)
    .join(" ");
}
