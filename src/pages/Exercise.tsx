import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StatusBar from '../components/StatusBar'; // 确保路径正确
import dataCsv from '../../static/data.csv?raw';
import JumpDialog from '../components/JumpDialog'; // 引入新的 JumpDialog 组件

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

    // --- 新增状态：控制题目跳转弹窗的可见性 ---
    const [isJumpDialogVisible, setIsJumpDialogVisible] = useState(false);
    // --- 状态新增结束 ---

    // 移除 jumpInput 及其相关的 effect，因为状态管理移到了 JumpDialog 内部


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
        // 加载题目时重置状态
        setCurrentIndex(0);
        setSelectedAnswer([]);
        setShowFeedback(false);
        setCorrectCount(0);
        setIncorrectCount(0);
        setIsJumpDialogVisible(false); // 确保加载时弹窗是关闭的

    }, [dataCsv, mode]); // 依赖 dataCsv 和 mode


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

    const getOptionClasses = (index: number) => {
        const optionChar = optionChars[index];
        const isSelected = selectedAnswer.includes(optionChar);
        const isCorrect = question.answer.includes(optionChar);

        let classes = "block w-full p-3 mb-3 border rounded-lg transition-colors duration-200 text-left ";

        if (showFeedback) {
            if (isSelected && isCorrect) {
                classes += "bg-green-200 border-green-500 text-green-800 font-semibold";
            } else if (isSelected && !isCorrect) {
                classes += "bg-red-200 border-red-500 text-red-800 font-semibold";
            } else if (!isSelected && isCorrect) {
                classes += "border-green-500 text-green-700 font-semibold";
            } else {
                classes += "border-gray-300 text-gray-800";
            }
             classes += " cursor-default pointer-events-none";
        } else {
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

    // --- 新增弹窗控制和跳转处理函数 ---
    // 打开跳转弹窗
    const handleOpenJumpDialog = () => {
         // 只有在题目加载完成且不是练习完成状态时才允许打开
         if (questions.length > 0 && !isQuizComplete) {
             setIsJumpDialogVisible(true);
         }
    };

    // 关闭跳转弹窗
    const handleCloseJumpDialog = () => {
        setIsJumpDialogVisible(false);
    };

    // 处理从弹窗接收到的跳转指令
    const handleJumpConfirm = (questionNumber: number) => {
        // 弹窗内部已经进行了验证，这里直接使用题号计算索引
        const jumpTargetIndex = questionNumber - 1;
        setCurrentIndex(jumpTargetIndex); // 设置新的当前题目索引
        // 重置当前题目的选择和反馈状态
        setSelectedAnswer([]);
        setShowFeedback(false);
        // 弹窗在调用 onJump 后会自行关闭，无需在这里再次调用 handleCloseJumpDialog
    };
    // --- 弹窗控制和跳转处理函数结束 ---


    if (isQuizComplete) {
        return (
            <>
                {/* 在完成界面，不显示跳转按钮 */}
                <StatusBar onBack={handleGoBack} title="练习完成" showJumpButton={false} />
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
                 {/* 在加载界面，不显示跳转按钮 */}
                 <StatusBar onBack={handleGoBack} title="加载中..." showJumpButton={false} />
                 <div className="container mx-auto p-4 sm:p-6 mt-8 sm:mt-12 max-w-md text-center">
                      加载中... 或没有题目数据
                 </div>
             </>
         );
    }

    return (
        <>
            {/* 在状态栏中显示跳转按钮，并根据模式（顺序练习）控制可见性 */}
            <StatusBar
                onBack={handleGoBack}
                title={`题目练习 (${currentIndex + 1}/${questions.length})`}
                onJumpClick={handleOpenJumpDialog} // 点击跳转按钮时调用打开弹窗的函数
                showJumpButton={mode === 'sequence'} // 仅在顺序模式下显示跳转按钮
            />

            {/* 主要内容区域 */}
            <div className="container mx-auto p-4 sm:p-6 mt-8 sm:mt-12 max-w-2xl">
                 {/* 对错计数 */}
                 <div className="text-right text-sm text-gray-600 mb-4">
                     答对: <span className="text-green-600 font-semibold">{correctCount}</span>{' '}
                     答错: <span className="text-red-600 font-semibold">{incorrectCount}</span>
                 </div>

                <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
                    {/* 题号、类型、标题 */}
                    <div className="text-sm text-gray-500 mb-3">
                        题目 {currentIndex + 1} / {questions.length} ({question.type === 'single' ? '单选' : question.type === 'multiple' ? '多选' : '判断'})
                    </div>

                    <h1 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 leading-snug">
                        {question.no}. {question.title}
                    </h1>

                    {/* 选项列表 */}
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

                    {/* 原来的内联跳转 UI 已移除 */}

                    {/* 操作按钮 (检查答案 / 下一题) */}
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

                    {/* 多选题正确答案显示 */}
                    {showFeedback && question.type === 'multiple' && (
                         <div className="mt-4 text-sm text-gray-700 text-center">
                             正确答案: <span className="font-semibold text-green-700">{question.answer.join(', ')}</span>
                         </div>
                     )}

                </div>
            </div>

            {/* 渲染题目跳转弹窗，并控制其可见性 */}
            {/* 只有当 questions 加载完成后才渲染 JumpDialog，因为它需要 totalQuestions 属性 */}
            {questions.length > 0 && (
                <JumpDialog
                    isOpen={isJumpDialogVisible} // 控制是否打开
                    onClose={handleCloseJumpDialog} // 传递关闭函数
                    totalQuestions={questions.length} // 传递题目总数
                    currentQuestionNumber={currentIndex + 1} // 传递当前题号作为默认值
                    onJump={handleJumpConfirm} // 传递处理跳转的函数
                />
            )}

        </>
    );
};

export default Exercise;