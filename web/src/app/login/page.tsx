"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getCurrentUser,
  homeForRole,
  login,
} from "@/lib/authApi";


export default function LoginPage() {
  const router =
    useRouter();

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      try {
        const user =
          await getCurrentUser();

        if (!cancelled) {
          router.replace(
            homeForRole(
              user.role,
            ),
          );
        }
      } catch {
        if (!cancelled) {
          setCheckingSession(
            false,
          );
        }
      }
    }

    void checkExistingSession();

    return () => {
      cancelled = true;
    };
  }, [
    router,
  ]);


  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !username.trim() ||
      !password
    ) {
      setError(
        "Enter your username and password.",
      );

      return;
    }

    try {
      setLoading(true);
      setError(null);

      const user =
        await login({
          username:
            username.trim(),
          password,
        });

      setPassword("");

      router.replace(
        homeForRole(
          user.role,
        ),
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
          "Could not sign in.",
        );
      }
    } finally {
      setLoading(false);
    }
  }


  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-600">
            Checking session...
          </p>
        </div>
      </main>
    );
  }


  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
              Sea Waves Chalet
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Staff Login
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sign in to access your
              resort workspace.
            </p>
          </div>


          <form
            onSubmit={
              handleSubmit
            }
            className="mt-7 space-y-5"
          >
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Username
              </span>

              <input
                type="text"
                autoComplete="username"
                value={
                  username
                }
                onChange={(
                  event,
                ) =>
                  setUsername(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500"
                placeholder="Username"
              />
            </label>


            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Password
              </span>

              <input
                type="password"
                autoComplete="current-password"
                value={
                  password
                }
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500"
                placeholder="Password"
              />
            </label>


            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {error}
              </div>
            )}


            <button
              type="submit"
              disabled={
                loading
              }
              className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>


          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Resort management access
            only.
          </p>
        </div>
      </div>
    </main>
  );
}