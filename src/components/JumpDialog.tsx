import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface JumpDialogProps {
    /** 控制弹窗是否可见 */
    isOpen: boolean;
    /** 关闭弹窗时调用的函数 */
    onClose: () => void;
    /** 题目总数，用于验证输入范围 */
    totalQuestions: number;
    /** 当前题号 (1-based)，用于输入框的默认值 */
    currentQuestionNumber: number;
    /** 用户确认跳转时调用的函数，参数为目标题号 (1-based) */
    onJump: (questionNumber: number) => void;
}

const JumpDialog: React.FC<JumpDialogProps> = ({
    isOpen,
    onClose,
    totalQuestions,
    currentQuestionNumber,
    onJump,
}) => {
    // --- 所有 Hook 调用必须放在组件的顶层，无条件调用 ---

    // 弹窗内部输入框的状态
    const [inputQuestionNumber, setInputQuestionNumber] = useState(String(currentQuestionNumber));

    // 副作用：当弹窗打开或当前题号变化时，同步输入框的默认值
    useEffect(() => {
        if (isOpen) {
            setInputQuestionNumber(String(currentQuestionNumber));
        }
    }, [isOpen, currentQuestionNumber]);

    // 副作用：处理键盘按下事件 (例如按下 Escape 键关闭弹窗)
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

     // 处理输入框内容变化
     const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
         const value = event.target.value;
          if (value === '' || /^[0-9]+$/.test(value)) {
              setInputQuestionNumber(value);
          }
     }, []);

     // 处理“确定”按钮点击
     const handleConfirm = useCallback(() => {
         const num = parseInt(inputQuestionNumber, 10);
         if (isNaN(num) || num < 1 || num > totalQuestions) {
             alert(`请输入一个有效的题号 (1 到 ${totalQuestions})`);
             return;
         }
         onJump(num);
         onClose();
     }, [inputQuestionNumber, totalQuestions, onJump, onClose]);

      // 处理点击弹窗外部区域关闭弹窗
      const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
           if (event.target === event.currentTarget) {
               onClose();
           }
      }, [onClose]);


    // --- 所有 Hook 调用都在这里结束 ---


    // --- 条件渲染逻辑，根据 isOpen 状态决定渲染什么 ---
    if (!isOpen) {
        return null;
    }

    // 如果弹窗可见，使用 Portal 渲染弹窗内容
    return createPortal(
        // 遮罩层
        <div
            // === 修改这里的 className ===
            // 移除 backdrop-blur-sm
            // 使用 bg-black/75 来设置一个较暗的半透明背景 (75% 不透明度)
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" // <-- 修改这里
             onClick={handleOverlayClick}
        >
            {/* 弹窗本体 */}
            <div
                className="bg-white p-6 rounded-lg shadow-xl flex flex-col space-y-4 w-full max-w-sm"
                onClick={e => e.stopPropagation()}
            >
                {/* 弹窗标题 */}
                <h3 className="text-lg font-semibold text-gray-800">跳转到题目</h3>

                {/* 输入区域 */}
                <div className="flex items-center space-x-3">
                     <label htmlFor="jump-dialog-input" className="text-gray-700">题号:</label>
                    <input
                         id="jump-dialog-input"
                        type="number"
                        min="1"
                        max={totalQuestions}
                        value={inputQuestionNumber}
                        onChange={handleInputChange}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                         onKeyPress={(e) => {
                             if (e.key === 'Enter') {
                                 handleConfirm();
                             }
                         }}
                    />
                    {/* 显示总题数 */}
                    <span className="text-gray-600">/ {totalQuestions}</span>
                </div>

                {/* 操作按钮区域 */}
                <div className="flex justify-end space-x-3">
                    {/* 取消按钮 */}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                    >
                        取消
                    </button>
                    {/* 确定按钮 */}
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                        disabled={inputQuestionNumber === '' || isNaN(parseInt(inputQuestionNumber, 10))}
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>,
        document.body // 渲染到 body 元素下
    );
};

export default JumpDialog;