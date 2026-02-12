import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            {/* Visual Identity Side */}
            <div className="relative hidden w-full items-center justify-center lg:flex lg:w-1/2 xl:w-3/5 overflow-hidden">
                <div className="absolute inset-0 bg-zinc-900">
                    <Image
                        src="/login_background.png"
                        alt="GECEC Finance Background"
                        fill
                        className="object-cover opacity-60 mix-blend-overlay"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-zinc-900/80" />
                </div>

                <div className="relative z-10 p-12 text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center font-bold text-2xl shadow-lg ring-4 ring-white/10">
                            G
                        </div>
                        <span className="text-3xl font-bold tracking-tight">GECEC Finance</span>
                    </div>

                    <div className="max-w-md">
                        <h1 className="text-5xl font-extrabold leading-tight mb-6">
                            Gérez votre épargne en toute <span className="text-primary italic">simplicité</span>.
                        </h1>
                        <p className="text-xl text-zinc-300 leading-relaxed">
                            La plateforme de référence pour la collecte mobile et la gestion d'épargne à la carte.
                        </p>
                    </div>

                    <div className="mt-16 flex gap-8">
                        <div>
                            <p className="text-4xl font-bold">10k+</p>
                            <p className="text-zinc-400">Membres actifs</p>
                        </div>
                        <div className="h-12 w-[1px] bg-zinc-700" />
                        <div>
                            <p className="text-4xl font-bold">99.9%</p>
                            <p className="text-zinc-400">Fiabilité</p>
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            {/* Login Form Side */}
            <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6 sm:p-12 lg:p-16 dark:bg-zinc-950">
                <div className="w-full max-w-sm space-y-8">
                    <div className="lg:hidden text-center mb-10">
                        <div className="inline-flex h-12 w-12 rounded-xl bg-primary items-center justify-center font-bold text-2xl text-white shadow-lg mb-4">
                            G
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">GECEC Finance</h2>
                    </div>

                    <LoginForm />

                    <div className="mt-8 text-center">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                            Système de gestion sécurisé
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
