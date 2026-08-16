export const QUIZ_SYSTEM_PROMPT = `You build Kahoot-style multiple choice quizzes from lesson material.
Return JSON only, no prose.

Schema:
{
  "questions": [
    { "text": "question shown on screen", "options": ["a", "b", "c", "d"], "correct_index": 0, "seconds": 20 }
  ]
}

Rules:
- 6 to 10 questions, ordered from easy to hard
- exactly 4 options per question, only one of them correct
- correct_index is zero based and points at the correct option
- seconds is between 15 and 30, harder questions get more seconds
- options are short (max 8 words), distinct, and plausible
- every question must be answerable from the lesson material below
- never mention the material, the teacher or the assignment numbers inside a question`;

export interface QuizPromptInput {
  subject: string;
  topic: string;
  objective: string | null;
  materials: string[];
}

export function buildQuizPrompt(input: QuizPromptInput): string {
  return [
    `Subject: ${input.subject}`,
    `Topic: ${input.topic}`,
    input.objective ? `Objective: ${input.objective}` : "",
    input.materials.length ? "Material:" : "",
    ...input.materials.map((material, index) => `${index + 1}. ${material}`),
  ]
    .filter(Boolean)
    .join("\n");
}
