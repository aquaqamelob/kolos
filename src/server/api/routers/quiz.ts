import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

/**
 * Quiz schemas (client / AI validation)
 */
const QuestionSchema = z.object({
  question: z.string().min(1),
  answers: z.array(z.string()).length(4),
  correctAnswer: z.string().min(1),
});

const QuizSchema = z.object({
  title: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});

/**
 * Quiz router
 * - create: create quiz (validated)
 * - getAll: user's quizzes
 * - getById: quiz with questions
 * - update: simple update title (and optional full questions replace)
 * - delete: delete quiz (user-only)
 */
export const quizRouter = createTRPCRouter({
  create: protectedProcedure.input(QuizSchema).mutation(async ({ ctx, input }) => {
    const quiz = await ctx.db.quiz.create({
      data: {
        title: input.title,
        user: { connect: { id: ctx.session.user.id } },
        questions: {
          create: input.questions.map((q, i) => ({
            idx: i,
            question: q.question,
            answers: q.answers as any, // Prisma Json
            correctAnswer: q.correctAnswer,
          })),
        },
      },
      include: { questions: true },
    });
    return quiz;
  }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.quiz.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { questions: { orderBy: { idx: "asc" } } },
    });
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.quiz.findFirst({
      where: { id: input.id, userId: ctx.session.user.id },
      include: { questions: { orderBy: { idx: "asc" } } },
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        // optional full questions replacement (client must send full validated array)
        questions: z.array(QuestionSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ensure ownership
      const owned = await ctx.db.quiz.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });
      if (!owned || owned.userId !== ctx.session.user.id) {
        throw new Error("Not authorized to update this quiz");
      }

      // update title if present
      if (input.questions) {
        // delete existing questions and recreate (simple approach)
        await ctx.db.quizQuestion.deleteMany({ where: { quizId: input.id } });
        await ctx.db.quiz.update({
          where: { id: input.id },
          data: {
            title: input.title,
            questions: {
              create: input.questions.map((q, i) => ({
                idx: i,
                question: q.question,
                answers: q.answers as any,
                correctAnswer: q.correctAnswer,
              })),
            },
          },
        });
        return ctx.db.quiz.findUnique({
          where: { id: input.id },
          include: { questions: { orderBy: { idx: "asc" } } },
        });
      } else {
        return ctx.db.quiz.update({
          where: { id: input.id },
          data: { title: input.title ?? undefined },
          include: { questions: { orderBy: { idx: "asc" } } },
        });
      }
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.quiz.deleteMany({
      where: { id: input.id, userId: ctx.session.user.id },
    });
  }),
});