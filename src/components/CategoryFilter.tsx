import React from 'react';
import clsx from 'clsx';
import { Category } from '../types';

interface CategoryFilterProps {
    categories: Category[];
    activeId: string;
    onSelect: (id: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeId, onSelect }) => {
    return (
        <div className="sticky top-[64px] bg-white z-40 border-b border-gray-100 shadow-sm">
            <div className="max-w-md mx-auto px-4 overflow-x-auto no-scrollbar flex gap-2 py-3">
                <button
                    onClick={() => onSelect('all')}
                    className={clsx(
                        "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                        activeId === 'all'
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                >
                    Todos
                </button>
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => onSelect(category.id)}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            activeId === category.id
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
        </div>
    );
};
