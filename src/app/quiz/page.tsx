"use client";

import { cn } from "~/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Heading, Subheading } from "~/components/ui/heading";
import { Strong, Text } from "~/components/ui/text";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useSession } from "~/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { generateQuiz } from "./actions";
import Latex from "react-latex-next";

type Answer = {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

export default function AppPage() {
  const session = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get("id");

  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // single-question state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  // Add this to your existing state
  const [answersHistory, setAnswersHistory] = useState<Answer[]>([]);

  // Fetch quiz if ID exists
  const { data: quiz, isLoading: quizLoading, refetch } = api.quiz.getById.useQuery(
    { id: quizId! },
    { enabled: !!quizId }
  );

  useEffect(() => {
    // reset quiz UI when a new quiz is loaded
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setIsAnswered(false);
    setFinished(false);
  }, [quizId, quiz?.id]);

  const total = quiz?.questions?.length ?? 0;
  const currentQuestion = quiz?.questions?.[currentIndex];

  const progressPercent = useMemo(() => {
    if (!total) return 0;
    return Math.round(((currentIndex + (finished ? 1 : 0)) / total) * 100);
  }, [currentIndex, total, finished]);

  const handleGenerateQuiz = async () => {
    if (!topic) return;

    setIsLoading(true);
    try {
      const newQuiz = await generateQuiz(topic);
      // generateQuiz is a server action that should return saved quiz with id
      router.push(`/quiz?id=${newQuiz.id}`);
      // wait for router to navigate — nothing else needed here
    } catch (error) {
      console.error("Failed to generate quiz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!currentQuestion || selected == null || isAnswered) return;

    const correct = selected === currentQuestion.correctAnswer;
    if (correct) setScore((s) => s + 1);

    // Save the answer to history
    setAnswersHistory((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        userAnswer: selected,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: correct,
      },
    ]);

    setIsAnswered(true);

    // move to next automatically after short delay
    setTimeout(() => {
      if (currentIndex < total - 1) {
        setCurrentIndex((i) => i + 1);
        setSelected(null);
        setIsAnswered(false);
      } else {
        setFinished(true);
      }
    }, 900);
  };

  const finalGrade0to10 = useMemo(() => {
    if (!total) return 0;
    return Math.round((score / total) * 10);
  }, [score, total]);

  if (!quizId) {
    return (
      <div className="container mx-auto p-4">
        <Heading>Quizy</Heading>

        <div className="mt-8">
          <Subheading>Generuj quiz</Subheading>
          <div className="flex gap-4 mt-4">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter quiz topic..."
              disabled={isLoading}
            />
            <Button onClick={handleGenerateQuiz} disabled={isLoading || !topic}>
              {isLoading ? "Generating..." : "Generate Quiz"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // quizId exists: show quiz UI
  return (
    <div className="container mx-auto p-4">
      <Heading>Quizy</Heading>

      <div className="mt-8">
        {quizLoading ? (
          <Text>Loading quiz...</Text>
        ) : !quiz ? (
          <Text>Quiz not found.</Text>
        ) : (
          <>
            <div className="mb-4">
              <Subheading>{quiz.title}</Subheading>
              <div className="mt-2 text-sm text-white">
                Pytanie {Math.min(currentIndex + 1, total)} / {total}
              </div>

              {/* progress bar */}
              <div className="w-full bg-neutral-800 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-green-500 h-2 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {!finished ? (
              currentQuestion ? (
                <div className="text-white">
                  <div className="mb-6">
                    <Latex strict>{currentQuestion.question}</Latex>
                  </div>

                  <div className="grid gap-3">
                    {/* @ts-ignore */}
                    {currentQuestion.answers?.map((answer: string, i: number) => {
                      const isSelected = selected === answer;
                      const showCorrect =
                        isAnswered && answer === currentQuestion.correctAnswer;
                      const showIncorrect =
                        isAnswered && isSelected && answer !== currentQuestion.correctAnswer;

                      return (
                        <label
                          key={i}
                          className={`block p-3 rounded border cursor-pointer ${
                            isSelected ? "border-blue-500 bg-neutral-900" : "border-neutral-700"
                          } ${showCorrect ? "bg-green-700/40 border-green-500" : ""} ${
                            showIncorrect ? "bg-red-700/40 border-red-500" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${currentIndex}`}
                            value={answer}
                            className="mr-2"
                            checked={isSelected}
                            onChange={() => setSelected(answer)}
                            disabled={isAnswered}
                          />
                          <Latex>{answer}</Latex>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button onClick={handleConfirm} disabled={!selected || isAnswered}>
                      Potwierdz
                    </Button>
                    <Button
                      plain
                      onClick={() => {
                        // skip question
                        if (currentIndex < total - 1) {
                          setCurrentIndex((i) => i + 1);
                          setSelected(null);
                          setIsAnswered(false);
                        } else {
                          setFinished(true);
                        }
                      }}
                    >
                      Pomin
                    </Button>
                  </div>
                </div>
              ) : (
                <Text>Brak pytan</Text>
              )
            ) : (
              <div className="text-center text-white">
                <Subheading>Quiz skonczony</Subheading>
                <div className="mt-4 text-2xl text-white">
                  Wynik: {score} / {total}
                </div>

                <div className="flex justify-center gap-3 mt-6">
                  <Button
                    onClick={() => {
                      // restart same quiz
                      setCurrentIndex(0);
                      setSelected(null);
                      setScore(0);
                      setIsAnswered(false);
                      setFinished(false);
                    }}
                  >
                    Ponow
                  </Button>
                  <Button
                    plain
                    onClick={() => {
                      router.push("/");
                    }}
                  >
                    Wroc
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {finished && (
        <div className="mt-8">
          <Subheading>Twoje odpowiedzi</Subheading>
          <div className="space-y-6 mt-4">
            {answersHistory.map((answer, i) => (
              <div
                key={i}
                className={cn(
                  "p-4 rounded-lg",
                  answer.isCorrect ? "bg-green-950/20" : "bg-red-950/20"
                )}
              >
                <div className="font-medium mb-2 text-white">
                  <Latex strict>{answer.question}</Latex>
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-neutral-400">Twoja odpowiedz</div>
                  <div className={answer.isCorrect ? "text-green-400" : "text-red-400"}>
                    <Latex>{answer.userAnswer}</Latex>
                  </div>
                  {!answer.isCorrect && (
                    <>
                      <div className="text-neutral-400 mt-2">Poprawna odpowiedz</div>
                      <div className="text-green-400">
                        <Latex>{answer.correctAnswer}</Latex>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}