import React from 'react';
import clsx from 'clsx';
import type { Category } from '../types';

interface CategoryFilterProps {
    categories: Category[];
    activeId: string;
    onSelect: (id: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeId, onSelect }) => {
    return (
        <div className="sticky top-[64px] bg-white z-40 border-b border-gray-100 shadow-sm backdrop-blur-md bg-opacity-90">
            <div className="max-w-md mx-auto px-4 overflow-x-auto no-scrollbar flex gap-2 py-3 snap-x">
                <button
                    onClick={() => onSelect('all')}
                    className={clsx(
                        "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-sm snap-start border",
                        activeId === 'all'
                            ? "bg-gray-900 text-white border-gray-900 scale-105"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                >
                    Todos
                </button>
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => onSelect(category.id)}
                        className={clsx(
                            "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-sm snap-start border",
                            activeId === category.id
                                ? "bg-gray-900 text-white border-gray-900 scale-105"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
        </div>
    );
};
