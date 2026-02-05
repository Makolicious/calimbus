"use client";

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-orange-500 text-white px-4 py-3 shadow-md">
      <div className="flex items-center justify-between max-w-full">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Calimbus</h1>
        </div>

        <div className="flex items-center gap-4">
          {session?.user && (
            <>
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm font-medium hidden sm:block">
                  {session.user.name}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
