export interface ExerciseItem {
  prompt: string;
  answer: string;
  hint: string;
}

export interface ExercisePayload {
  title: string;
  instruction: string;
  items: ExerciseItem[];
}

export interface ExerciseVerdict {
  index: number;
  correct: boolean;
  expected: string;
  comment: string;
}

export interface ExerciseResult {
  call_id: string;
  title: string;
  total: number;
  correct: number;
  percent: number;
  items: ExerciseVerdict[];
}
