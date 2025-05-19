import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StatusBar from '../components/StatusBar'; // 确保路径正确
import dataCsv from '../../static/data.csv?raw';
import JumpDialog from '../components/JumpDialog'; // 引入新的 JumpDialog 组件

// 确保 AnswerHistoryEntry, QuestionHistoryMap, getHistory, addHistoryEntry, getHistoryForQuestion
// 这些历史记录相关的类型和函数定义都在这个文件中或者从单独的文件正确导入
// 假设它们都在这个文件中，如您提供的代码所示。

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


// --- History Utility Functions (already provided, keeping them here) ---
export interface AnswerHistoryEntry {
    /** 时间戳 (毫秒) */
    timestamp: number;
    /** 答题是否正确 */
    correct: boolean;
}

// 存储历史记录的对象结构
interface QuestionHistoryMap {
    [questionId: string]: AnswerHistoryEntry[]; // key 现在只基于题号
}

const HISTORY_STORAGE_KEY = 'crammer_history';

/**
 * 从 localStorage 获取所有题目的答题历史记录映射
 * @returns 题目ID (题号字符串) 到 答题历史记录数组的映射对象
 */
export const getHistory = (): QuestionHistoryMap => {
    try {
        const historyJson = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (historyJson) {
            const history: unknown = JSON.parse(historyJson);
            if (typeof history === 'object' && history !== null) {
                return history as QuestionHistoryMap;
            }
        }
    } catch (error) {
        console.error("Failed to load history from localStorage:", error);
    }
    return {}; // 返回空对象
};

/**
 * 向 localStorage 添加一条答题历史记录
 * @param questionNo 原始题号
 * @param correct 答题是否正确
 * @returns 更新后的所有历史记录映射
 */
export const addHistoryEntry = (
    questionNo: number,
    correct: boolean
): QuestionHistoryMap => {
    // 获取当前的完整历史记录映射
    const currentHistoryMap = getHistory();

    // 创建新的历史记录条目
    const entry: AnswerHistoryEntry = {
        timestamp: new Date().getTime(),
        correct: correct,
    };

    // 使用题号作为键（会被隐式转换为字符串）
    const questionKey = questionNo.toString();

    // 如果该题目的历史记录数组不存在，则创建一个
    if (!currentHistoryMap[questionKey]) {
        currentHistoryMap[questionKey] = [];
    }

    // 向该题目的历史记录数组中添加新条目
    currentHistoryMap[questionKey].push(entry);

    try {
        // 将更新后的整个历史记录映射保存回 localStorage
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(currentHistoryMap));
    } catch (error) {
        console.error("Failed to save history to localStorage:", error);
        alert("答题记录保存失败，可能是存储空间不足。");
    }

    // 返回更新后的完整历史记录映射
    return currentHistoryMap;
};

/**
 * 获取指定题目的答题历史记录 (仅使用题号)
 * @param questionNo 原始题号
 * @returns 指定题目的答题历史记录数组，如果不存在则返回空数组
 */
export const getHistoryForQuestion = (
    questionNo: number,
): AnswerHistoryEntry[] => {
    const historyMap = getHistory();
    // 使用题号作为键（会被隐式转换为字符串）
    const questionKey = questionNo.toString();
    // 返回该题目 ID 对应的数组，如果不存在则返回空数组
    return historyMap[questionKey] || [];
};
// --- End History Utility Functions ---


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

    // --- 控制题目跳转弹窗的可见性 ---
    const [isJumpDialogVisible, setIsJumpDialogVisible] = useState(false);
    // --- 新增状态：存储当前题目的答题历史 ---
    const [questionHistory, setQuestionHistory] = useState<AnswerHistoryEntry[]>([]);
    // --- 状态新增结束 ---

    // 显示最近几次历史记录的数量
    const HISTORY_DISPLAY_COUNT = 5;


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
            if (options.length === 0 || answer.length === 0) return null; // Filter out invalid questions
            return { no, type, title, options, answer };
        }).filter((q): q is Question => q !== null);


        if (mode === 'random') {
            console.log("进入随机刷题模式，打乱题目");
            list = shuffleArray(list);
        } else {
            console.log("进入顺序刷题模式");
        }

        setQuestions(list);
        // 加载题目时重置所有状态
        setCurrentIndex(0);
        setSelectedAnswer([]);
        setShowFeedback(false);
        setCorrectCount(0);
        setIncorrectCount(0);
        setIsJumpDialogVisible(false); // 确保加载时弹窗是关闭的
        setQuestionHistory([]); // 重置历史记录显示
    }, [mode]); // 依赖 mode


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

            // 👇 立即记录答题历史
            const correctAnswer = question.answer;
            const isAnswerCorrect = clickedOptionChar === correctAnswer[0];
            addHistoryEntry(question.no, isAnswerCorrect); // 实时保存
            console.log(`题目 ${question.no} 已作答. 正确性: ${isAnswerCorrect}. 历史已记录.`);

            setQuestionHistory(getHistoryForQuestion(question.no));
        } else if (question.type === 'multiple') {
            setSelectedAnswer(prevSelected => {
                const newSelected = prevSelected.includes(clickedOptionChar)
                    ? prevSelected.filter(char => char !== clickedOptionChar)
                    : [...prevSelected, clickedOptionChar];
                return newSelected.sort();
            });
        }
    };

    const handleCheckAnswer = () => {
        if (question.type === 'multiple' && selectedAnswer.length > 0 && !showFeedback) {
            setShowFeedback(true);

            const correctAnswer = question.answer;
            const isAnswerCorrect = areArraysEqualIgnoringOrder(selectedAnswer, correctAnswer);

            // 👇 立即记录历史
            addHistoryEntry(question.no, isAnswerCorrect);
            console.log(`题目 ${question.no} 已作答. 正确性: ${isAnswerCorrect}. 历史已记录.`);

            setQuestionHistory(getHistoryForQuestion(question.no));
        }
    };

    const handleNextQuestion = () => {
        // 只有在显示反馈并且当前题目对象有效时才能进入下一题
        if (showFeedback && question) {
            const correctAnswer = question.answer;
            let isAnswerCorrect = false;

            if (question.type === 'single' || question.type === 'judge') {
                // 单选或判断：选中一个且与正确答案相同
                isAnswerCorrect = selectedAnswer.length === 1 && selectedAnswer[0] === correctAnswer[0];
            } else if (question.type === 'multiple') {
                // 多选：选中的内容与正确答案完全一致（不考虑顺序）
                isAnswerCorrect = areArraysEqualIgnoringOrder(selectedAnswer, correctAnswer);
            }

            // 根据作答结果更新本轮练习的对错计数
            if (isAnswerCorrect) {
                setCorrectCount(prev => prev + 1);
            } else {
                setIncorrectCount(prev => prev + 1);
            }

            // --- 重置历史记录显示状态以便加载下一题的历史 ---
            setQuestionHistory([]);
            // --- 重置历史记录状态结束 ---

            // 移动到下一题并重置当前题目的状态
            setCurrentIndex(prevIndex => prevIndex + 1);
            setSelectedAnswer([]);
            setShowFeedback(false);
        }
    };

    const getOptionClasses = (index: number) => {
        const optionChar = optionChars[index];
        const isSelected = selectedAnswer.includes(optionChar);
        const isCorrect = question.answer.includes(optionChar); // 注意：多选时正确答案可能有多个字符

        let classes = "block w-full p-3 mb-3 border rounded-lg transition-colors duration-200 text-left ";

        if (showFeedback) {
            // 显示反馈状态：标记选项的正确性及用户的选择情况
            if (isCorrect) {
                // 选项是正确答案的一部分
                if (isSelected) {
                    // 正确的选项被用户选中了 (单选/判断的正确选项，或多选中的一个正确选项)
                    classes += "bg-green-200 border-green-500 text-green-800 font-semibold dark:bg-green-700 dark:border-green-600 dark:text-green-200";
                } else {
                    // 正确的选项未被用户选中 (单选/判断选错，或多选漏选)
                    classes += "border-green-500 text-green-700 font-semibold dark:border-green-400 dark:text-green-300"; // 强调正确的选项
                }
            } else {
                // 选项是错误答案
                if (isSelected) {
                    // 错误的选项被用户选中了
                    classes += "bg-red-200 border-red-500 text-red-800 font-semibold dark:bg-red-700 dark:border-red-600 dark:text-red-200";
                } else {
                    // 错误的选项未被用户选中 (正确行为)
                    classes += "border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-300"; // 未选中的错误选项保持默认样式
                }
            }
            classes += " cursor-default pointer-events-none"; // 显示反馈后禁止点击选项
        } else {
            // 未显示反馈状态：允许用户点击选择
            if (isSelected) {
                classes += "bg-blue-100 border-blue-400 text-blue-800 font-medium dark:bg-blue-700 dark:border-blue-600 dark:text-blue-200";
            } else {
                classes += "border-gray-300 text-gray-800 hover:bg-gray-100 active:bg-gray-200 cursor-pointer dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-900";
            }
        }
        return classes;
    };

    const handleGoBack = () => {
        navigate('/');
    };

    // --- Jump Dialog control functions ---
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
        // 重置当前题目的选择、反馈和历史记录状态
        setSelectedAnswer([]);
        setShowFeedback(false);
        setQuestionHistory([]); // 跳转到新题目时清空历史记录显示
        // 弹窗在调用 onJump 后会自行关闭
    };
    // --- End Jump Dialog control functions ---

    // 获取要展示的最近历史记录
    const recentHistory = questionHistory.slice(0, HISTORY_DISPLAY_COUNT);

    if (isQuizComplete) {
        return (
            <>
                {/* 在完成界面，不显示跳转按钮 */}
                <StatusBar onBack={handleGoBack} title="练习完成" showJumpButton={false} />
                <div className="container mx-auto p-4 sm:p-6 mt-8 sm:mt-12 max-w-md text-center">
                    <div className="bg-white shadow-md rounded-lg p-6 sm:p-8 dark:bg-gray-800 dark:text-gray-200">
                        <h1 className="text-2xl font-bold mb-4">练习完成!</h1>
                        <p className="text-lg mb-4 sm:mb-6">
                            总共题目: {questions.length}<br />
                            本轮答对: <span className="text-green-600 font-bold dark:text-green-400">{correctCount}</span><br />
                            本轮答错: <span className="text-red-600 font-bold dark:text-red-400">{incorrectCount}</span>
                        </p>
                        <button
                            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
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
                <div className="container mx-auto p-4 sm:p-6 mt-8 sm:mt-12 max-w-md text-center dark:text-gray-300">
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
                {/* 对错计数 (本轮练习的统计) */}
                <div className="text-right text-sm text-gray-600 dark:text-gray-400 mb-4">
                    本轮答对: <span className="text-green-600 font-semibold dark:text-green-400">{correctCount}</span>{' '}
                    本轮答错: <span className="text-red-600 font-semibold dark:text-red-400">{incorrectCount}</span>
                </div>

                <div className="bg-white shadow-md rounded-lg p-6 sm:p-8 dark:bg-gray-800 dark:text-gray-200">
                    {/* 题号、类型、标题 */}
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
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

                    {/* 操作按钮 (检查答案 / 下一题) */}
                    <div className="mt-6 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                        {/* 只有多选且未显示反馈且有选中答案时才显示“检查答案” */}
                        {question.type === 'multiple' && selectedAnswer.length > 0 && !showFeedback && (
                            <button
                                className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:opacity-40"
                                onClick={handleCheckAnswer}
                                disabled={selectedAnswer.length === 0 || showFeedback}
                            >
                                检查答案
                            </button>
                        )}

                        {/* 显示反馈后显示“下一题”或“完成” */}
                        {showFeedback && (
                            <button
                                className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors dark:bg-green-700 dark:hover:bg-green-600"
                                onClick={handleNextQuestion}
                            >
                                {isLastQuestion ? '完成' : '下一题'}
                            </button>
                        )}
                    </div>

                    {/* 多选题正确答案显示 */}
                    {showFeedback && question.type === 'multiple' && (
                        <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 text-center">
                            正确答案: <span className="font-semibold text-green-700 dark:text-green-400">{question.answer.join(', ')}</span>
                        </div>
                    )}

                    {/* --- 历史记录展示区域 (时间线) --- */}
                    {/* 仅在显示反馈且有历史记录时展示 */}
                    {showFeedback && questionHistory.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                            <h4 className="font-semibold mb-2">答题历史</h4>
                            <div className="space-y-1"> {/* 为每个历史条目添加间距 */}
                                {/* 遍历并显示最近的 HISTORY_DISPLAY_COUNT 次记录 */}
                                {recentHistory.reverse().map((entry, index) => (
                                    // 使用 entry.timestamp 作为 key，如果可能重复，可以结合 index
                                    <p key={entry.timestamp + '-' + index} className={entry.correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                                        - {new Date(entry.timestamp).toLocaleString()}: {entry.correct ? '正确' : '错误'}
                                    </p>
                                ))}
                                {/* 如果总记录数多于显示的记录数，添加提示 */}
                                {questionHistory.length > HISTORY_DISPLAY_COUNT && (
                                    <p className="text-gray-500 dark:text-gray-400 italic">
                                        ... 还有 {questionHistory.length - HISTORY_DISPLAY_COUNT} 次历史记录未显示
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {/* --- 历史记录展示区域结束 --- */}
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