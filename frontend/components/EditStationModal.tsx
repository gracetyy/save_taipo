import React, { useState } from 'react';
import { Station, SupplyStatus, NeedItem } from '../types';
import { updateStationDetails, addOfferingItem, addOfferingCategory } from '../services/dataService';
import { X, Plus } from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { useLanguage } from '../contexts/LanguageContext';

interface EditStationModalProps {
  station: Station;
  onClose: () => void;
  onComplete: () => void;
}

export const EditStationModal: React.FC<EditStationModalProps> = ({ station, onClose, onComplete }) => {
  const { t } = useLanguage();

  const normalizeToStrings = (offerings: any[] | undefined) => {
    if (!offerings) return [] as string[];
    return offerings.map(o => (typeof o === 'string' ? o : (o && o.item ? o.item : ''))).filter(Boolean);
  };

  const [editName, setEditName] = useState(station.name);
  const [editAddress, setEditAddress] = useState(station.address);
  const [editStatus, setEditStatus] = useState<SupplyStatus>(station.status);
  const [editNeeds, setEditNeeds] = useState<NeedItem[]>(station.needs || []);
  const [editOfferings, setEditOfferings] = useState<string[]>(normalizeToStrings(station.offerings as any));
  const [editRemarks, setEditRemarks] = useState<string>(station.remarks || '');
  const [editContact, setEditContact] = useState<string>(station.contactNumber || '');
  const [editMapLink, setEditMapLink] = useState<string>(station.mapLink || '');
  const [showNeedsSelector, setShowNeedsSelector] = useState(false);

  const getStatusTranslationKey = (status: SupplyStatus) => {
    switch (status) {
      case SupplyStatus.AVAILABLE: return 'status.available';
      case SupplyStatus.LOW_STOCK: return 'status.low_stock';
      case SupplyStatus.URGENT: return 'status.urgent';
      case SupplyStatus.NO_DATA: return 'status.no_data';
      case SupplyStatus.GOV_CONTROL: return 'status.gov_control';
      case SupplyStatus.PAUSED: return 'status.paused';
      default: return 'status.available';
    }
  };

  const toggleOffering = (item: string) => setEditOfferings(prev => prev.includes(item) ? prev.filter(o => o !== item) : [...prev, item]);
  const toggleNeed = (item: string) => setEditNeeds(prev => {
    const exists = prev.find(n => n.item === item);
    if (exists) return prev.filter(n => n.item !== item);
    return [...prev, { item, status: SupplyStatus.URGENT }];
  });

  const handleSave = async () => {
    const updated: any = {
      ...station,
      name: editName,
      address: editAddress,
      status: editStatus,
      needs: editNeeds,
      offerings: editOfferings.map(item => ({ item, status: SupplyStatus.AVAILABLE })),
      remarks: editRemarks,
      lastUpdated: Date.now(),
    };
    if (editContact && editContact.trim()) updated.contactNumber = editContact.trim();
    if (editMapLink && editMapLink.trim()) updated.mapLink = editMapLink.trim();

    try {
      await updateStationDetails(updated);
      onComplete();
    } catch (err) {
      console.error('Failed to update station', err);
      alert('Failed to update station');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center z-10">
          <h2 className="font-bold text-lg">{t('station.edit_station') || 'Edit Station'}</h2>
          <button onClick={onClose}><X size={24} className="text-gray-500"/></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('station.name') || 'Station Name'}</label>
            <input className="w-full p-2 border rounded-lg" value={editName} onChange={e => setEditName(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('add.contact') || 'Contact Number'}</label>
            <input className="w-full p-2 border rounded-lg" value={editContact} onChange={e => setEditContact(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('add.contact_link') || 'Map/Contact Link'}</label>
            <input className="w-full p-2 border rounded-lg" value={editMapLink} onChange={e => setEditMapLink(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('station.status') || 'Status'}</label>
            <div className="flex gap-2">
              {[SupplyStatus.AVAILABLE, SupplyStatus.LOW_STOCK, SupplyStatus.URGENT, SupplyStatus.NO_DATA, SupplyStatus.GOV_CONTROL, SupplyStatus.PAUSED].map(s => (
                <button key={s} onClick={() => setEditStatus(s)} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${editStatus === s ? 'bg-black text-white border-black' : 'bg-white border-gray-200'}`}>
                  {t(getStatusTranslationKey(s))}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('station.offerings_label') || 'Offerings'}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editOfferings.map(item => (
                <span key={item} onClick={() => toggleOffering(item)} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium cursor-pointer flex items-center">
                  {item} <X size={12} className="ml-1"/>
                </span>
              ))}
            </div>
            <CategorySelector
              selectedItems={editOfferings}
              onToggleItem={toggleOffering}
              itemClass="px-2 py-1 rounded-full text-xs border border-gray-200 mr-2 mb-2 inline-block"
              selectedItemClass="bg-green-500 text-white border-green-500"
              allowAddItem={true}
              allowAddCategory={true}
              onAddItem={(_cat, item) => { addOfferingItem(_cat, item); setEditOfferings(prev => [...prev, item]); }}
              onAddCategory={(cat) => addOfferingCategory(cat)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('station.remarks_label') || 'Remarks'}</label>
            <textarea value={editRemarks} onChange={e => setEditRemarks(e.target.value)} rows={3} className="w-full p-2 border rounded-lg" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('station.add_needs') || 'Needs'}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editNeeds.map(need => (
                <span key={need.item} onClick={() => toggleNeed(need.item)} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium cursor-pointer flex items-center">
                  {need.item} <X size={12} className="ml-1"/>
                </span>
              ))}
            </div>
            <button onClick={() => setShowNeedsSelector(!showNeedsSelector)} className="text-sm text-blue-600 font-bold flex items-center">
              <Plus size={16} className="mr-1"/> {t('btn.add')}
            </button>
            {showNeedsSelector && (
              <div className="mt-2 border rounded-lg p-2 bg-gray-50">
                <CategorySelector
                  selectedItems={editNeeds.map(n => n.item)}
                  onToggleItem={toggleNeed}
                  itemClass="px-2 py-1 rounded-full text-xs border border-gray-200 mr-2 mb-2 inline-block bg-white"
                  selectedItemClass="bg-red-500 text-white border-red-500"
                  itemsFilter={(item) => !editNeeds.find(n => n.item === item)}
                  allowAddItem={true}
                  allowAddCategory={true}
                  onAddItem={(_cat, item) => { addOfferingItem(_cat, item); setEditNeeds(prev => [...prev, { item, status: SupplyStatus.URGENT }]); }}
                  onAddCategory={(cat) => addOfferingCategory(cat)}
                />
              </div>
            )}
          </div>

          <button onClick={handleSave} className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-4">{t('btn.save') || 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
};

export default EditStationModal;
