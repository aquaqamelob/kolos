'use server';

import Instructor from '@instructor-ai/instructor';
import OpenAI from 'openai';
import { z } from 'zod';
import { getSession } from '~/server/auth';
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
    question: z.string().describe('a question'),
    answers: z
      .array(z.string())
      .length(4)
      .describe('4 answers to the questions with only one correct'),
    correctAnswer: z.string().describe('one correct answer'),
  });

  const QuizSchema = z.object({
    title: z.string().describe('Quiz title'),
    questions: z
      .array(QuestionSchema)
      .min(10)
      .describe('logical questions to the user prompt'),
  });

  const quiz = await client.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: `Youre a proffesional quiz maker your job is to create a quiz about ${topic}, your job is to RESPOND IN JSON ONLY!`,
      },
    ],
    model: 'openai/gpt-oss-120b',
    response_model: {
      schema: QuizSchema,
      name: 'Quiz',
    },
  });

  return quiz;
};



export const getChatResponse = async (messages: { role: 'user' | 'assistant'; content: string }[]) => {
  const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  const session = getSession();

  const context = await ragAnswer(
    messages.find((msg) => msg.role === 'user')?.content || '',
    (await session)?.user?.id || 'guest'
  );

  console.log('Retrieved context:', context);

  const newMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    ...(context
      ? [
          {
            role: 'system',
            content: `You are a helpful assistant. Use the following context to answer the question as accurately as possible:\n\n${context}`,
          } as const,
        ]
      : []),
    ...messages,
  ];
  

  const response = await openai.chat.completions.create({
    
    model: 'openai/gpt-oss-120b',
    messages: newMessages,
    max_tokens: 1000,
  });

  return response.choices[0]!.message?.content || '';
};