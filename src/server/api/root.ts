
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { pdfRouter } from "./routers/pdf";
import { chatRouter } from "./routers/chat";
import { quizRouter } from "./routers/quiz";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	pdfs: pdfRouter,
	chat: chatRouter,
	quiz: quizRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
