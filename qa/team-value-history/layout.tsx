import "@/ui/tokens.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><style>{`body{margin:0;background:var(--gh-bg);color:var(--gh-text);font-family:var(--gh-font-body)}main{box-sizing:border-box;max-width:58rem;margin:auto;padding:var(--gh-s4)}.fixture-note{font-size:var(--gh-text-xs);color:var(--gh-text-dim);border-bottom:1px solid var(--gh-border);padding-bottom:var(--gh-s4)}button,input{font-family:inherit}`}</style>{children}</body></html>;
}
