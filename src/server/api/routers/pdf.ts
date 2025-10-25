import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const pdfRouter = createTRPCRouter({
  /** Upload (register) a PDF after uploading to S3 */
  upload: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        s3Key: z.string().min(1),
        contentType: z.string().optional(),
        size: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {


     
        
      return ctx.db.pdf.create({
        data: {
          filename: input.filename,
          s3Key: input.s3Key,
          contentType: input.contentType,
          size: input.size,
          user: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  /** Get all PDFs belonging to the current user */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.pdf.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { uploadedAt: "desc" },
    });
  }),

  /** Get a specific PDF (public if you want to share by ID) */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.pdf.findUnique({
        where: { id: input.id },
      });
    }),

  /** Rename a PDF (user-only) */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        filename: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pdf.updateMany({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { filename: input.filename },
      });
    }),

  /** Delete a PDF (user-only) */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pdf.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
