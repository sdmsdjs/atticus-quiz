export enum QuestionType {
  MultipleChoice = 'Multiple Choice',
  Checkbox = 'Checkbox',
  FillInTheBlank = 'Fill-in-the-Blank',
  OpenEnded = 'Open-Ended',
  Poll = 'Poll',
  Draw = 'Draw',
}

export interface Question {
  questionText: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  timeInSeconds: number;
  imageLink: string;
  answerExplanation: string;
  sourceFile?: string;
  exportGroup?: string;
  isSolving?: boolean;
  isSolved?: boolean;
}

export interface ParsedQuestion {
    questionText: string;
    options: string[];
    questionType: QuestionType;
}
