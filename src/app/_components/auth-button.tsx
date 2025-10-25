"use client"

import { signOut } from "~/lib/auth-client"
import { signInGoogle } from "~/lib/social-login"
import { useSession } from "~/lib/auth-client"
import { useRouter } from "next/navigation"

export const AuthButton = () => {
    const { data: session } = useSession()

    const router = useRouter()

    return (

        <button className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20" onClick={() => {
            session ? signOut({
                fetchOptions: {
                    onSuccess: () => {
                        router.refresh();
                    },
                    onError: (ctx) => {
                        alert(ctx.error.message);
                    },

                },
            }) : signInGoogle()
        }}>{session ? "Wyloguj sie" : "Zaloguj sie"}</button>
    )
}

