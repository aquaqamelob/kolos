import { signIn } from "~/lib/auth-client";

export const signInGoogle = async () => {
  const data = await signIn.social({
    provider: "google",
    // newUserCallbackURL: "http://localhost:3000/",
    // callbackURL: "http://localhost:3000/"
    newUserCallbackURL: "https://kolos-eosin.vercel.app",
    callbackURL: "https://kolos-eosin.vercel.app"

    
  });
  return data;
};