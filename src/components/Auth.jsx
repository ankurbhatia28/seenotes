import { supabase } from '../supabase'

export default function Auth() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })

    if (error) {
      console.error('Error logging in:', error.message)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Todo Tracker</h1>
        <p>Sign in to access your todo lists</p>
        <button onClick={handleGoogleLogin} className="google-login-btn">
          Sign in with Google
        </button>
      </div>
    </div>
  )
}