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
  quiz?: Quiz; 
}

export interface QuizAnswerResponse {
  is_correct: boolean;
  correct_answer_index: number | null; // 不正解時にnullが返る可能性があるためnull許容にする
  explanation: string;
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