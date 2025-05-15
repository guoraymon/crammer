import React from 'react';
// 引入一个后退箭头图标，这里使用 react-icons 库作为示例
// 如果你的项目中没有安装 react-icons，可以先运行 npm install react-icons 或 yarn add react-icons
// 如果不想使用图标，可以只使用文本 "返回"
import { IoIosArrowBack } from "react-icons/io";

interface StatusBarProps {
    /** 在状态栏中间显示的标题 (可选) */
    title?: string;
    /** 后退按钮点击时调用的函数 */
    onBack: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ title, onBack }) => {
    return (
        // 使用 flex 布局，居中对齐项目，添加背景、内边距和底部边框
        // sticky 和 top-0 使状态栏在滚动时固定在顶部
        // z-10 确保状态栏在内容上方
        <div className="flex items-center bg-gray-100 px-4 py-3 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            {/* 后退按钮 */}
            {/* 使用 flex 布局使图标和文本对齐，增加点击区域，添加 hover 和 focus 效果 */}
            <button
                onClick={onBack}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors pr-4 py-2 -ml-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="返回上一页" // 为屏幕阅读器提供描述
            >
                {/* 后退箭头图标 */}
                <IoIosArrowBack className="mr-1" size={20} /> {/* mr-1 添加图标和文本间的间距 */}
                返回 {/* 按钮文本 */}
            </button>

            {/* 标题区域 */}
            {/* flex-grow 允许此区域填充可用空间，text-center 使标题居中 */}
            <div className="flex-grow text-center px-4 truncate"> {/* px-4 避免标题太靠近按钮 */}
                {title && (
                    <h2 className="text-lg font-semibold text-gray-800 truncate">
                        {title}
                    </h2>
                )}
            </div>

            {/* 右侧占位符，用于帮助标题在按钮和占位符之间居中 */}
            {/* 宽度应大致与后退按钮区域的宽度匹配 */}
            <div className="w-12"></div> {/* 根据实际按钮区域宽度调整 */}
        </div>
    );
};

export default StatusBar;