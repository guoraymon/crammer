import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        // 主容器：全屏高度，居中 flex 布局，背景色
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 sm:p-6"> {/* 添加响应式内边距 */}
            {/* 卡片容器：白色背景，阴影，圆角，内边距，设置最大宽度并使其在小屏幕上占满宽度 */}
            <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8 max-w-sm w-full text-center"> {/* max-w-sm 设置最大宽度，w-full 确保小屏幕占满 */}
                {/* 标题 */}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6"> {/* 调整标题大小和下边距 */}
                    选择练习模式
                </h1>

                {/* 链接容器：垂直 flex 布局，添加子元素之间的垂直间距 */}
                <div className="flex flex-col space-y-4"> {/* 核心修改：添加 flex flex-col 使子元素垂直排列 */}
                    {/* 顺序刷题链接 */}
                    <Link
                        to={{ pathname: 'exercise', search: '?mode=sequence' }}
                        className="w-full px-6 py-3 sm:py-4 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" // 按钮样式，w-full 确保宽度，增加响应式垂直内边距，添加 focus 样式
                    >
                        顺序练习
                    </Link>

                    {/* 随机刷题链接 */}
                    <Link
                        to={{ pathname: 'exercise', search: '?mode=random' }}
                        className="w-full px-6 py-3 sm:py-4 text-lg font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        随机练习
                    </Link>

                    {/* 模拟考试链接 */}
                    <Link
                        to='exam' // 假设 'exercise' 路由可以通过 state 或 query param 区分模式
                        className="w-full px-6 py-3 sm:py-4 text-lg font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        模拟考试
                    </Link>
                </div>

                {/* 可选：添加一些描述性文本或页脚 */}
                <p className="mt-6 text-gray-600 text-sm">请选择您想要的练习模式。</p>
            </div>
        </div>
    );
};

export default Home;