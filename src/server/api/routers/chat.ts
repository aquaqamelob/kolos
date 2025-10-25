import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

/**
 * Chat router
 * - createChat: create chat (optional initial message)
 * - getAll: user's chats with messages
 * - getById: a single chat (user-only)
 * - addMessage: append a message to a chat (user-only)
 * - delete: delete a chat (user-only)
 */
export const chatRouter = createTRPCRouter({
  createChat: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        initialMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: any = {
        user: { connect: { id: ctx.session.user.id } },
      };
      if (input.title) data.title = input.title;
      if (input.initialMessage) {
        data.messages = {
          create: [{ role: "user", content: input.initialMessage }],
        };
      }
      return ctx.db.chat.create({
        data,
        include: { messages: true },
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.chat.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.chat.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }),

  addMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        meta: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ensure chat belongs to user
      const owned = await ctx.db.chat.findUnique({
        where: { id: input.chatId },
        select: { userId: true },
      });
      if (!owned || owned.userId !== ctx.session.user.id) {
        throw new Error("Not authorized to add message to this chat");
      }

      return ctx.db.message.create({
        data: {
          chat: { connect: { id: input.chatId } },
          role: input.role,
          content: input.content,
          meta: input.meta ?? null,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chat.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});