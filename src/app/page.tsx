import Link from "next/link";

import { getSession } from "~/server/auth";
import { AuthButton } from "~/app/_components/auth-button";
import Image from "next/image";
export default async function Home() {

	const session = await getSession();


	return (
		// <HydrateClient>
		<main className="flex min-h-screen flex-col items-center justify-center text-white">
			<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
				{/* <h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]"> */}
					{/* <span>Kol<span className="text-red-600">OS</span></span> */}
				{/* </h1> */}

				<Image src="/scrin.webp" alt="KolOS Logo" width={200} height={200} />

				{session?.user && (
					<div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8 `}>
						<Link
							className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20 cursor-pointer"
							href="/quiz"

						>
							<h3 className="font-bold text-2xl">Quizy i testy →</h3>
							<div className="text-lg">
								Sprawdź swoją wiedzę w krótkich quizach i testach przygotowanych dla studentów.
							</div>
						</Link>

						<Link
							className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20 cursor-pointer"
							href="/files"

						>
							<h3 className="font-bold text-2xl">Notatki i materiały →</h3>
							<div className="text-lg">
								Zapisuj i organizuj notatki z wykładów;
							</div>
						</Link>

						<Link
							className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20 cursor-pointer"
							href="/chat"

						>
							<h3 className="font-bold text-2xl">Czatuj z notatkami →</h3>
							<div className="text-lg">
								Wykorzystaj moc AI do interakcji z notatkami i uzyskiwania szybkich odpowiedzi.
							</div>
						</Link>

						<Link
							className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20 cursor-pointer"
							href="/quiz"

						>
							<h3 className="font-bold text-2xl">Zwizualizuj wiedze →</h3>
							<div className="text-lg">
								Graf wiedzy pomagający zrozumieć powiązania między tematami.
							</div>
						</Link>

						{/* <Link
							className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20 cursor-pointer"
							href="#"
							target="_blank"
						>
							<h3 className="font-bold text-2xl">Organizacja nauki →</h3>
							<div className="text-lg">
								Zarządzaj czasem, planuj egzaminy i śledź postępy w nauce w jednym miejscu.
							</div>
						</Link> */}

					</div>
				)}
				<div className="flex flex-col items-center gap-2">



					{session?.user && (
						<img
							src={session?.user?.image ?? ""}
							alt="avatar"
							className="w-10 h-10 rounded-full"
						/>
					)}

					<div className="flex flex-col items-center justify-center gap-4">
						<p className="text-center text-2xl text-white">
							{session && <span>Zalogowano jako {session.user?.name}</span>}
						</p>
						{/* <Link
								href={session ? "/api/auth/signout" : "/api/auth/signin"}
								className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
							>
								{session ? "Sign out" : "Sign in"}
							</Link> */}

						{/* {session && <button className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20">Continue</button> } */}



						<AuthButton />


					</div>
				</div>


			</div>
		</main>
		// </HydrateClient>
	);
}
