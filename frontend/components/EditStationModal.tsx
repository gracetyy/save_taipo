import React, { useState, useEffect } from 'react';
import { Station, SupplyStatus, NeedItem } from '../types';
import { updateStationDetails, addOfferingItem, addOfferingCategory } from '../services/dataService';
import { X, Check, Plus, AlertTriangle, BadgeCheck } from 'lucide-react';
import { CategorySelector } from './CategorySelector';

interface EditStationModalProps {
    station: Station;
    onClose: () => void;
    onComplete: () => void;
}

export const EditStationModal: React.FC<EditStationModalProps> = ({ station, onClose, onComplete }) => {
    const [editName, setEditName] = useState(station.name);
    const [editAddress, setEditAddress] = useState(station.address);
    const [editStatus, setEditStatus] = useState<SupplyStatus>(station.status);
    const [editNeeds, setEditNeeds] = useState<NeedItem[]>(station.needs || []);
    const [editOfferings, setEditOfferings] = useState<string[]>(station.offerings || []);
    const [showNeedsSelector, setShowNeedsSelector] = useState(false);

    const handleSave = async () => {
        const updated = {
            ...station,
            name: editName,
            address: editAddress,
            status: editStatus,
            needs: editNeeds,
            offerings: editOfferings,
            lastUpdated: Date.now()
        };
        try {
            await updateStationDetails(updated);
            onComplete();
        } catch (error) {
            console.error("Failed to update station", error);
            alert("Failed to update station");
        }
    };

    const toggleOffering = (item: string) => {
        setEditOfferings(prev => 
            prev.includes(item) ? prev.filter(o => o !== item) : [...prev, item]
        );
    };

    const toggleNeed = (item: string) => {
        setEditNeeds(prev => {
            const existing = prev.find(n => n.item === item);
            if (existing) return prev.filter(n => n.item !== item);
            return [...prev, { item, quantity: undefined }];
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center z-10">
                    <h2 className="font-bold text-lg">Edit Station</h2>
                    <button onClick={onClose}><X size={24} className="text-gray-500"/></button>
                </div>
                
                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Station Name</label>
                        <input className="w-full p-2 border rounded-lg" value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status</label>
                        <div className="flex gap-2">
                            {[SupplyStatus.AVAILABLE, SupplyStatus.LOW_STOCK, SupplyStatus.EMPTY_CLOSED].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setEditStatus(s)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${editStatus === s ? 'bg-black text-white border-black' : 'bg-white border-gray-200'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Offerings</label>
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
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Needs</label>
                         <div className="flex flex-wrap gap-2 mb-2">
                            {editNeeds.map(need => (
                                <span key={need.item} onClick={() => toggleNeed(need.item)} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium cursor-pointer flex items-center">
                                    {need.item} <X size={12} className="ml-1"/>
                                </span>
                            ))}
                        </div>
                        <button 
                            onClick={() => setShowNeedsSelector(!showNeedsSelector)}
                            className="text-sm text-blue-600 font-bold flex items-center"
                        >
                            <Plus size={16} className="mr-1"/> Add Needs
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
                                    onAddItem={(_cat, item) => { addOfferingItem(_cat, item); setEditNeeds(prev => [...prev, { item }]); }}
                                    onAddCategory={(cat) => addOfferingCategory(cat)}
                                />
                            </div>
                        )}
                    </div>

                    <button onClick={handleSave} className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-4">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
