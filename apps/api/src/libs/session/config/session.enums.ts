export enum MessageSender {
  STUDENT = "STUDENT",
  HAMROH = "HAMROH",
  TOOL = "TOOL",
}

export enum SessionState {
  IDLE = "IDLE",
  LISTENING = "LISTENING",
  THINKING = "THINKING",
  SPEAKING = "SPEAKING",
}

export enum SessionFocusKind {
  LESSON = "LESSON",
  QUIZ = "QUIZ",
}

export enum PanelCardType {
  RESULTS = "RESULTS",
  MISTAKES = "MISTAKES",
  EXERCISE = "EXERCISE",
  SPEAKING_REVIEW = "SPEAKING_REVIEW",
  STUDY_PLAN = "STUDY_PLAN",
}
