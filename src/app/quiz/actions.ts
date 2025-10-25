'use server';

import Instructor from '@instructor-ai/instructor';
import OpenAI from 'openai';
import { z } from 'zod';
import { getSession } from '~/server/auth';
import { api } from "~/trpc/server";
import { ragAnswer } from '../files/actions';


export const generateQuiz = async (topic: string) => {
  const client = Instructor({
    client: new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    }),
    mode: 'MD_JSON',
  });

  const QuestionSchema = z.object({
    question: z.string().describe('Pytanie do quizu'),
    answers: z
      .array(z.string())
      .length(4)
      .describe('4 możliwe odpowiedzi, tylko jedna poprawna'),
    correctAnswer: z.string().describe('Jedna poprawna odpowiedź'),
  });

  const QuizSchema = z.object({
    title: z.string().describe('Tytuł quizu'),
    questions: z
      .array(QuestionSchema)
      .min(10)
      .describe('Logiczne pytania na podstawie tematu podanego przez użytkownika'),
  });

  const session = getSession();
  
    const context = await ragAnswer(
      topic,
      (await session)?.user?.id || 'guest'
    );

  const quiz = await client.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: `Jesteś profesjonalnym twórcą quizów. Twoim zadaniem jest stworzyć quiz na temat ${topic}. Odpowiedz WYŁĄCZNIE W FORMIE JSON! to twoj kontekst ${context}`,
      },
    ],
    model: 'openai/gpt-oss-120b',
    response_model: {
      schema: QuizSchema,
      name: 'Quiz',
    },
  });

  const savedQuiz = api.quiz.create({
    title: topic,
    questions: quiz.questions,
  });

  return savedQuiz;
};
