import React, { useState } from 'react';
import { User, Heart } from 'lucide-react';
import { UserRole } from '../../types';

interface PreLoginOnboardingProps {
  onRoleSelected: (role: UserRole) => void;
  onComplete: () => void;
}

export const PreLoginOnboarding: React.FC<PreLoginOnboardingProps> = ({ onRoleSelected, onComplete }) => {
  const [step, setStep] = useState(0);

  const handleRoleSelection = (role: UserRole) => {
    onRoleSelected(role);
    onComplete();
  };

  if (step === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="p-6 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">👋</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Tai Po Rescue</h1>
              <p className="text-gray-600">
                We connect neighbors to help each other during emergencies.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 text-center">How would you like to participate?</h2>
          <button
            onClick={() => handleRoleSelection(UserRole.RESIDENT)}
            className="w-full p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-500 flex items-center space-x-3 transition-all"
          >
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">I need help</div>
              <div className="text-sm text-gray-600">Find supplies, stations, and support.</div>
            </div>
          </button>
          <button
            onClick={() => handleRoleSelection(UserRole.VOLUNTEER)}
            className="w-full p-4 border rounded-lg hover:bg-green-50 hover:border-green-500 flex items-center space-x-3 transition-all"
          >
            <div className="bg-green-100 p-2 rounded-full">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">I want to volunteer</div>
              <div className="text-sm text-gray-600">Join teams and assist others.</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
