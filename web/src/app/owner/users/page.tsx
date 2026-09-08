import Link from "next/link";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OwnerUserManagement from "@/components/owner/OwnerUserManagement";


export default function OwnerUsersPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        "owner",
      ]}
    >
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8">
            <Link
              href="/owner"
              className="text-sm font-semibold text-sky-700 hover:text-sky-800"
            >
              ← Owner Overview
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                Sea Waves Chalet
              </p>

              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                Owner
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              User Management
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Create and manage
              Operator and Staff access
              for Sea Waves Chalet.
            </p>
          </header>

          <OwnerUserManagement />
        </div>
      </main>
    </ProtectedRoute>
  );
}