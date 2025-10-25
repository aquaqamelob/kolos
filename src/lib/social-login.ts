import { signIn } from "~/lib/auth-client";

export const signInGoogle = async () => {
  const data = await signIn.social({
    provider: "google",
    newUserCallbackURL: "http://localhost:3000/",
    callbackURL: "http://localhost:3000/"
  });
  return data;
};