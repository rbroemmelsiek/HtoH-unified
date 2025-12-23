
import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  meta: any;
}

const USER_TYPES = ['YouTuber', 'Editor', 'Designer', 'Developer', 'Hobbyist', 'Realtor'];
const FEEDBACK_TYPES = ['Feature Request', 'Bug Report', 'UX Issue', 'Other'];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, meta }) => {
  const [selectedRole, setSelectedRole] = useState('Hobbyist');
  const [feedbackType, setFeedbackType] = useState('Feature Request');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      feedback: {
        userType: selectedRole,
        type: feedbackType,
        text: comment,
        rating: rating
      },
      context: meta
    };
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate net lag
    onSubmit(payload);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="bg-[#141D84] p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-comment-dots text-sm"></i>
            </div>
            <h3 className="font-bold text-lg">Share Feedback</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          
          {/* User Type Chips */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">I am a...</label>
            <div className="flex flex-wrap gap-2">
              {USER_TYPES.map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${selectedRole === role 
                      ? 'bg-[#141D84] text-white border-[#141D84] shadow-md' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#141D84]/50 hover:bg-gray-50'}
                  `}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Type */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Feedback Type</label>
            <div className="relative">
              <select 
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#141D84] outline-none appearance-none"
              >
                {FEEDBACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <i className="fa-solid fa-chevron-down text-xs"></i>
              </div>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Your Thoughts</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you think..."
              rows={4}
              className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#141D84] outline-none resize-none placeholder-gray-400"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Satisfaction Rating (Optional)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <button
                  key={r}
                  onClick={() => setRating(r)}
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border transition-all
                    ${rating === r 
                      ? 'bg-[#141D84] text-white border-[#141D84]' 
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                  `}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Hidden Tech Info Preview (Optional visualization for dev) */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono uppercase mb-1">
              <i className="fa-solid fa-code"></i> Captured Context
            </div>
            <div className="text-[10px] text-gray-500 font-mono truncate">
              Agent: {meta?.activeAgent || 'None'} | Route: {meta?.currentRoute}
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#141D84] text-white text-sm font-bold rounded-full hover:brightness-110 shadow-lg disabled:opacity-70 flex items-center gap-2"
          >
            {isSubmitting ? 'Sending...' : (
              <>
                Submit Feedback <i className="fa-solid fa-paper-plane text-xs"></i>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
