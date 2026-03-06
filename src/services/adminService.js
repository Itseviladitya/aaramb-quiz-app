import { apiRequest } from "@/services/apiClient";

export function fetchAdminStats() {
  return apiRequest("/admin/stats");
}

export function fetchAdminUsers() {
  return apiRequest("/admin/users");
}

export function deleteUser(userId) {
  return apiRequest("/admin/users", {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });
}

export function setUserBan(userId, isBanned) {
  return apiRequest(`/admin/users/${userId}/ban`, {
    method: "PATCH",
    body: JSON.stringify({ isBanned }),
  });
}

export function disqualifyUser(userId, quizId) {
  return apiRequest(`/admin/users/${userId}/disqualify`, {
    method: "PATCH",
    body: JSON.stringify({ quizId }),
  });
}

export function setUserRole(userId, role) {
  return apiRequest(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function fetchAdminQuizzes() {
  return apiRequest("/admin/quizzes");
}

export function createQuiz(payload) {
  return apiRequest("/admin/quizzes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateQuiz(quizId, payload) {
  return apiRequest(`/admin/quizzes/${quizId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateQuizStatus(quizId, status) {
  return apiRequest(`/admin/quizzes/${quizId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function fetchAdminQuizDetail(quizId) {
  return apiRequest(`/admin/quizzes/${quizId}`);
}

export function deleteQuiz(quizId) {
  return apiRequest(`/admin/quizzes/${quizId}`, {
    method: "DELETE",
  });
}

export function fetchAdminResults() {
  return apiRequest("/admin/results");
}

export function fetchAdminAuditLogs() {
  return apiRequest("/admin/audit-logs");
}

export function fetchAdminResubmitRequests(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.quizId) {
    searchParams.set("quizId", params.quizId);
  }

  const query = searchParams.toString();
  return apiRequest(`/admin/resubmit-requests${query ? `?${query}` : ""}`);
}

export function reviewAdminResubmitRequest(requestId, payload) {
  return apiRequest(`/admin/resubmit-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function resetAttempt(attemptId) {
  return apiRequest(`/admin/attempts/${attemptId}/reset`, {
    method: "DELETE",
  });
}

export function unlockAttempt(attemptId) {
  return apiRequest(`/admin/attempts/${attemptId}/unlock`, {
    method: "PATCH",
  });
}