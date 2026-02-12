"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Lock, Eye, EyeOff, Loader2, Mail, BadgeCheck } from "lucide-react";
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
import { register } from "@/lib/auth";
import Link from "next/link";

const formSchema = z.object({
    username: z.string().min(3, {
        message: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
    }),
    first_name: z.string().min(2, {
        message: "Le prénom est requis.",
    }),
    last_name: z.string().min(2, {
        message: "Le nom est requis.",
    }),
    email: z.string().email({
        message: "Veuillez entrer une adresse email valide.",
    }),
    password: z.string().min(6, {
        message: "Le mot de passe doit contenir au moins 6 caractères.",
    }),
});

export function RegistrationForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            first_name: "",
            last_name: "",
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("username", values.username);
            formData.append("first_name", values.first_name);
            formData.append("last_name", values.last_name);
            formData.append("email", values.email);
            formData.append("password", values.password);

            const result = await register(formData);

            if (result.success) {
                toast.success("Compte créé avec succès !");
                router.push("/login");
            } else {
                toast.error(result.error || "Une erreur est survenue lors de l'inscription.");
            }
        } catch (error) {
            toast.error("Une erreur est survenue lors de l'inscription.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-lg mx-auto border-none shadow-2xl bg-white/80 backdrop-blur-md overflow-hidden">
            <CardHeader className="space-y-1 bg-primary/5 py-8">
                <CardTitle className="text-3xl font-bold text-center tracking-tight">Créer un compte</CardTitle>
                <CardDescription className="text-center text-base">
                    Rejoignez GECEC Finance dès aujourd'hui
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <FormField
                                control={form.control}
                                name="first_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prénom</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <BadgeCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Jean"
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
                                name="last_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <BadgeCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Dupont"
                                                    className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                                placeholder="utilisateur123"
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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="jean.dupont@exemple.com"
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
                                    <FormLabel>Mot de passe</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
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

                        <Button className="w-full h-12 mt-4 text-base font-semibold transition-all hover:scale-[1.01] shadow-lg shadow-primary/20" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Création en cours..." : "S'inscrire"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-8">
                <p className="text-center text-sm text-muted-foreground">
                    Vous avez déjà un compte ?{" "}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Se connecter
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
