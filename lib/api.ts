const API_BASE = '/api/v1'

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  auth: {
    session: (nimiqAddress: string) =>
      fetchApi('/auth/session', { method: 'POST', body: JSON.stringify({ nimiqAddress }) }),
  },

  rounds: {
    list: (status?: string) =>
      fetchApi(`/rounds${status ? `?status=${status}` : ''}`),
    create: (data: any, sessionToken: string) =>
      fetchApi('/rounds', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(data),
      }),
    get: (id: string, sessionToken?: string) =>
      fetchApi(`/rounds/${id}`, {
        headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
      }),
    delete: (id: string, sessionToken: string) =>
      fetchApi(`/rounds/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }),
    joinIntent: (id: string, sessionToken: string) =>
      fetchApi(`/rounds/${id}/join-intent`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }),
    joinConfirm: (id: string, txHash: string, sessionToken: string) =>
      fetchApi(`/rounds/${id}/join-confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ txHash }),
      }),
    start: (id: string, sessionToken: string) =>
      fetchApi(`/rounds/${id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }),
    cancel: (id: string, sessionToken: string) =>
      fetchApi(`/rounds/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }),
    currentQuestion: (id: string, sessionToken: string) =>
      fetchApi(`/rounds/${id}/questions/current`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      }),
    submitAnswer: (id: string, questionId: string, selectedOptionIndex: number, sessionToken: string) =>
      fetchApi(`/rounds/${id}/answers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ questionId, selectedOptionIndex }),
      }),
    leaderboard: (id: string) =>
      fetchApi(`/rounds/${id}/leaderboard`),
    finish: (id: string, sessionToken: string) =>
      fetchApi(`/rounds/${id}/finish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }),
    payoutIntent: (id: string, sessionToken: string) =>
      fetchApi(`/rounds/${id}/payout/intent`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }),
    payoutConfirm: (id: string, payouts: Array<{ payoutId: string; txHash: string }>, sessionToken: string) =>
      fetchApi(`/rounds/${id}/payout/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ payouts }),
      }),
  },

  notifications: {
    list: (sessionToken: string) =>
      fetchApi('/notifications', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      }),
    markAllRead: (sessionToken: string) =>
      fetchApi('/notifications', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }),
  },
}