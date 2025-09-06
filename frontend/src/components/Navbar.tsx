import styles from "./Navbar.module.css";

type Props = {
  current: "home" | "watchlist";
  onNav: (tab: "home" | "watchlist") => void;
  onLogin?: () => void;
  onLogout?: () => void;  
  userEmail?: string | null;

  // NEW: allow passing style/className from parent
  style?: React.CSSProperties;
  className?: string;
};

export default function Navbar({
  current,
  onNav,
  onLogin = () => {},                    // <-- safe defaults
  onLogout = () => {}, 
  userEmail,
  style,
  className,
  
}: Props) {
  return (
    <header className={`${styles.wrap} ${className ?? ""}`} style={style}>
      <div className={styles.inner}>
        {/* Left side: brand + tabs */}
        <div className={styles.left}>
          <div
            className={styles.brand}
            role="button"
            tabIndex={0}
            onClick={() => onNav("home")}
          >Crypto Portfolio
          </div>
          <nav className={styles.nav} aria-label="Primary">
            <button
              className={`${styles.tab} ${current === "home" ? styles.active : ""}`}
              onClick={() => onNav("home")}
            >Home
            </button>
            <button
              className={`${styles.tab} ${current === "watchlist" ? styles.active : ""}`}
              onClick={() => onNav("watchlist")}
            >Watchlist
            </button>
          </nav>
        </div>

{/* Right side: login / email + logout */}
        <div className={styles.right}>
          {userEmail ? (
            <>
              <div className={styles.user} title={userEmail}>{userEmail}</div>
              {/* reuse existing button style; no CSS changes needed */}
              <button className={styles.loginBtn} onClick={onLogout} aria-label="Log out">
                Log out
              </button>
            </>
          ) : (
            <button className={styles.loginBtn} onClick={onLogin} aria-label="Log in">
              Login
            </button>
          )}
        </div>
      </div>  
    </header>
  );
}
