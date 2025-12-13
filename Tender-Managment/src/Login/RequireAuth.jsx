// src/components/RequireAuth.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../../Supabase/supabase";

/**
 * RequireAuth
 * Props:
 *  - children: React node to render when authenticated
 *  - redirectTo (optional): path to redirect unauthenticated users (default: "/login")
 *
 * Behavior:
 *  - Shows a short loading indicator while verifying the session.
 *  - If authenticated, renders children.
 *  - If not, redirects to login and preserves attempted URL in state.
 */
export default function RequireAuth({ children, redirectTo = "/login" }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    async function check() {
      setChecking(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!mounted) return;
        if (error) {
          // no active session
          setAuthed(false);
        } else {
          // authenticated if data.user exists
          setAuthed(Boolean(data?.user));
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setAuthed(false);
      } finally {
        if (mounted) setChecking(false);
      }
    }

    check();

    // Listen to auth state changes so component reacts to sign-in/out
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // session may be null on sign out
      setAuthed(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">Verifying session...</div>
      </div>
    );
  }

  if (!authed) {
    // Redirect to login. keep state so the login page can navigate back after success:
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Authenticated — render children
  return <>{children}</>;
}
