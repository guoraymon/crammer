import React from 'react';
import { IoIosArrowBack } from "react-icons/io";
// 引入一个图标来表示跳转，例如一个数字列表图标
import { BsListOl } from "react-icons/bs"; // 示例图标，请确保已安装 react-icons

interface StatusBarProps {
    /** 在状态栏中间显示的标题 (可选) */
    title?: string;
    /** 后退按钮点击时调用的函数 */
    onBack: () => void;
    /** 跳转按钮点击时调用的函数 (可选) */
    onJumpClick?: () => void;
    /** 是否显示跳转按钮 (控制其可见性) */
    showJumpButton?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({
    title,
    onBack,
    onJumpClick,
    showJumpButton = false // 默认为不显示
}) => {
    return (
        // 使用 flex 布局，两端对齐内容，固定在顶部
        <div className="flex items-center bg-gray-100 px-4 py-3 border-b border-gray-200 sticky top-0 z-10 shadow-sm justify-between">
            {/* 左侧：后退按钮 */}
            <button
                onClick={onBack}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors pr-4 py-2 -ml-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="返回上一页"
            >
                 <IoIosArrowBack className="mr-1" size={20} />
                 返回
            </button>

            {/* 中间：标题 */}
            {/* flex-grow 允许标题填充中间空间，text-center 使文本居中 */}
            {/* px-4 避免标题紧贴按钮 */}
            <div className="flex-grow text-center px-4 truncate">
                {title && (
                    <h2 className="text-lg font-semibold text-gray-800 truncate">
                        {title}
                    </h2>
                )}
            </div>

            {/* 右侧：跳转按钮 (条件显示) */}
            {/* 只有在 showJumpButton 为 true 且 onJumpClick 函数存在时才显示按钮 */}
             {showJumpButton && onJumpClick && (
                 <button
                     onClick={onJumpClick}
                     className="flex items-center text-blue-600 hover:text-blue-800 transition-colors pl-4 py-2 -mr-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" // 样式与后退按钮对称
                     aria-label="跳转到题目"
                 >
                     <BsListOl className="mr-1" size={20} /> {/* 使用图标 */}
                     跳转
                 </button>
             )}
             {/* 如果跳转按钮隐藏，使用一个占位符保持标题居中对齐 */}
             {!showJumpButton && <div className="w-12"></div>} {/* 宽度与后退按钮区域大致匹配 */ }

        </div>
    );
};

export default StatusBar;