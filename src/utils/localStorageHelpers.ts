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
                // 可以在这里进一步验证对象内部的结构，但基本验证是对象即可
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
 * @param questionType 题型 (用于 AnswerHistoryEntry，但不再用于生成 key)
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

    // 如果该题目的历史记录数组不存在，则创建一个
    if (!currentHistoryMap[questionNo]) {
        currentHistoryMap[questionNo] = [];
    }

    // 向该题目的历史记录数组中添加新条目
    currentHistoryMap[questionNo].push(entry);

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
 * @param questionType 题型 (不再用于获取，但函数签名保留方便调用)
 * @returns 指定题目的答题历史记录数组，如果不存在则返回空数组
 */
export const getHistoryForQuestion = (
    questionNo: number,
): AnswerHistoryEntry[] => {
    const historyMap = getHistory();
    // 返回该题目 ID 对应的数组，如果不存在则返回空数组
    return historyMap[questionNo] || [];
};

// 清理所有历史记录的函数 (可选)
// export const clearAllHistory = (): void => {
//     try {
//         localStorage.removeItem(HISTORY_STORAGE_KEY);
//     } catch (error) {
//         console.error("Failed to clear all history from localStorage:", error);
//     }
// };