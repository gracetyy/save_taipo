
import React, { useState } from 'react';
import { OFFERING_CATEGORIES } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Check } from 'lucide-react';

interface Props {
  selectedItems: string[];
  onChange: (items: string[]) => void;
  onClose: () => void;
  title: string;
}

export const CategoryFilter: React.FC<Props> = ({ selectedItems, onChange, onClose, title }) => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(OFFERING_CATEGORIES)[0]);
  const [tempSelected, setTempSelected] = useState<string[]>(selectedItems);

  const currentCategoryItems = OFFERING_CATEGORIES[activeCategory];
  const allSelected = currentCategoryItems.every(item => tempSelected.includes(item));

  const toggleCategory = () => {
    if (allSelected) {
      setTempSelected(tempSelected.filter(i => !currentCategoryItems.includes(i)));
    } else {
      // Add items that are not already selected
      const itemsToAdd = currentCategoryItems.filter(i => !tempSelected.includes(i));
      setTempSelected([...tempSelected, ...itemsToAdd]);
    }
  };

  const toggleItem = (item: string) => {
    if (tempSelected.includes(item)) {
      setTempSelected(tempSelected.filter(i => i !== item));
    } else {
      setTempSelected([...tempSelected, item]);
    }
  };

  const handleApply = () => {
    onChange(tempSelected);
    onClose();
  };

  const handleClear = () => {
      setTempSelected([]);
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg h-[80vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-5">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sidebar (Categories) */}
          <div className="w-1/3 bg-gray-50 border-r overflow-y-auto">
            {Object.keys(OFFERING_CATEGORIES).map(catKey => (
              <button
                key={catKey}
                onClick={() => setActiveCategory(catKey)}
                className={`w-full text-left px-3 py-4 text-xs font-bold border-l-4 transition ${
                  activeCategory === catKey 
                    ? 'bg-white border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t(catKey as any)}
              </button>
            ))}
          </div>

          {/* Main (Items) */}
          <div className="w-2/3 p-4 overflow-y-auto">
             <button
                onClick={toggleCategory}
                className={`w-full mb-3 flex justify-between items-center px-3 py-2.5 rounded-lg border text-sm font-bold transition ${
                    allSelected 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 border-dashed'
                }`}
             >
                 <span>{allSelected ? t('btn.deselect_all') : t('btn.select_all')}</span>
                 <div className={`w-4 h-4 rounded border flex items-center justify-center ${allSelected ? 'bg-primary border-primary' : 'border-gray-400'}`}>
                    {allSelected && <Check size={12} className="text-white" />}
                 </div>
             </button>

             <div className="grid grid-cols-1 gap-2">
                 {currentCategoryItems.map(item => {
                     const isSelected = tempSelected.includes(item);
                     return (
                         <button
                            key={item}
                            onClick={() => toggleItem(item)}
                            className={`flex justify-between items-center px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                                isSelected 
                                  ? 'bg-primary/10 border-primary text-primary' 
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                         >
                             <span>{t(item as any)}</span>
                             {isSelected && <Check size={16} />}
                         </button>
                     );
                 })}
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-white shrink-0 flex gap-3">
             <button 
                onClick={handleClear}
                className="flex-1 py-3 text-gray-600 font-bold text-sm bg-gray-100 rounded-xl hover:bg-gray-200"
             >
                 {t('btn.clear')} ({tempSelected.length})
             </button>
             <button 
                onClick={handleApply}
                className="flex-[2] py-3 text-white font-bold text-sm bg-primary rounded-xl hover:bg-teal-800 shadow-md"
             >
                 {t('btn.apply')}
             </button>
        </div>
      </div>
    </div>
  );
};
