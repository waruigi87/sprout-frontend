import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, CheckCircle, XCircle } from 'lucide-react'; // アイコン追加
import { AxiosError } from 'axios';

// APIと型定義をインポート
import { learningApi, type Quiz, type QuizAnswerResponse } from '../api/learningApi';

type ScreenState = 'loading' | 'quiz' | 'result';

export const LearningPage: React.FC = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const currentClassId = Number(classId);
  
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<QuizAnswerResponse | null>(null);

  // --- 1. クイズデータの取得 ---
  useEffect(() => {
    const fetchTodayQuiz = async () => {
      if (!currentClassId) return;

      try {
        const data = await learningApi.fetchTodayQuiz(currentClassId);
        
        if (data.has_quiz && data.quiz) {
          if (data.quiz.is_answered) {
            // 回答済みの場合の処理（必要に応じて変更してください）
            alert('今日のクイズは既に回答済みです');
            navigate(`/classes/${currentClassId}/dashboard`);
          } else {
            setQuiz(data.quiz);
            setScreenState('quiz');
          }
        } else {
          alert('今日のクイズはありません。また明日！');
          navigate(`/classes/${currentClassId}/dashboard`);
        }
      } catch (error) {
        console.error('クイズの取得に失敗しました:', error);
        
        if (error instanceof AxiosError) {
          if (error.response?.status === 401) {
            navigate('/login');
            return;
          }
          if (error.code === 'ECONNABORTED') {
             alert('通信がタイムアウトしました。インターネット環境を確認して再読み込みしてください。');
             navigate(`/classes/${currentClassId}/dashboard`);
             return;
          }
        }

        alert('クイズデータの取得に失敗しました');
        navigate(`/classes/${currentClassId}/dashboard`);
      }
    };

    fetchTodayQuiz();
  }, [currentClassId, navigate]);

  // --- 2. 回答の送信 ---
  const handleAnswerSubmit = async () => {
    if (selectedIndex === null || !quiz || !currentClassId) {
      alert('選択肢を選んでください');
      return;
    }

    try {
      const result = await learningApi.submitAnswer(
        currentClassId,
        quiz.id,
        selectedIndex
      );
      
      setAnswerResult(result);
      setScreenState('result');
    } catch (error) {
      console.error('回答の送信に失敗しました:', error);
      alert('回答の送信に失敗しました。もう一度お試しください。');
    }
  };

  // --- UIヘルパー: アルファベットの取得 ---
  const getOptionLabel = (index: number) => {
    const labels = ['A', 'B', 'C', 'D', 'E'];
    return labels[index] || String(index + 1);
  };

  // --- ナビゲーション ---
  const handleClose = () => navigate(`/classes/${currentClassId}/dashboard`);

  // --- レンダリング ---
  if (screenState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse font-bold tracking-widest">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
      {screenState === 'quiz' && quiz && (
        <div className="relative w-full max-w-2xl bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-2xl p-6 md:p-12 border border-green-400/30">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 bg-green-800/50 hover:bg-green-800 rounded-full flex items-center justify-center transition-colors text-white"
          >
            <X size={24} />
          </button>

          <div className="mb-8">
            <div className="mb-4 inline-block bg-white/20 px-3 py-1 rounded-full text-white text-sm font-medium">
              {quiz.category || 'クイズ'}
            </div>
            <h2 className="text-white text-xl md:text-3xl font-bold mb-8 leading-relaxed">
              {quiz.question}
            </h2>

            <div className="space-y-4">
              {quiz.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center gap-4 p-4 bg-white/95 hover:bg-white rounded-2xl cursor-pointer transition-all shadow-sm ${
                    selectedIndex === index ? 'ring-4 ring-yellow-400 transform scale-[1.02]' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                     selectedIndex === index ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {getOptionLabel(index)}
                  </div>
                  <input
                    type="radio"
                    name="quiz-option"
                    value={index}
                    checked={selectedIndex === index}
                    onChange={() => setSelectedIndex(index)}
                    className="hidden" // デフォルトのラジオボタンは隠す
                  />
                  <span className="text-gray-800 text-lg font-medium flex-1">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnswerSubmit}
            disabled={selectedIndex === null}
            className={`w-full py-4 rounded-2xl text-white text-xl font-bold transition-all shadow-lg ${
              selectedIndex === null
                ? 'bg-gray-400/50 cursor-not-allowed'
                : 'bg-green-800 hover:bg-green-900 active:scale-95'
            }`}
          >
            回答する
          </button>
        </div>
      )}

      {screenState === 'result' && answerResult && quiz && (
        <div className="relative w-full max-w-2xl bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-2xl p-6 md:p-12 border border-green-400/30">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 bg-green-800/50 hover:bg-green-800 rounded-full flex items-center justify-center transition-colors text-white"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-8">
            {answerResult.is_correct ? (
              <div className="animate-bounce-short">
                <CheckCircle className="w-24 h-24 text-white mx-auto mb-4 drop-shadow-lg" />
                <h2 className="text-white text-4xl md:text-5xl font-bold mb-2">正解！</h2>
                <p className="text-green-100 text-lg">素晴らしい知識です！</p>
              </div>
            ) : (
              <div className="animate-shake">
                <XCircle className="w-24 h-24 text-red-200 mx-auto mb-4 drop-shadow-lg" />
                <h2 className="text-white text-4xl md:text-5xl font-bold mb-2">残念...</h2>
                <p className="text-green-100 text-lg">次は頑張ろう！</p>
              </div>
            )}

            <div className="bg-white/95 rounded-2xl p-6 mt-8 text-left shadow-lg">
              {/* 正解の表示: indexがnullでない場合のみ表示 */}
              {answerResult.correct_answer_index !== null && (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <p className="text-gray-500 text-sm font-bold mb-1">正解</p>
                  <div className="flex items-center gap-2 text-green-700 font-bold text-xl">
                    <span className="bg-green-100 px-2 py-0.5 rounded text-base">
                      {getOptionLabel(answerResult.correct_answer_index)}
                    </span>
                    {quiz.options[answerResult.correct_answer_index]}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-gray-500 text-sm font-bold mb-1">解説</p>
                <p className="text-gray-700 text-base leading-relaxed">
                  {answerResult.explanation}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-4 bg-green-800 hover:bg-green-900 rounded-2xl text-white text-xl font-bold transition-all active:scale-95 shadow-lg"
          >
            ダッシュボードに戻る
          </button>
        </div>
      )}
    </div>
  );
};