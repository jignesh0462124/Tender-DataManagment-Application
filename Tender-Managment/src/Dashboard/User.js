import { useState, useEffect } from "react";
import { supabase } from "../../supabase/supabase"; // adjust path if needed
import { useNavigate } from "react-router-dom";

// Helper: map Supabase user -> UI-friendly user object
const mapUser = (supabaseUser) => {
  if (!supabaseUser) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.user_metadata?.full_name || supabaseUser.email || "User",
    role: supabaseUser.user_metadata?.role || "User",
    avatar:
      supabaseUser.user_metadata?.avatar_url ||
      `https://i.pravatar.cc/100?u=${supabaseUser.id}`,
    raw: supabaseUser, // keep original in case you need it later
  };
};

// 🔹 Hook: useUser – for guarding routes + logout
export const useUser = () => {
  const [user, setUser] = useState(null); // this will be the mapped user
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching session:", error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(mapUser(session.user));
      } else {
        // If no user, redirect to login
        navigate("/");
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes (sign out in another tab, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapUser(session.user));
      } else {
        setUser(null);
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return { user, loading, logout };
};

// 🔹 Function: getUserData – used in Dashboard.jsx
export const getUserData = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error fetching session:", error);
    return null;
  }

  if (!session?.user) return null;

  return mapUser(session.user);
};
