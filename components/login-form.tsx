"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

const formSchema = z.object({
    username: z.string().min(3, {
        message: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
    }),
    password: z.string().min(6, {
        message: "Le mot de passe doit contenir au moins 6 caractères.",
    }),
});

import Link from "next/link";

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("username", values.username);
            formData.append("password", values.password);

            const result = await login(formData);

            if (result.success) {
                toast.success("Connexion réussie !");
                router.push("/dashboard");
                router.refresh();
            } else {
                toast.error(result.error || "Identifiants incorrects.");
            }
        } catch (error) {
            toast.error("Une erreur est survenue lors de la connexion.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto border-none shadow-2xl bg-white/80 backdrop-blur-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center tracking-tight">Bienvenue</CardTitle>
                <CardDescription className="text-center">
                    Connectez-vous à votre compte pour continuer
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom d'utilisateur</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="utilisateur"
                                                className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Mot de passe</FormLabel>
                                        <Button variant="link" className="px-0 font-normal text-xs text-primary" type="button">
                                            Mot de passe oublié ?
                                        </Button>
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                className="pl-10 pr-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button className="w-full h-11 mt-2 text-base font-semibold transition-all hover:scale-[1.01]" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Connexion en cours..." : "Se connecter"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">Ou continuer avec</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-10" disabled>
                        Google
                    </Button>
                    <Button variant="outline" className="h-10" disabled>
                        GitHub
                    </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                    Vous n&apos;avez pas de compte ?{" "}
                    <Link href="/register" className="font-semibold text-primary hover:underline">
                        S&apos;inscrire
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
