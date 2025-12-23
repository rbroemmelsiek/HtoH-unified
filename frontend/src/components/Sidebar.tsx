

import React, { useRef, useState } from 'react';
import { AppConfig, Agent, AVAILABLE_TOOLS, TargetTool, TableDefinition, FieldDef, MesopType, AVAILABLE_VOICES } from '../types';
import { Settings, Upload, FileText, Trash2, Wrench, Database, UserCog, Plus, X, ExternalLink, Camera, Link as LinkIcon, Table, Download, Check, HardDrive, Volume2, Play, Loader2 } from 'lucide-react';
import { textToSpeech } from '../services/geminiService';

interface SidebarProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  currentAgent: Agent;
  updateAgent: (updatedAgent: Agent) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onSimulateTool: (tool: string) => void;
  onUploadToTool?: (target: TargetTool, data: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, currentAgent, updateAgent, isOpen, toggleSidebar, onSimulateTool, onUploadToTool }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const tableDefInputRef = useRef<HTMLInputElement>(null);
  
  const [isReading, setIsReading] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState('');
  const [selectedToolForEndpoint, setSelectedToolForEndpoint] = useState(AVAILABLE_TOOLS[0]);
  const [uploadTarget, setUploadTarget] = useState<TargetTool>('general');
  const [selectedTableId, setSelectedTableId] = useState<string>('contacts');
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const activeTableDef = config.tableDefinitions.find(t => t.id === selectedTableId);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsReading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      if (uploadTarget === 'general') {
        setConfig(prev => ({
          ...prev,
          corpusData: text,
          corpusFileName: file.name
        }));
      } else {
        if (onUploadToTool) {
          onUploadToTool(uploadTarget, text);
        }
      }
      setIsReading(false);
    };

    reader.onerror = () => {
      alert("Failed to read file");
      setIsReading(false);
    };

    reader.readAsText(file);
  };

  const handleTableDefUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              // Simple check if JSON
              if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                   const json = JSON.parse(text);
                   // Expecting format: { id, name, schema: [], ... } or just Schema []
                   // For robustness, let's assume if array, it's schema, if object, it's full def
                   let newDef: TableDefinition;
                   
                   if (Array.isArray(json)) {
                        newDef = {
                            id: selectedTableId,
                            name: activeTableDef?.name || 'New Table',
                            schema: json,
                            keyField: activeTableDef?.keyField || 'id',
                            labelField: activeTableDef?.labelField || 'name'
                        };
                   } else {
                        newDef = {
                            ...activeTableDef, // Fallback
                            ...json
                        };
                   }
                   
                   setConfig(prev => ({
                       ...prev,
                       tableDefinitions: prev.tableDefinitions.map(t => t.id === selectedTableId ? newDef : t)
                   }));
                   alert("Table definition updated successfully.");
              } else {
                  // Assume CSV - naive parser
                  // CSV format: Name, Type, Label, Options...
                  const lines = text.split('\n');
                  const schema: FieldDef[] = [];
                  lines.forEach((line, i) => {
                      if (i === 0) return; // Header
                      const parts = line.split(',').map(s => s.trim());
                      if (parts.length >= 2) {
                          schema.push({
                              name: parts[0] || `field_${i}`,
                              label: parts[2] || parts[0],
                              type: (parts[1] as MesopType) || 'Text',
                              options: parts[3] ? parts[3].split('|') : undefined
                          });
                      }
                  });
                   
                   const newDef = {
                        id: selectedTableId,
                        name: activeTableDef?.name || 'New Table',
                        schema: schema,
                        keyField: activeTableDef?.keyField || 'id',
                        labelField: activeTableDef?.labelField || 'name'
                   };
                   
                   setConfig(prev => ({
                       ...prev,
                       tableDefinitions: prev.tableDefinitions.map(t => t.id === selectedTableId ? newDef : t)
                   }));
                   alert("Table definition updated from CSV.");
              }
          } catch (err) {
              console.error(err);
              alert("Failed to parse table definition.");
          }
      };
      reader.readAsText(file);
  };

  const downloadTableDef = () => {
      if (!activeTableDef) return;
      const json = JSON.stringify(activeTableDef, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTableDef.id}_definition.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateAgent({
        ...currentAgent,
        imageUrl: result
      });
    };
    reader.readAsDataURL(file);
  };

  const clearCorpus = () => {
    setConfig(prev => ({
      ...prev,
      corpusData: '',
      corpusFileName: null
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleTool = (tool: string) => {
    const hasTool = currentAgent.tools.includes(tool);
    const newTools = hasTool 
      ? currentAgent.tools.filter(t => t !== tool)
      : [...currentAgent.tools, tool];
    
    updateAgent({
      ...currentAgent,
      tools: newTools
    });
  };

  const detectMime = (buffer: ArrayBuffer): string => {
    try {
      const bytes = new Uint8Array(buffer);
      const str4 = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
      if (str4 === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return "audio/mpeg";
      if (str4 === "OggS") return "audio/ogg";
      if (str4 === "fLaC") return "audio/flac";
      if (str4 === "RIFF") return "audio/wav";
    } catch (e) {
      console.warn("[TTS] detectMime failed", e);
    }
    return "audio/mpeg";
  };

  const handleTestVoice = async (voice: string) => {
    setIsTestingVoice(true);
    try {
        const tts = await textToSpeech(`Hello, I am ${voice}. I am ready to assist you with your real estate needs.`, voice);
        if (tts?.buffer) {
            const decodeBuffer = tts.buffer.slice(0);
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              if (ctx.state === 'suspended') {
                await ctx.resume();
              }
              const buffer = await ctx.decodeAudioData(decodeBuffer);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(0);
              return;
            } catch (decodeErr) {
              console.warn("[TTS] Web Audio decode failed in Sidebar, falling back to HTMLAudio", decodeErr);
            }

            // Fallback: HTMLAudio
            const mime = tts.mime || detectMime(tts.buffer);
            const url = tts.base64
              ? `data:${mime};base64,${tts.base64}`
              : URL.createObjectURL(new Blob([new Uint8Array(tts.buffer)], { type: mime }));
            const el = new Audio(url);
            el.onended = () => {
              if (!tts.base64 && url.startsWith("blob:")) URL.revokeObjectURL(url);
            };
            el.onerror = (err) => {
              console.error("[TTS] HTMLAudio playback failed in Sidebar", err);
              if (!tts.base64 && url.startsWith("blob:")) URL.revokeObjectURL(url);
            };
            const playPromise = el.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch((err) => {
                console.error("[TTS] HTMLAudio play() rejected in Sidebar", err);
                if (!tts.base64 && url.startsWith("blob:")) URL.revokeObjectURL(url);
              });
            }
        } else {
            console.warn('[TTS] No audio returned for test voice');
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsTestingVoice(false);
    }
  };

  const addCustomEndpoint = () => {
    if (!newEndpoint.trim()) return;
    const endpointString = `${selectedToolForEndpoint}: ${newEndpoint.trim()}`;
    const updatedEndpoints = [...(currentAgent.customEndpoints || []), endpointString];
    updateAgent({
      ...currentAgent,
      customEndpoints: updatedEndpoints
    });
    setNewEndpoint('');
  };

  const removeCustomEndpoint = (endpoint: string) => {
    const updatedEndpoints = (currentAgent.customEndpoints || []).filter(e => e !== endpoint);
    updateAgent({
      ...currentAgent,
      customEndpoints: updatedEndpoints
    });
  };

  const updateTableConfig = (key: keyof TableDefinition, val: any) => {
      setConfig(prev => ({
          ...prev,
          tableDefinitions: prev.tableDefinitions.map(t => t.id === selectedTableId ? { ...t, [key]: val } : t)
      }));
  };

  return (
    <>
      {/* Overlay - Click outside to close on all devices */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99]"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Panel - Z-Index set to 100 to ensure it is top-most */}
      <div className={`
        fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[100] border-l border-gray-100 flex flex-col font-sans
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F0F4FA]">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-lg font-serif">
            <Settings size={20} className="text-[#141D84]" />
            <span>Configuration</span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Close Sidebar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Agent Specific Settings */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#141D84]/5 p-4 border-b border-gray-100 flex items-center gap-3 relative group">
               <div className="relative">
                 <img src={currentAgent.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                 <button 
                   onClick={() => avatarInputRef.current?.click()}
                   className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                   title="Change Avatar"
                 >
                   <Camera size={16} />
                 </button>
                 <input 
                   type="file" 
                   ref={avatarInputRef} 
                   onChange={handleAvatarUpload} 
                   accept="image/*" 
                   className="hidden" 
                 />
               </div>
               <div>
                 <h3 className="font-bold text-[#141D84] text-sm">{currentAgent.name}</h3>
                 <span className="text-xs text-gray-500">Agent Settings</span>
               </div>
            </div>
            
            <div className="p-4 space-y-6">
              {/* System Prompt */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  <UserCog size={14} className="text-[#141D84]" />
                  System Instructions
                </h4>
                <textarea 
                  value={currentAgent.systemInstruction}
                  onChange={(e) => updateAgent({...currentAgent, systemInstruction: e.target.value})}
                  className="w-full h-32 p-3 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#141D84] focus:border-transparent outline-none resize-none bg-gray-50 text-gray-800"
                  placeholder="Define how this agent behaves..."
                />
              </div>

              {/* Tools Selection */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                  <Wrench size={14} className="text-[#141D84]" />
                  Assigned Tools
                </h4>
                <div className="space-y-1 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                  {AVAILABLE_TOOLS.map(tool => (
                    <React.Fragment key={tool}>
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F0F4FA] border border-transparent hover:border-gray-100 transition-all group">
                        {/* Checkbox for toggling */}
                        <div 
                          onClick={() => toggleTool(tool)}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          title="Toggle Tool Enabled"
                        >
                          <div className={`
                            w-5 h-5 rounded flex items-center justify-center border transition-colors
                            ${currentAgent.tools.includes(tool) ? 'bg-[#141D84] border-[#141D84]' : 'bg-white border-gray-300'}
                          `}>
                             {currentAgent.tools.includes(tool) && <CheckIcon className="text-white w-3 h-3" />}
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-[#141D84]">{tool}</span>
                        </div>
                        
                        {/* Link to simulate tool */}
                        <button 
                          onClick={() => onSimulateTool(tool)}
                          className="p-1 text-gray-400 hover:text-[#141D84] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Show tool in chat"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>

                      {/* Voice Configuration Sub-Panel */}
                      {tool === "Voice (TTS)" && currentAgent.tools.includes("Voice (TTS)") && (
                        <div className="ml-8 mt-1 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2">
                           <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                             <Volume2 size={12} /> Select Voice
                           </label>
                           <div className="flex gap-2 items-center">
                             <select
                               value={currentAgent.voiceName}
                               onChange={(e) => updateAgent({...currentAgent, voiceName: e.target.value as any})}
                               className="flex-1 p-1.5 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-[#141D84] outline-none text-gray-800"
                             >
                               {AVAILABLE_VOICES.map(voice => (
                                 <option key={voice} value={voice}>{voice}</option>
                               ))}
                             </select>
                             <button
                               onClick={() => handleTestVoice(currentAgent.voiceName)}
                               disabled={isTestingVoice}
                               className="p-1.5 bg-[#141D84] text-white rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                               title="Test Voice"
                             >
                               {isTestingVoice ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                             </button>
                           </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Custom Endpoints */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h5 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Google Native API Services</h5>
                  <div className="flex flex-col gap-2 mb-2">
                    <select
                      value={selectedToolForEndpoint}
                      onChange={(e) => setSelectedToolForEndpoint(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-[#141D84] outline-none bg-white text-gray-900"
                    >
                      {AVAILABLE_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newEndpoint}
                        onChange={(e) => setNewEndpoint(e.target.value)}
                        placeholder="Add endpoint URL..."
                        className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-[#141D84] outline-none"
                      />
                      <button 
                        onClick={addCustomEndpoint}
                        disabled={!newEndpoint.trim()}
                        className="p-1.5 bg-[#141D84]/10 text-[#141D84] rounded-md hover:bg-[#141D84]/20 disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {currentAgent.customEndpoints?.map((endpoint, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                        <div className="flex items-center gap-2 truncate flex-1 mr-2">
                          <LinkIcon size={10} className="text-[#141D84] flex-shrink-0" />
                          <span className="truncate text-gray-600" title={endpoint}>{endpoint}</span>
                        </div>
                        <button 
                          onClick={() => removeCustomEndpoint(endpoint)}
                          className="text-gray-400 hover:text-red-500 flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Configuration Section */}
          <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  <Table size={16} className="text-[#141D84]" />
                  Table Configuration
              </h3>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Select Table</label>
                      <select 
                          className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#141D84] outline-none bg-white text-gray-900"
                          value={selectedTableId}
                          onChange={(e) => setSelectedTableId(e.target.value)}
                      >
                          {config.tableDefinitions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                  </div>
                  
                  {activeTableDef && (
                      <div className="space-y-4 animate-in fade-in">
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Key Field</label>
                                  <select 
                                      className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-900"
                                      value={activeTableDef.keyField}
                                      onChange={(e) => updateTableConfig('keyField', e.target.value)}
                                  >
                                      {activeTableDef.schema.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Label Field</label>
                                  <select 
                                      className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-900"
                                      value={activeTableDef.labelField}
                                      onChange={(e) => updateTableConfig('labelField', e.target.value)}
                                  >
                                      {activeTableDef.schema.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                  </select>
                              </div>
                          </div>

                          <div className="flex gap-2">
                              <button 
                                  onClick={downloadTableDef}
                                  className="flex-1 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                              >
                                  <Download size={14} /> Download Def
                              </button>
                              <div className="flex-1 relative">
                                  <input 
                                      type="file" 
                                      ref={tableDefInputRef}
                                      onChange={handleTableDefUpload}
                                      className="hidden"
                                      accept=".json,.csv"
                                  />
                                  <button 
                                      onClick={() => tableDefInputRef.current?.click()}
                                      className="w-full py-2 bg-[#141D84] rounded-lg text-xs font-bold text-white hover:bg-blue-900 flex items-center justify-center gap-2 shadow-sm"
                                  >
                                      <Upload size={14} /> Upload Def
                                  </button>
                              </div>
                          </div>
                          
                          <div className="p-2 bg-gray-50 rounded border border-gray-100 text-[10px] text-gray-500">
                             Supports JSON (full definition) or CSV (schema only). CSV Header: Name, Type, Label, Options
                          </div>
                      </div>
                  )}
              </div>
          </section>

          {/* Global Settings Section */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              <Database size={16} className="text-[#141D84]" />
              Global Settings
            </h3>
            
            <div className="bg-[#F0F4FA] border border-blue-100 rounded-xl p-4">
              <div className="mb-4">
                 <label className="block text-xs font-medium text-[#141D84] mb-2 flex items-center gap-1">
                    <HardDrive size={12}/> File Upload Limit (MB)
                 </label>
                 <input 
                    type="number"
                    value={config.maxFileSizeMB}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxFileSizeMB: Number(e.target.value) }))}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm outline-none"
                    min="1"
                    max="100"
                 />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-[#141D84] mb-2">Knowledge Base Upload Target</label>
                <div className="flex gap-2 mb-3">
                  {(['general', 'forms', 'contacts'] as TargetTool[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setUploadTarget(type)}
                      className={`
                        flex-1 py-1.5 text-xs rounded border capitalize transition-colors
                        ${uploadTarget === type 
                          ? 'bg-[#141D84] text-white border-[#141D84]' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-medium text-[#141D84] mb-2">Select Active Corpus</label>
                <select 
                  className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#141D84] outline-none bg-white text-gray-900"
                  value={config.corpusFileName || ""}
                  onChange={(e) => {
                     if (e.target.value === "") clearCorpus();
                  }}
                >
                  <option value="">None (General Knowledge)</option>
                  {config.corpusFileName && <option value={config.corpusFileName}>{config.corpusFileName}</option>}
                </select>
              </div>

              {!config.corpusFileName ? (
                <div className="text-center mt-2">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.md,.json,.csv"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isReading}
                    className="w-full py-3 border border-dashed border-[#5D73CD] rounded-lg hover:bg-[#141D84]/5 transition-colors flex items-center justify-center gap-2 text-[#141D84] text-sm font-medium"
                  >
                    <Upload size={16} />
                    {isReading ? "Reading..." : "Upload New File"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100 shadow-sm mt-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-[#141D84]/10 p-2 rounded-md">
                      <FileText size={18} className="text-[#141D84]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate block">
                        {config.corpusFileName}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={clearCorpus}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);