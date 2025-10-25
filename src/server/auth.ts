import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { cache } from "react";
import { nextCookies } from "better-auth/next-js";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),



    plugins: [nextCookies()],
    socialProviders: {
        
        google: {
            prompt: "select_account",
            clientId: process.env.AUTH_GOOGLE_ID as string,
            clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
        },
    },

});



export const getSession = cache(async () => {
    return await auth.api.getSession({
      headers: await headers()
    })
  })

export const signOut = async () => {
    return await auth.api.signOut({
        headers: await headers()
    })
}

export const signIn = async () => {
    return await auth.api.signInSocial({body: {
        provider: "google",
        newUserCallbackURL: "https://kolos-eosin.vercel.app",

        callbackURL: "https://kolos-eosin.vercel.app"

        // newUserCallbackURL: "http://localhost:3000/",

        // callbackURL: "http://localhost:3000"
    }})
}
