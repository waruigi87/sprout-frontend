import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, CheckCircle, XCircle, ArrowRight, Trophy, AlertCircle } from 'lucide-react';
import { AxiosError } from 'axios';

// APIと型定義をインポート
import { learningApi, type Quiz, type QuizAnswerResponse } from '../api/learningApi';

type ScreenState = 'loading' | 'quiz' | 'result' | 'finished';

// --- サブコンポーネント: ポイント獲得表示 ---
const PointResult: React.FC<{ points: number }> = ({ points }) => (
  <div className="mt-4 bg-yellow-100 border-2 border-yellow-400 text-yellow-800 rounded-xl p-4 animate-bounce-short shadow-sm">
    <div className="flex items-center justify-center gap-2 mb-1">
      <Trophy className="w-6 h-6 text-yellow-600" />
      <span className="font-bold text-lg">ポイント獲得！</span>
    </div>
    <p className="text-4xl font-black tracking-wider">+{points} <span className="text-xl">pt</span></p>
  </div>
);

// --- サブコンポーネント: 上限到達表示 ---
const LimitReached: React.FC = () => (
  <div className="mt-4 bg-gray-50 border-2 border-gray-200 text-gray-500 rounded-xl p-4">
    <div className="flex items-center justify-center gap-2 mb-1">
      <AlertCircle className="w-5 h-5" />
      <span className="font-bold text-sm">本日のポイント上限達成済み</span>
    </div>
    <p className="text-xs">（クイズの練習は何度でも行えます）</p>
  </div>
);

export const LearningPage: React.FC = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const currentClassId = Number(classId);
  
  // 初期値を 'loading' に設定
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<QuizAnswerResponse | null>(null);
  const [finishMessage, setFinishMessage] = useState<string>('');

  // --- 1. 初回ロード (useEffect内で完結させる) ---
  useEffect(() => {
    // コンポーネントがアンマウントされたら処理を中断するためのフラグ
    let isMounted = true;

    const initFetch = async () => {
      if (!currentClassId) return;

      try {
        // 初回は useState('loading') が効いているのでローディングセット不要
        const data = await learningApi.fetchTodayQuiz(currentClassId);
        
        if (isMounted) {
          if (data.has_quiz && data.quiz) {
            setQuiz(data.quiz);
            setScreenState('quiz');
          } else {
            setFinishMessage(data.message || '本日のクイズは終了です');
            setScreenState('finished');
          }
        }
      } catch (error) {
        console.error('クイズの取得に失敗しました:', error);
        if (isMounted) {
          if (error instanceof AxiosError && error.response?.status === 401) {
            navigate('/login');
          } else {
            navigate(`/classes/${currentClassId}/dashboard`);
          }
        }
      }
    };

    initFetch();

    // クリーンアップ関数
    return () => { isMounted = false; };
  }, [currentClassId, navigate]);


  // --- 2. 「次の問題へ」ボタンの処理 ---
  const handleNextQuiz = async () => {
    if (!currentClassId) return;

    // ボタンを押した時は明示的にローディングにする
    setScreenState('loading');
    setSelectedIndex(null);
    setAnswerResult(null);
    
    try {
      const data = await learningApi.fetchTodayQuiz(currentClassId);
      
      if (data.has_quiz && data.quiz) {
        setQuiz(data.quiz);
        setScreenState('quiz');
      } else {
        setFinishMessage(data.message || '本日のクイズは終了です');
        setScreenState('finished');
      }
    } catch (error) {
      console.error('クイズの再取得に失敗しました:', error);
      alert('次の問題の取得に失敗しました');
      navigate(`/classes/${currentClassId}/dashboard`);
    }
  };


  // --- 3. 回答の送信 ---
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

  const getOptionLabel = (index: number) => {
    const labels = ['A', 'B', 'C', 'D', 'E'];
    return labels[index] || String(index + 1);
  };

  const handleClose = () => navigate(`/classes/${currentClassId}/dashboard`);

  // --- レンダリング ---
  if (screenState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse font-bold tracking-widest">LOADING...</div>
      </div>
    );
  }

  // 全問終了画面
  if (screenState === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">素晴らしい！</h2>
          <p className="text-gray-600 mb-6">{finishMessage}</p>
          <button
            onClick={handleClose}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg"
          >
            ダッシュボードへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
      {/* クイズ出題画面 */}
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
                    className="hidden"
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

      {/* 結果表示画面 */}
      {screenState === 'result' && answerResult && quiz && (
        <div className="relative w-full max-w-2xl bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-2xl p-6 md:p-12 border border-green-400/30">
          <div className="text-center mb-8">
            {answerResult.is_correct ? (
              <div className="animate-bounce-short">
                <CheckCircle className="w-24 h-24 text-white mx-auto mb-4 drop-shadow-lg" />
                <h2 className="text-white text-4xl md:text-5xl font-bold mb-2">正解！</h2>
                
                {/* ポイント獲得判定 */}
                {answerResult.points_earned > 0 ? (
                  <PointResult points={answerResult.points_earned} />
                ) : (
                  <LimitReached />
                )}
              </div>
            ) : (
              <div className="animate-shake">
                <XCircle className="w-24 h-24 text-red-200 mx-auto mb-4 drop-shadow-lg" />
                <h2 className="text-white text-4xl md:text-5xl font-bold mb-2">残念...</h2>
                <p className="text-green-100 text-lg">不正解のためポイントなし</p>
              </div>
            )}

            <div className="bg-white/95 rounded-2xl p-6 mt-8 text-left shadow-lg">
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

          <div className="flex flex-col gap-3">
            {/* 次の問題へボタン */}
            <button
              onClick={handleNextQuiz}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-2xl text-xl font-bold transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              次の問題へ <ArrowRight />
            </button>

            <button
              onClick={handleClose}
              className="w-full py-3 bg-green-800/50 hover:bg-green-800 text-white rounded-2xl font-bold transition-all"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
};