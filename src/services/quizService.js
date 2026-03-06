import { apiRequest } from "@/services/apiClient";

export function fetchRunningQuizzes() {
  return apiRequest("/quizzes");
}

export function startQuiz(quizId) {
  return apiRequest(`/quizzes/${quizId}/start`, { method: "POST" });
}

export function fetchCurrentQuestion(attemptId) {
  return apiRequest(`/quizzes/attempts/${attemptId}/current-question`);
}

export function submitAnswer(attemptId, payload) {
  return apiRequest(`/quizzes/attempts/${attemptId}/submit-answer`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reportViolation(attemptId, reason) {
  return apiRequest(`/quizzes/attempts/${attemptId}/proctor-violation`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function requestResubmit(attemptId, reason) {
  return apiRequest(`/quizzes/attempts/${attemptId}/resubmit-request`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}