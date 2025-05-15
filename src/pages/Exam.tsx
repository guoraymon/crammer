import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBar from '../components/StatusBar'; // 确保路径正确
import dataCsv from '../../static/data.csv?raw';

// 复用接口和帮助函数
interface Question {
    no: number;
    type: 'single' | 'multiple' | 'judge';
    title: string;
    options: string[];
    answer: string[];
}

const typeMap = {
    '单选题': 'single',
    '多选题': 'multiple',
    '判断题': 'judge',
} as const;

const optionChars = ['A', 'B', 'C', 'D'];

// 复用 Fisher-Yates (Knuth) 洗牌算法
function shuffleArray<T>(array: T[]): T[] {
    const shuffledArray = [...array]; // 创建一个副本
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // 交换
    }
    return shuffledArray;
}

// 复用数组内容比较函数（忽略顺序）
const areArraysEqualIgnoringOrder = (arr1: string[], arr2: string[]): boolean => {
    if (arr1.length !== arr2.length) {
        return false;
    }
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();
    return sortedArr1.every((value, index) => value === sortedArr2[index]);
};


const Exam: React.FC = () => {
    const navigate = useNavigate();

    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [examQuestions, setExamQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string[]>([]);
    const [userAnswers, setUserAnswers] = useState<string[][]>([]);
    const [isExamFinished, setIsExamFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [insufficientWarning, setInsufficientWarning] = useState<string | null>(null);


    useEffect(() => {
        const lines = dataCsv.trim().split('\n');
        const parsedList: Question[] = lines.slice(1).map(line => {
            const values = line.split(',');
            const no = Number(values[0]) || 0;
            const type = (values[1] in typeMap ? typeMap[values[1] as keyof typeof typeMap] : 'single') as Question['type'];
            const title = values[2] || '无标题';
            const options = [values[3], values[4], values[5], values[6]]
                .filter(Boolean)
                .map((opt, i) => `${optionChars[i]}. ${opt.trim()}`);
            const answer = values[7] ? values[7].trim().split('') : [];
            if (!title || answer.length === 0 || options.length === 0) return null;
            return { no, type, title, options, answer };
        }).filter((q): q is Question => q !== null);


        // 过滤按类型分类
        const singleChoice = parsedList.filter(q => q.type === 'single');
        const multipleChoice = parsedList.filter(q => q.type === 'multiple');
        const judge = parsedList.filter(q => q.type === 'judge');

        // 需要的题目数量
        const requiredSingle = 70;
        const requiredMultiple = 10;
        const requiredJudge = 20;
        // const totalRequired = requiredSingle + requiredMultiple + requiredJudge; // 这个变量实际没用到，可以移除


        // --- 修改这里的逻辑，先抽取并打乱每种类型内部的题目 ---
        const selectedSingle = shuffleArray(singleChoice).slice(0, requiredSingle);
        const selectedJudge = shuffleArray(judge).slice(0, requiredJudge); // <-- 先处理判断题
        const selectedMultiple = shuffleArray(multipleChoice).slice(0, requiredMultiple); // <-- 再处理多选题
        // --- 抽取并打乱每种类型内部的题目结束 ---


        // 检查题目数量是否足够（这部分逻辑不变）
        let warningMessage = '';
        if (selectedSingle.length < requiredSingle) {
            warningMessage += `单选题数量不足，仅选取 ${selectedSingle.length} 道。`;
        }
        if (selectedJudge.length < requiredJudge) { // 检查判断题
            warningMessage += ` 判断题数量不足，仅选取 ${selectedJudge.length} 道。`;
        }
        if (selectedMultiple.length < requiredMultiple) { // 检查多选题
            warningMessage += ` 多选题数量不足，仅选取 ${selectedMultiple.length} 道。`;
        }
        setInsufficientWarning(warningMessage || null);


        // --- 按照指定的顺序合并题目列表 ---
        // 顺序为：70单选, 20判断, 10多选
        const finalExamList = [
            ...selectedSingle, // 先是随机抽取的单选题 (70道)
            ...selectedJudge,    // 接着是随机抽取的判断题 (20道)
            ...selectedMultiple, // 最后是随机抽取的多选题 (10道)
        ];
        // --- 合并结束，不再对 finalExamList 进行整体打乱，以保持类型顺序 ---


        setAllQuestions(parsedList);
        setExamQuestions(finalExamList); // 直接使用这个已按照题型排序好的列表
        setUserAnswers(new Array(finalExamList.length).fill(null));

        // 重置考试状态
        setCurrentIndex(0);
        setSelectedAnswer([]);
        setIsExamFinished(false);
        setScore(0);

    }, [dataCsv]); // 依赖 dataCsv


    // rest of the component remains the same (handleOptionClick, handleNextQuestion, useEffect for scoring, handleGoBack, getOptionClasses, render logic)
    // ... (以下部分代码与你提供的最新版本一致，无需修改)

    const currentQuestion = examQuestions[currentIndex];
    const totalQuestions = examQuestions.length;

    const handleOptionClick = useCallback((index: number) => {
        if (isExamFinished || !currentQuestion) return;
        const clickedOptionChar = optionChars[index];
        if (currentQuestion.type === 'single' || currentQuestion.type === 'judge') {
            setSelectedAnswer([clickedOptionChar]);
        } else if (currentQuestion.type === 'multiple') {
            setSelectedAnswer(prevSelected =>
                prevSelected.includes(clickedOptionChar)
                    ? prevSelected.filter(char => char !== clickedOptionChar)
                    : [...prevSelected, clickedOptionChar]
            );
        }
    }, [currentQuestion, isExamFinished]);

    const handleNextQuestion = useCallback(() => {
        if (!currentQuestion) return;
        const updatedUserAnswers = [...userAnswers];
        updatedUserAnswers[currentIndex] = selectedAnswer;
        setUserAnswers(updatedUserAnswers);

        if (currentIndex >= totalQuestions - 1) {
            setIsExamFinished(true);
        } else {
            setCurrentIndex(prevIndex => prevIndex + 1);
            setSelectedAnswer([]);
        }
    }, [currentIndex, selectedAnswer, userAnswers, totalQuestions, currentQuestion]);

    useEffect(() => {
        if (isExamFinished && examQuestions.length > 0) {
            let calculatedScore = 0;
            // let correctCount = 0; // 不再需要 state 存储，直接在结果渲染时计算
            examQuestions.forEach((question, index) => {
                const userAnswer = userAnswers[index] || [];
                const correctAnswer = question.answer;
                let isAnswerCorrect = false;
                if (question.type === 'single' || question.type === 'judge') {
                    isAnswerCorrect = userAnswer.length === 1 && userAnswer[0] === correctAnswer[0];
                } else if (question.type === 'multiple') {
                    isAnswerCorrect = areArraysEqualIgnoringOrder(userAnswer, correctAnswer);
                }
                if (isAnswerCorrect) {
                    calculatedScore += 1;
                    // correctCount += 1;
                }
            });
            setScore(calculatedScore);
        }
    }, [isExamFinished, examQuestions, userAnswers, totalQuestions]);


    const handleGoBack = () => {
        if (!isExamFinished && currentIndex > 0) {
            if (!window.confirm('您确定要退出考试吗？退出将不会保存进度。')) {
                return;
            }
        }
        navigate('/');
    };

    const getOptionClasses = useCallback((index: number) => {
        const optionChar = optionChars[index];
        const isSelected = selectedAnswer.includes(optionChar);
        let classes = "block w-full p-3 mb-3 border rounded-lg transition-colors duration-200 text-left cursor-pointer";
        if (isSelected) {
            classes += " bg-blue-100 border-blue-400 text-blue-800 font-medium";
        } else {
            classes += " border-gray-300 text-gray-800 hover:bg-gray-100 active:bg-gray-200";
        }
        if (isExamFinished) {
            classes += " cursor-default pointer-events-none";
        }
        return classes;
    }, [selectedAnswer, isExamFinished]);


    // 渲染逻辑（与你提供的最新版本一致）

    if (examQuestions.length === 0 && !isExamFinished) {
        return (
            <>
                <StatusBar onBack={handleGoBack} title="模拟考试" />
                <div className="container mx-auto p-4 sm:p-6 mt-8 sm:mt-12 max-w-md text-center">
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h1 className="text-xl font-semibold mb-4">正在组卷...</h1>
                        {allQuestions.length > 0 && <p className="mt-4 text-sm text-gray-600">已加载 {allQuestions.length} 道原始题目。</p>}
                        <p className="mt-2 text-sm text-gray-500">
                            (需要 70 单选, 10 多选, 20 判断)
                        </p>
                        {insufficientWarning && (
                            <p className="mt-4 text-sm text-red-600 font-semibold">{insufficientWarning}</p>
                        )}
                    </div>
                </div>
            </>
        );
    }

    if (isExamFinished) {
        const correctCountFinal = userAnswers.filter((ans, i) => {
            const question = examQuestions[i];
            if (!question) return false;
            if (question.type === 'single' || question.type === 'judge') {
                return ans?.length === 1 && ans[0] === question.answer[0];
            } else if (question.type === 'multiple') {
                return areArraysEqualIgnoringOrder(ans || [], question.answer);
            }
            return false;
        }).length;
        const incorrectCountFinal = totalQuestions - correctCountFinal;

        return (
            <>
                <StatusBar onBack={handleGoBack} title="考试结果" />
                <div className="container mx-auto p-4 sm:p-6 mt-8 sm:mt-12 max-w-md text-center">
                    <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
                        <h1 className="text-2xl font-bold mb-4">考试完成!</h1>
                        <p className="text-xl font-semibold text-green-600 mb-4">
                            您的得分: {score} / {totalQuestions} 分
                        </p>
                        <p className="text-lg mb-4 sm:mb-6">
                            总共题目: {totalQuestions}<br />
                            答对: <span className="text-green-600 font-bold">{correctCountFinal}</span><br />
                            答错: <span className="text-red-600 font-bold">{incorrectCountFinal}</span>
                        </p>
                        {insufficientWarning && (
                            <p className="mt-4 text-sm text-red-600 font-semibold">{insufficientWarning}</p>
                        )}
                        <button
                            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mt-4"
                            onClick={() => navigate('/')}
                        >
                            返回主页
                        </button>
                        <button
                            className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors mt-2"
                            onClick={() => navigate('/exam')}
                        >
                            重新考试
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (!currentQuestion) {
        return (
            <>
                <StatusBar onBack={handleGoBack} title="模拟考试" />
                <div className="container mx-auto p-4 sm:p-6 mt-8 sm:mt-12 max-w-md text-center">
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <p className="text-red-600 font-semibold">加载题目出错或题目列表为空。</p>
                        {insufficientWarning && (
                            <p className="mt-4 text-sm text-red-600">{insufficientWarning}</p>
                        )}
                        <button
                            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mt-4"
                            onClick={() => navigate('/')}
                        >
                            返回主页
                        </button>
                    </div>
                </div>
            </>
        );
    }


    return (
        <>
            <StatusBar onBack={handleGoBack} title={`模拟考试 (${currentIndex + 1}/${totalQuestions})`} />
            <div className="container mx-auto p-4 sm:p-6 mt-8 sm:mt-12 max-w-2xl">
                <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
                    <div className="text-sm text-gray-500 mb-3">
                        题目 {currentIndex + 1} / {totalQuestions} ({currentQuestion.type === 'single' ? '单选' : currentQuestion.type === 'multiple' ? '多选' : '判断'})
                    </div>

                    <h1 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 leading-snug">
                        {currentQuestion.title}
                    </h1>

                    <ul className="list-none p-0 m-0">
                        {currentQuestion.options && currentQuestion.options.map((option, index) => (
                            <li
                                key={index}
                                className={getOptionClasses(index)}
                                onClick={() => handleOptionClick(index)}
                            >
                                {option}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6 flex justify-center">
                        <button
                            className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                            onClick={handleNextQuestion}
                            disabled={selectedAnswer.length === 0 && (currentQuestion.type === 'single' || currentQuestion.type === 'judge')}
                        >
                            {currentIndex < totalQuestions - 1 ? '下一题' : '提交试卷'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Exam;