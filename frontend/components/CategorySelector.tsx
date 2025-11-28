import React, { useEffect, useState } from 'react';
import { OFFERING_CATEGORIES } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { subscribeToCategories } from '../services/dataService';

interface Props {
  categories?: Record<string, string[]>;
  selectedItems: string[];
  onToggleItem: (item: string) => void;
  itemsFilter?: (item: string) => boolean;
  categoryButtonClass?: string;
  itemClass?: string;
  selectedItemClass?: string;
  // Allow adding items/categories
  allowAddItem?: boolean;
  allowAddCategory?: boolean;
  onAddItem?: (category: string, item: string) => void;
  onAddCategory?: (category: string) => void;
}

export const CategorySelector: React.FC<Props> = ({
  categories,
  selectedItems,
  onToggleItem,
  itemsFilter = () => true,
  categoryButtonClass = 'w-full px-3 py-2 flex items-center justify-between text-gray-700 text-xs font-bold uppercase hover:bg-gray-100',
  itemClass = 'px-2 py-1 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-100',
  selectedItemClass = 'bg-green-600 text-white border-green-600',
  allowAddItem = false,
  allowAddCategory = false,
  onAddItem,
  onAddCategory
}) => {
  const { t } = useLanguage();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState<Record<string, string[]>>(categories || OFFERING_CATEGORIES);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(Object.keys(categories || OFFERING_CATEGORIES)[0] || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categories) {
      setLocalCategories(categories);
      return;
    }

    const unsubscribe = subscribeToCategories(setLocalCategories);
    return () => unsubscribe();
  }, [categories]);

  return (
    <div className="space-y-2">
      {Object.entries(localCategories).map(([category, items]) => (
        <div key={category} className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
            className={categoryButtonClass}
          >
            {t(category as any)}
            {expandedCategory === category ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expandedCategory === category && (
            <div className="px-3 pb-3 flex flex-wrap gap-1.5 bg-white">
              {items.filter(itemsFilter).map(item => {
                const isSelected = selectedItems.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onToggleItem(item)}
                    className={`${itemClass} ${isSelected ? selectedItemClass : ''}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
      {/* Add item/category UI */}
      {(allowAddItem || allowAddCategory) && (
        <div className="pt-2">
          {error && <div className="text-xs text-red-500 mb-2">{error}</div>}
          {allowAddItem && (
            <div className="flex gap-2 items-center mb-2">
              <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder={t('btn.add_item')}
                className="flex-1 p-2 rounded border border-gray-200 text-sm" />
              <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="p-2 rounded border border-gray-200 text-sm">
                {Object.keys(localCategories).map(k => <option key={k} value={k}>{t(k as any)}</option>)}
              </select>
              <button onClick={() => {
                setError(null);
                if (!newItemName.trim()) { setError(t('validation.enter_item')); return; }
                const cat = newItemCategory || Object.keys(localCategories)[0];
                if (!cat) { setError(t('validation.no_category')); return; }
                if (localCategories[cat] && localCategories[cat].includes(newItemName.trim())) { setError(t('validation.already_exists')); return; }
                setLocalCategories(prev => ({ ...prev, [cat]: [...(prev[cat] || []), newItemName.trim()] }));
                if (onAddItem) onAddItem(cat, newItemName.trim());
                setNewItemName('');
              }} className="px-3 py-2 bg-primary text-white rounded text-sm">{t('btn.add')}</button>
            </div>
          )}
          {allowAddCategory && (
            <div className="flex gap-2 items-center">
              <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder={t('btn.add_category')}
                className="flex-1 p-2 rounded border border-gray-200 text-sm" />
              <button onClick={() => {
                setError(null);
                const key = newCategoryName.trim();
                if (!key) { setError(t('validation.enter_category')); return; }
                if (localCategories[key]) { setError(t('validation.already_exists')); return; }
                setLocalCategories(prev => ({ ...prev, [key]: [] }));
                if (onAddCategory) onAddCategory(key);
                setNewCategoryName('');
              }} className="px-3 py-2 bg-primary text-white rounded text-sm">{t('btn.add')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
