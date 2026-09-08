"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createOwnerUser,
  getOwnerUsers,
  resetOwnerUserPassword,
  setOwnerUserActive,
  type CreatableUserRole,
  type OwnerManagedUser,
} from "@/lib/ownerUsersApi";


export default function OwnerUserManagement() {
  const [
    users,
    setUsers,
  ] = useState<OwnerManagedUser[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busyUserId,
    setBusyUserId,
  ] = useState<number | null>(null);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    message,
    setMessage,
  ] = useState<string | null>(null);

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    role,
    setRole,
  ] = useState<CreatableUserRole>(
    "staff",
  );


  const loadUsers =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError(null);

          const data =
            await getOwnerUsers();

          setUsers(data);
        } catch (error) {
          if (
            error instanceof Error
          ) {
            setError(
              error.message,
            );
          } else {
            setError(
              "Could not load users.",
            );
          }
        } finally {
          setLoading(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadUsers();
  }, [
    loadUsers,
  ]);


  async function handleCreate(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setMessage(null);

    if (
      !username.trim() ||
      !password
    ) {
      setError(
        "Username and password are required.",
      );

      return;
    }

    try {
      await createOwnerUser({
        username:
          username.trim(),
        password,
        role,
      });

      setUsername("");
      setPassword("");
      setRole("staff");

      setMessage(
        "Account created.",
      );

      await loadUsers();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not create account.",
        );
      }
    }
  }


  async function handleActiveChange(
    user: OwnerManagedUser,
  ) {
    try {
      setBusyUserId(
        user.id,
      );
      setError(null);
      setMessage(null);

      const updated =
        await setOwnerUserActive(
          user.id,
          !user.is_active,
        );

      setUsers(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updated.id
                ? updated
                : item,
          ),
      );

      setMessage(
        updated.is_active
          ? `${updated.username} reactivated.`
          : `${updated.username} deactivated.`,
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not update account.",
        );
      }
    } finally {
      setBusyUserId(null);
    }
  }


  async function handlePasswordReset(
    user: OwnerManagedUser,
  ) {
    const newPassword =
      window.prompt(
        `Enter a new password for ${user.username}.\n\nMinimum 10 characters.`,
      );

    if (newPassword === null) {
      return;
    }

    if (
      newPassword.length < 10
    ) {
      setError(
        "Password must contain at least 10 characters.",
      );

      return;
    }

    try {
      setBusyUserId(
        user.id,
      );
      setError(null);
      setMessage(null);

      await resetOwnerUserPassword(
        user.id,
        newPassword,
      );

      setMessage(
        `Password reset for ${user.username}. Existing sessions were revoked.`,
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not reset password.",
        );
      }
    } finally {
      setBusyUserId(null);
    }
  }


  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            New account
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Add resort user
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create Operator or Staff
            access for the resort.
          </p>
        </div>

        <form
          onSubmit={
            handleCreate
          }
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Username
            </span>

            <input
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
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="e.g. frontdesk"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Role
            </span>

            <select
              value={role}
              onChange={(
                event,
              ) =>
                setRole(
                  event.target
                    .value as CreatableUserRole,
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-sky-500"
            >
              <option value="staff">
                Staff
              </option>

              <option value="operator">
                Operator
              </option>
            </select>
          </label>

          <label className="space-y-1.5 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Temporary password
            </span>

            <input
              type="password"
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
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="Minimum 10 characters"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create account
            </button>
          </div>
        </form>
      </section>


      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}


      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Access
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Resort accounts
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Manage access without
              exposing stored passwords.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadUsers()
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>


        {loading ? (
          <p className="mt-8 text-sm text-slate-500">
            Loading accounts...
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">
                    User
                  </th>

                  <th className="px-3 py-3">
                    Role
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="px-3 py-3">
                    Created
                  </th>

                  <th className="px-3 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map(
                  (user) => {
                    const busy =
                      busyUserId ===
                      user.id;

                    return (
                      <tr
                        key={
                          user.id
                        }
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold text-slate-950">
                            {
                              user.username
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID {user.id}
                          </p>
                        </td>

                        <td className="px-3 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                            {
                              user.role
                            }
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={
                              user.is_active
                                ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"
                            }
                          >
                            {user.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-600">
                          {new Date(
                            user.created_at,
                          ).toLocaleString()}
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex justify-end gap-2">
                            {user.role !==
                              "owner" && (
                              <button
                                type="button"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  void handlePasswordReset(
                                    user,
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Reset password
                              </button>
                            )}

                            {user.role !==
                              "owner" && (
                              <button
                                type="button"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  void handleActiveChange(
                                    user,
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                {user.is_active
                                  ? "Deactivate"
                                  : "Reactivate"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}