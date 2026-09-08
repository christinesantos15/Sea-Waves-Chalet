"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getCurrentUser,
  homeForRole,
  logout,
  type AuthUser,
  type UserRole,
} from "@/lib/authApi";


type ProtectedRouteProps = {
  allowedRoles: UserRole[];
  children: ReactNode;
};


export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const router =
    useRouter();

  const [
    user,
    setUser,
  ] = useState<
    AuthUser | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        setLoading(true);
        setError(null);

        const currentUser =
          await getCurrentUser();

        if (cancelled) {
          return;
        }

        if (
          !allowedRoles.includes(
            currentUser.role,
          )
        ) {
          router.replace(
            homeForRole(
              currentUser.role,
            ),
          );

          return;
        }

        setUser(
          currentUser,
        );
      } catch {
        if (cancelled) {
          return;
        }

        router.replace(
          "/login",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, [
    allowedRoles,
    router,
  ]);


  async function handleLogout() {
    try {
      setError(null);

      await logout();

      router.replace(
        "/login",
      );

      router.refresh();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not log out.",
        );
      }
    }
  }


  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-600">
              Checking access...
            </p>
          </div>
        </div>
      </main>
    );
  }


  if (!user) {
    return null;
  }


  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="text-sm">
            <span className="text-slate-500">
              Signed in as{" "}
            </span>

            <span className="font-semibold text-slate-950">
              {user.username}
            </span>

            <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-600">
              {user.role}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              void handleLogout()
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Log out
          </button>
        </div>

        {error && (
          <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 lg:px-8">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}
      </div>

      {children}
    </>
  );
}