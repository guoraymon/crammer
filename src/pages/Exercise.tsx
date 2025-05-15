import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StatusBar from '../components/StatusBar'; // 确保路径正确
import dataCsv from '../../static/data.csv?raw';

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

// Fisher-Yates (Knuth) 洗牌算法
function shuffleArray<T>(array: T[]): T[] {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}

// 数组内容比较函数（忽略顺序）
const areArraysEqualIgnoringOrder = (arr1: string[], arr2: string[]): boolean => {
    if (arr1.length !== arr2.length) {
        return false;
    }
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();
    return sortedArr1.every((value, index) => value === sortedArr2[index]);
};


const Exercise = () => {
    const navigate = useNavigate();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);

    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);

    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');


    useEffect(() => {
        const lines = dataCsv.trim().split('\n');
        let list: Question[] = lines.slice(1).map(line => {
            const values = line.split(',');
            const no = Number(values[0]) || 0;
            const type = (values[1] in typeMap ? typeMap[values[1] as keyof typeof typeMap] : 'single') as Question['type'];
            const title = values[2] || '无标题';
            const options = [values[3], values[4], values[5], values[6]]
                .filter(Boolean)
                .map((opt, i) => `${optionChars[i]}. ${opt.trim()}`);
            const answer = values[7] ? values[7].trim().split('') : [];
            if (options.length === 0 || answer.length === 0) return null;
            return { no, type, title, options, answer };
        }).filter((q): q is Question => q !== null);


        if (mode === 'random') {
            console.log("进入随机刷题模式，打乱题目");
            list = shuffleArray(list);
        } else {
            console.log("进入顺序刷题模式");
        }

        setQuestions(list);
    }, [dataCsv, mode]);


    const question = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;
    const isQuizComplete = currentIndex >= questions.length;


    const handleOptionClick = (index: number) => {
        if (showFeedback) {
            return;
        }
        const clickedOptionChar = optionChars[index];

        if (question.type === 'single' || question.type === 'judge') {
            setSelectedAnswer([clickedOptionChar]);
            setShowFeedback(true);
        } else if (question.type === 'multiple') {
            setSelectedAnswer(prevSelected =>
                prevSelected.includes(clickedOptionChar)
                    ? prevSelected.filter(char => char !== clickedOptionChar)
                    : [...prevSelected, clickedOptionChar]
            );
        }
    };

    const handleCheckAnswer = () => {
        if (question.type === 'multiple' && selectedAnswer.length > 0 && !showFeedback) {
            setShowFeedback(true);
        }
    };

    const handleNextQuestion = () => {
        if (showFeedback && question) {
            const correctAnswer = question.answer;
            let isAnswerCorrect = false;

            if (question.type === 'single' || question.type === 'judge') {
                isAnswerCorrect = selectedAnswer.length === 1 && selectedAnswer[0] === correctAnswer[0];
            } else if (question.type === 'multiple') {
                isAnswerCorrect = areArraysEqualIgnoringOrder(selectedAnswer, correctAnswer);
            }

            if (isAnswerCorrect) {
                setCorrectCount(prev => prev + 1);
            } else {
                setIncorrectCount(prev => prev + 1);
            }

            setCurrentIndex(prevIndex => prevIndex + 1);
            setSelectedAnswer([]);
            setShowFeedback(false);
        }
    };

    // 修改 getOptionClasses 函数以区分“选中且正确”和“未选中但正确”的样式
    const getOptionClasses = (index: number) => {
        const optionChar = optionChars[index];
        const isSelected = selectedAnswer.includes(optionChar);
        const isCorrect = question.answer.includes(optionChar); // 选项本身是否是正确答案的一部分

        let classes = "block w-full p-3 mb-3 border rounded-lg transition-colors duration-200 text-left ";

        if (showFeedback) {
            // 显示反馈时
            if (isSelected && isCorrect) {
                // 用户选中了，并且选项本身是正确答案的一部分 -> 选中且正确
                classes += "bg-green-200 border-green-500 text-green-800 font-semibold";
            } else if (isSelected && !isCorrect) {
                // 用户选中了，但选项本身不是正确答案的一部分 -> 选中且错误
                classes += "bg-red-200 border-red-500 text-red-800 font-semibold";
            } else if (!isSelected && isCorrect) {
                // 用户没有选中，但选项本身是正确答案的一部分 -> 未选中但正确 (用户漏选了)
                // **修改这里:** 仅显示绿色边框和文本，不使用绿色背景，以区分“选中且正确”
                classes += "border-green-500 text-green-700 font-semibold"; // 移除 bg-green-100
            } else {
                // 用户没有选中，且选项本身不是正确答案的一部分 -> 未选中且错误 (用户正确地没有选)
                // 保持默认样式
                classes += "border-gray-300 text-gray-800";
            }
            // 反馈显示时，选项不可点击
            classes += " cursor-default pointer-events-none";

        } else {
            // 未显示反馈时，仅显示选中状态
            if (isSelected) {
                classes += "bg-blue-100 border-blue-400 text-blue-800 font-medium";
            } else {
                classes += "border-gray-300 text-gray-800 hover:bg-gray-100 active:bg-gray-200 cursor-pointer";
            }
        }
        return classes;
    };

    const handleGoBack = () => {
        navigate('/');
    };


    if (isQuizComplete) {
        return (
            <>
                <StatusBar onBack={handleGoBack} title="练习完成" />
                <div className="container mx-auto p-4 sm:p-6 mt-8 sm:mt-12 max-w-md text-center">
                    <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
                        <h1 className="text-2xl font-bold mb-4">练习完成!</h1>
                        <p className="text-lg mb-4 sm:mb-6">
                            总共题目: {questions.length}<br />
                            答对: <span className="text-green-600 font-bold">{correctCount}</span><br />
                            答错: <span className="text-red-600 font-bold">{incorrectCount}</span>
                        </p>
                        <button
                            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            onClick={() => {
                                // 这里选择返回主页
                                navigate('/');
                            }}
                        >
                            返回主页
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (!question) {
        return (
            <>
                <StatusBar onBack={handleGoBack} title="加载中..." />
                <div className="container mx-auto p-4 sm:p-6 mt-8 sm:mt-12 max-w-md text-center">
                    加载中... 或没有题目数据
                </div>
            </>
        );
    }

    return (
        <>
            <StatusBar onBack={handleGoBack} title={`题目练习 (${currentIndex + 1}/${questions.length})`} />
            <div className="container mx-auto p-4 sm:p-6 mt-8 sm:mt-12 max-w-2xl">
                <div className="text-right text-sm text-gray-600 mb-4">
                    答对: <span className="text-green-600 font-semibold">{correctCount}</span>{' '}
                    答错: <span className="text-red-600 font-semibold">{incorrectCount}</span>
                </div>
                <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
                    <div className="text-sm text-gray-500 mb-3">
                        题目 {currentIndex + 1} / {questions.length} ({question.type === 'single' ? '单选' : question.type === 'multiple' ? '多选' : '判断'})
                    </div>

                    <h1 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 leading-snug">
                        {question.no}. {question.title}
                    </h1>

                    <ul className="list-none p-0 m-0">
                        {question.options && question.options.map((option, index) => (
                            <li
                                key={index}
                                className={getOptionClasses(index)}
                                onClick={() => handleOptionClick(index)}
                            >
                                {option}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                        {question.type === 'multiple' && selectedAnswer.length > 0 && !showFeedback && (
                            <button
                                className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                onClick={handleCheckAnswer}
                                disabled={selectedAnswer.length === 0 || showFeedback}
                            >
                                检查答案
                            </button>
                        )}

                        {showFeedback && (
                            <button
                                className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                onClick={handleNextQuestion}
                            >
                                {isLastQuestion ? '完成' : '下一题'}
                            </button>
                        )}
                    </div>

                    {showFeedback && question.type === 'multiple' && (
                        <div className="mt-4 text-sm text-gray-700 text-center">
                            正确答案: <span className="font-semibold text-green-700">{question.answer.join(', ')}</span>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
};

export default Exercise;