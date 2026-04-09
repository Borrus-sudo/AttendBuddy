import { useEffect, useState } from "react"
import { useSession, signIn, signOut, getSession } from "./lib/auth-client"
import "./App.css"

function App() {
  const { data: session, isPending } = useSession()
  const [isRedirecting, setIsRedirecting] = useState(false)

  async function handleGoogleLogin() {
    setIsRedirecting(true)
    await signIn.social({
      provider: "google",
      callbackURL: window.location.origin,
    })
  }

  async function handleLogout() {
    await signOut()
  }

  // After an OAuth redirect the server may set auth cookies. Ensure we
  // re-check the session and clean up URL query params so the SPA shows
  // the authenticated state without stray OAuth parameters.
  useEffect(() => {
    const search = window.location.search
    if (!session && !isPending && (search.includes("code=") || search.includes("state=") || search.includes("error="))) {
      ;(async () => {
        try {
          await getSession()
        } catch (e) {
          // ignore - session may not be available yet
        }
        // remove query params to keep the UI clean
        history.replaceState({}, document.title, window.location.pathname)
      })()
    }
  }, [session, isPending])

  if (isPending) {
    return <div className="loading">Loading...</div>
  }

  if (session) {
    return (
      <section id="center">
        <div className="card">
          <h1>Welcome, {session.user.name}!</h1>
          <p>Email: {session.user.email}</p>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </section>
    )
  }

  return (
    <section id="center">
      <div className="card">
        <h1>Sign In</h1>
        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={isRedirecting}
        >
          {isRedirecting ? "Redirecting..." : "Sign in with Google"}
        </button>
      </div>
    </section>
  )
}

export default App
