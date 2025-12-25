import client from './client';

// --- 型定義 ---

export interface Quiz {
  id: number;
  category: string;
  question: string;
  options: string[]; // ["選択肢1", "選択肢2"...] という単純な配列
  is_answered: boolean;
}

export interface TodayQuizResponse {
  has_quiz: boolean;
  message?: string;
  quiz?: Quiz;
  is_point_eligible?: boolean;    // ★追加: ポイント獲得可能か
  remaining_point_chances?: number; // ★追加: 残りポイント獲得回数
}

export interface QuizAnswerResponse {
  is_correct: boolean;
  correct_answer_index: number | null;
  explanation: string;
  points_earned: number;          // ★追加: 今回獲得したポイント
  remaining_point_chances: number;
}

// --- API呼び出し関数 ---

export const learningApi = {
  // 本日のクイズ取得
  fetchTodayQuiz: async (classId: number): Promise<TodayQuizResponse> => {
    // タイムアウトを少し長め(10秒)に設定して、サーバーの遅延に備える
    const response = await client.get(`/classes/${classId}/learning/today`, {
      timeout: 10000 
    });
    return response.data;
  },

  // クイズ回答送信
  submitAnswer: async (classId: number, quizId: number, selectedIndex: number): Promise<QuizAnswerResponse> => {
    const response = await client.post(`/classes/${classId}/learning/quiz/answer`, {
      quiz_id: quizId,
      selected_index: selectedIndex,
    }, {
      timeout: 10000 
    });
    return response.data;
  },
};