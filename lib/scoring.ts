export function computeLeaderboard(entriesWithAnswers: any[]) {
  return entriesWithAnswers.map(entry => {
    const correctCount = entry.answers.filter((a: any) => a.isCorrect).length
    const totalTime = entry.answers.reduce((sum: number, a: any) => sum + a.responseTimeMs, 0)
    return {
      playerId: entry.playerId,
      player: entry.player,
      correctCount,
      totalTime,
    }
  }).sort((a, b) => {
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount
    return a.totalTime - b.totalTime
  })
}

export function determineWinners(leaderboard: any[], payoutRule: string) {
  if (payoutRule === 'WINNER_TAKE_ALL') {
    const topScore = leaderboard[0]?.correctCount || 0
    return leaderboard.filter(p => p.correctCount === topScore)
  }
  return leaderboard.slice(0, 3)
}

export function computePayouts(winners: any[], pot: number, payoutRule: string) {
  if (payoutRule === 'WINNER_TAKE_ALL') {
    const share = pot / winners.length
    return winners.map(w => ({ recipientId: w.playerId, amount: share }))
  }

  const weights = [0.5, 0.3, 0.2]
  const totalWeight = winners.reduce((sum, _, i) => sum + (weights[i] || 0), 0)

  return winners.map((w, i) => ({
    recipientId: w.playerId,
    amount: Math.round((pot * (weights[i] || 0) / totalWeight) * 100) / 100,
  }))
}
