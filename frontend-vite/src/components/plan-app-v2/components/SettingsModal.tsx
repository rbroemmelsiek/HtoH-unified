
import React, { useState, useEffect } from 'react';
import { usePlan } from '../context/PlanContext';
import { findRowInTree } from '../utils/planHelpers';
import { XIcon, ChevronRightIcon, ChevronLeftIcon, SettingsIcon } from './Icons';
import { MesopField } from './FormsWidget';

const PAGES = ['General Info', 'Link Config', 'Media & Scheduling'];

const SettingsModal: React.FC = () => {
  const { state, dispatch } = usePlan();
  const { isOpen, rowId } = state.settingsModal;

  const [activePage, setActivePage] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    tooltip: '',
    link: '',
    new_window: true,
    video: '',
    video_script: '',
    date: '', // Will store as YYYY-MM-DDTHH:mm for input
  });

  const row = rowId ? findRowInTree(state.plan.root.children, rowId) : null;

  useEffect(() => {
    if (isOpen && row) {
      // Reset to first page on open
      setActivePage(0);
      setFormData({
        name: row.name || '',
        tooltip: row.tooltip || '',
        link: row.link || '',
        new_window: row.new_window,
        video: row.video || '',
        video_script: row.video_script || '',
        date: timestampToDateInput(row.date),
      });
    }
  }, [isOpen, row]);

  if (!isOpen || !row) return null;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_SETTINGS' });
  };

  const handleSave = () => {
    if (!rowId) return;
    
    dispatch({
      type: 'UPDATE_ROW_SETTINGS',
      payload: {
        eid: rowId,
        updates: {
          name: formData.name,
          tooltip: formData.tooltip,
          link: formData.link,
          new_window: formData.new_window,
          video: formData.video,
          video_script: formData.video_script,
          date: dateInputToTimestamp(formData.date),
        }
      }
    });
    handleClose();
  };

  // Generic handler for MesopField onChange
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (activePage < PAGES.length - 1) {
      setActivePage(prev => prev + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (activePage > 0) {
      setActivePage(prev => prev - 1);
    }
  };

  // --- Helpers ---
  const timestampToDateInput = (ts: string | null): string => {
    if (!ts) return '';
    const date = new Date(parseInt(ts) * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const dateInputToTimestamp = (val: string): string | null => {
    if (!val) return null;
    const date = new Date(val);
    return Math.floor(date.getTime() / 1000).toString();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 p-4 bg-black/60 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Dark Blue Header */}
        <div className="bg-[#141D84] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-1.5 bg-white/10 rounded-lg">
                 <SettingsIcon className="w-5 h-5 text-white" />
             </div>
             <h2 className="text-xl font-bold text-white tracking-wide">Task Settings</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper / Tabs */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
            {PAGES.map((page, idx) => (
                <div 
                    key={page} 
                    className={`flex items-center gap-2 text-sm font-medium ${idx === activePage ? 'text-[#141D84]' : 'text-gray-400'}`}
                >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${idx === activePage ? 'bg-[#141D84] text-white border-[#141D84]' : 'bg-white border-gray-300'}`}>
                        {idx + 1}
                    </div>
                    <span className="hidden sm:inline">{page}</span>
                    {idx < PAGES.length - 1 && (
                        <div className="w-8 h-[1px] bg-gray-300 mx-2 hidden sm:block"></div>
                    )}
                </div>
            ))}
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-8 flex-grow">
          
          {/* Page 0: General */}
          {activePage === 0 && (
            <div className="space-y-6 animate-fadeIn">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
                    <h3 className="font-bold text-xl text-[#141D84] mb-1">{formData.name || 'New Item'}</h3>
                    <p className="text-sm text-gray-500">Configure the basic identity of this item.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <MesopField
                        type="Name"
                        label="Name"
                        value={formData.name}
                        onChange={(v) => updateField('name', v)}
                        placeholder="e.g., Safety Check"
                        description="The main title displayed in the plan list."
                    />
                    
                    <MesopField
                        type="Text"
                        label="Brief summary"
                        value={formData.tooltip}
                        onChange={(v) => updateField('tooltip', v)}
                        placeholder="e.g., Ensure power is stable..."
                        description="Text shown when hovering over the info icon."
                    />

                    <MesopField
                        type="DateTime"
                        label="Due Date"
                        value={formData.date}
                        onChange={(v) => updateField('date', v)}
                        description="Optional deadline or scheduled time."
                    />
                </div>
            </div>
          )}

          {/* Page 1: Link */}
          {activePage === 1 && (
            <div className="space-y-6 animate-fadeIn">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
                    <h3 className="font-bold text-xl text-[#141D84] mb-1">Link Configuration</h3>
                    <p className="text-sm text-gray-500">Attach external resources or documentation.</p>
                </div>

                 <MesopField
                    type="Url"
                    label="Destination URL"
                    value={formData.link}
                    onChange={(v) => updateField('link', v)}
                    placeholder="https://example.com"
                    description="Full web address (https://...)."
                 />

                 <MesopField
                    type="Yes/No"
                    label="Open in new window"
                    value={formData.new_window}
                    onChange={(v) => updateField('new_window', v)}
                    description="Keep the plan open in the background."
                 />
            </div>
          )}

          {/* Page 2: Media */}
          {activePage === 2 && (
            <div className="space-y-6 animate-fadeIn">
                 <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
                    <h3 className="font-bold text-xl text-[#141D84] mb-1">Media & Script</h3>
                    <p className="text-sm text-gray-500">Embed videos and internal notes.</p>
                </div>

                <MesopField
                    type="Url"
                    label="Video URL"
                    value={formData.video}
                    onChange={(v) => updateField('video', v)}
                    placeholder="e.g. YouTube URL"
                    description="YouTube or supported video link."
                />

                <MesopField
                    type="LongText"
                    label="Script / Notes"
                    value={formData.video_script}
                    onChange={(v) => updateField('video_script', v)}
                    placeholder="Enter content here..."
                    description="Internal notes or script for the video."
                />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white border-t border-gray-200 flex justify-between items-center flex-shrink-0">
            {activePage > 0 ? (
                <button
                    onClick={handleBack}
                    className="flex items-center text-gray-500 hover:text-gray-800 font-semibold text-sm transition-colors uppercase tracking-wider"
                >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" /> Back
                </button>
            ) : (
                <button
                    onClick={handleClose}
                     className="text-red-500 hover:text-red-700 font-semibold text-sm transition-colors uppercase tracking-wider"
                >
                    Cancel
                </button>
            )}

            <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                <span>{activePage + 1} / {PAGES.length}</span>
                <button
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-[#141D84] text-white rounded shadow hover:bg-blue-900 transition-all font-semibold text-sm flex items-center gap-2"
                >
                    {activePage === PAGES.length - 1 ? 'SAVE CHANGES' : 'NEXT'}
                    {activePage < PAGES.length - 1 && <ChevronRightIcon className="w-4 h-4" />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
