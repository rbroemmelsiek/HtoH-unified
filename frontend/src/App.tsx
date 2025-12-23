
import React, { useState, useRef, useEffect } from 'react';
import { Message, AppConfig, Suggestion, INITIAL_AGENTS, Agent, ExpandedWidgetType, TargetTool, TableDefinition, TRANSACTIONAL_SERVICES, VENDOR_SERVICES } from './types';
import { sendMessageToGemini, generateSuggestions } from './services/geminiService';
import { Sidebar } from './components/Sidebar';
import { PromptSlider } from './components/PromptSlider';
import { MessageBubble } from './components/MessageBubble';
import { AgentSelector } from './components/AgentSelector';
import { CalculatorBar } from './components/CalculatorBar';
import { ExpandedWidgetPanel } from './components/ExpandedWidgetPanel';
import { Send, Menu, Loader2, Mic, Plus, Calendar, MapPin, Play, BarChart3, FileText, Users, Maximize2, Minimize2, Home, ChevronRight, Briefcase, Truck, Image as ImageIcon, ArrowLeft, ClipboardCheck, BookOpen, BookText, LayoutGrid, GraduationCap } from 'lucide-react';
import AcademyApp from './components/ai-academy-v1/App';

// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion

// Default Schema for Contacts to start with
const DEFAULT_CONTACTS_DEF: TableDefinition = {
  id: 'contacts',
  name: 'Contacts Directory',
  schema: [
    { name: 'name', label: 'Full Name', type: 'Name' },
    { name: 'role', label: 'Role / Title', type: 'Text' },
    { name: 'company', label: 'Company', type: 'Text' },
    { name: 'category', label: 'Category', type: 'Enum', options: ['party', 'provider', 'vendor'] },
    { name: 'isFavorite', label: 'Favorite?', type: 'Yes/No' },
    { label: 'Contact Info', name: 'contact_header', type: 'SectionHeader' },
    { name: 'phone', label: 'Phone Number', type: 'Phone' },
    { name: 'email', label: 'Email Address', type: 'Email' },
    { label: 'Details', name: 'details_break', type: 'PageBreak' },
    { name: 'address', label: 'Mailing Address', type: 'Address' },
    { name: 'imageUrl', label: 'Profile Photo', type: 'Image' },
    { name: 'notes', label: 'Private Notes', type: 'LongText' },
  ],
  keyField: 'id',
  labelField: 'name'
};

type ToolsMenuMode = 'main' | 'services' | 'transactional' | 'vendor';
type AppView = 'dashboard' | 'academy';

function App() {
  // Navigation state - Dashboard or Academy
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  // Load agents from localStorage or fallback to INITIAL_AGENTS
  const [agents, setAgents] = useState<Agent[]>(() => {
    try {
      const saved = localStorage.getItem('hometohome_agents');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if Array, has items, and LENGTH MATCHES INITIAL_AGENTS (Forces update if new agents added)
        if (Array.isArray(parsed) && parsed.length === INITIAL_AGENTS.length && parsed[0].id) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load agents from localStorage", e);
    }
    return INITIAL_AGENTS;
  });

  const [currentAgentId, setCurrentAgentId] = useState<string>(() => {
    return (agents && agents.length > 0) ? agents[0].id : INITIAL_AGENTS[0].id;
  });

  const currentAgent = agents.find(a => a.id === currentAgentId) || agents[0] || INITIAL_AGENTS[0];

  // Save agents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hometohome_agents', JSON.stringify(agents));
  }, [agents]);

  // State for Chat
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Welcome. I am the Ai Ethics Advisor, here to ensure your real estate transactions are compliant and fair. You can also consult with the Key Maker, Termsheet Expert, Negotiating Coach, or your Forms Librarian using the menu above. How can we assist you today?",
      timestamp: new Date(),
      agentId: 'ethics_advisor'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tools Menu State
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [toolsMenuMode, setToolsMenuMode] = useState<ToolsMenuMode>('main');

  // Message Box Logic
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const [showCollapseToggle, setShowCollapseToggle] = useState(false);

  // State for Widgets
  const [expandedWidget, setExpandedWidget] = useState<ExpandedWidgetType>(null);
  const [expandedWidgetData, setExpandedWidgetData] = useState<any>(null); // To pass specific record ID or data
  const [expandedInstance, setExpandedInstance] = useState(0); // Force remount per open to avoid stale widget state
  const [splitRatio, setSplitRatio] = useState(0.5); // Desktop split between chat and expansion
  const [isResizingSplit, setIsResizingSplit] = useState(false);

  // State for Calculator Bar
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(true);
  const [isCalculatorExpanded, setIsCalculatorExpanded] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState('850000.00');
  const [lastScrollTop, setLastScrollTop] = useState(0);

  // State for STT
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Config State
  const [config, setConfig] = useState<AppConfig>({
    corpusData: '',
    corpusFileName: null,
    tableDefinitions: [DEFAULT_CONTACTS_DEF],
    maxFileSizeMB: 5 // Default 5MB
  });

  // Upload Data States
  const [contactsData, setContactsData] = useState<string | undefined>(undefined);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const hiddenImageInputRef = useRef<HTMLInputElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only auto-scroll when message content changes (new message or typing state),
    // not when widgets expand/collapse, to avoid jumpy feed during widget summon.
    scrollToBottom();
  }, [messages, isTyping]);

  // Listen for nav bar clicks from Plan App to expand widget
  useEffect(() => {
    const handlePlanNavClick = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[App] Nav bar clicked, expanding Plan widget', customEvent.detail);
      // If widget is not expanded, expand it
      if (expandedWidget !== 'plan') {
        setExpandedWidget('plan');
        setExpandedWidgetData({
          planId: 'plan',
          ownerId: '0'
        });
      }
    };

    window.addEventListener('plan-nav-click', handlePlanNavClick);
    return () => {
      window.removeEventListener('plan-nav-click', handlePlanNavClick);
    };
  }, [expandedWidget]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;

      // Check if content exceeds a single line threshold (approx 40px)
      if (scrollHeight > 48) {
        setShowCollapseToggle(true);
      } else {
        setShowCollapseToggle(false);
        setIsInputCollapsed(false);
      }

      if (isInputCollapsed) {
        inputRef.current.style.height = '40px'; // Compact collapsed height
        inputRef.current.style.overflowY = 'auto';
      } else {
        // Cap max height at 150px
        inputRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
        inputRef.current.style.overflowY = scrollHeight > 150 ? 'auto' : 'hidden';
      }
    }
  }, [inputValue, isInputCollapsed]);

  // Scroll Listener for Calculator Bar
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If expanded, always keep visible and ignore scroll hide logic
      if (isCalculatorExpanded) {
        setIsCalculatorVisible(true);
        return;
      }

      const currentScrollTop = container.scrollTop;

      // Only toggle if there's significant scrolling to prevent jitter
      if (Math.abs(currentScrollTop - lastScrollTop) > 10) {
        if (currentScrollTop > lastScrollTop && currentScrollTop > 50) {
          // Scrolling down -> Hide
          setIsCalculatorVisible(false);
        } else {
          // Scrolling up -> Show
          setIsCalculatorVisible(true);
        }
        setLastScrollTop(currentScrollTop);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [lastScrollTop, isCalculatorExpanded]);

  const handleCalculatorExpand = (expanded: boolean) => {
    setIsCalculatorExpanded(expanded);
    if (expanded && scrollContainerRef.current) {
      // Scroll to top so the non-sticky expanded bar is visible from the start
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      setIsCalculatorVisible(true);
    }
  };

  // Split pane drag handlers (desktop expansion view)
  useEffect(() => {
    const handleMove = (event: MouseEvent | TouchEvent) => {
      if (!isResizingSplit || !splitContainerRef.current) return;
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      // Constrain between 30% and 70% to keep both panes usable
      const clamped = Math.min(0.7, Math.max(0.3, ratio));
      setSplitRatio(clamped);
    };

    const handleUp = () => setIsResizingSplit(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isResizingSplit]);

  const handleStartResize = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    setIsResizingSplit(true);
  };

  // Helper to fetch suggestions
  const fetchSuggestions = async (msgs: Message[], agent: Agent) => {
    setIsGeneratingSuggestions(true);
    try {
      let lastUserText = "No previous user input";
      let lastModelText = agent.systemInstruction;

      if (msgs.length > 0) {
        const lastModel = [...msgs].reverse().find(m => m.role === 'model');
        const lastUser = [...msgs].reverse().find(m => m.role === 'user');
        if (lastModel) lastModelText = lastModel.text;
        if (lastUser) lastUserText = lastUser.text;
      }

      const suggestionTexts = await generateSuggestions(msgs, lastUserText, lastModelText);

      const newSuggestions = suggestionTexts.map((txt, idx) => ({
        id: `sugg-${Date.now()}-${idx}`,
        text: txt
      }));
      setSuggestions(newSuggestions);
    } catch (err) {
      setSuggestions([]);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Initial Load Suggestions
  useEffect(() => {
    fetchSuggestions(messages, currentAgent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When Agent Changes, Regenerate Suggestions
  useEffect(() => {
    if (!isTyping) {
      fetchSuggestions(messages, currentAgent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAgentId]);

  // Update Agent Logic
  const handleUpdateAgent = (updatedAgent: Agent) => {
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
  };

  // Upload Logic Routing
  const handleUploadToTool = (target: TargetTool, data: string) => {
    if (target === 'contacts') {
      setContactsData(data);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `I've loaded the contacts data. You can now open the Contacts Directory to see the updates. [[WIDGET:Contacts]]`,
        timestamp: new Date(),
        agentId: currentAgent.id
      }]);
    } else if (target === 'forms') {
      setConfig(prev => ({
        ...prev,
        corpusData: data
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        corpusData: data
      }));
    }
  };

  // Chat Attachment Logic
  const handleChatFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > config.maxFileSizeMB) {
      alert(`File too large. Maximum size is ${config.maxFileSizeMB}MB.`);
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: `[Attached ${type}: ${file.name}]`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate AI response acknowledgment
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `I've received the ${type} "${file.name}". How would you like me to process it?`,
        timestamp: new Date(),
        agentId: currentAgent.id
      };
      setMessages(prev => [...prev, botMsg]);
    }, 600);

    setShowToolsMenu(false);
    // Reset inputs
    if (hiddenFileInputRef.current) hiddenFileInputRef.current.value = '';
    if (hiddenImageInputRef.current) hiddenImageInputRef.current.value = '';
  };

  // Speech Recognition Logic
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleExpandWidget = (type: ExpandedWidgetType, data?: any) => {
    setExpandedWidget(type);
    setExpandedWidgetData(data);
    setExpandedInstance(prev => prev + 1);
  };

  const handleCloseWidget = () => {
    setExpandedWidget(null);
    setExpandedWidgetData(null);
    setExpandedInstance(prev => prev + 1); // bump key so next open remounts fresh
    // Force a layout recalculation by triggering a resize event
    // This helps AgentSelector recalculate scroll positions
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  // Handlers
  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);
    setSuggestions([]);

    try {
      const responseText = await sendMessageToGemini(messages, text, config, currentAgent);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
        agentId: currentAgent.id
      };

      setMessages(prev => {
        const newHistory = [...prev, botMessage];
        fetchSuggestions(newHistory, currentAgent);
        return newHistory;
      });

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error processing your request.",
        timestamp: new Date(),
        isError: true,
        agentId: currentAgent.id
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionSelect = (text: string) => {
    handleSendMessage(text);
  };

  const handleSimulateTool = (toolName: string) => {
    __agentLog('H7','App.tsx:simulateTool','simulate tool clicked',{toolName});
    setIsSidebarOpen(false);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: `Show me the ${toolName} interface.`,
      timestamp: new Date()
    };

    let responseText = `Activating ${toolName}...`;
    let extraText = "";

    if (toolName.includes('Calendar')) {
      responseText = `Here is the calendar integration view. [[WIDGET:Calendar]]`;
    } else if (toolName.includes('Maps')) {
      responseText = `I've pulled up the location on Maps. [[WIDGET:Maps]]`;
    } else if (toolName.includes('Places')) {
      responseText = `Here are some relevant places nearby. [[WIDGET:Places]]`;
    } else if (toolName.includes('YouTube')) {
      responseText = `Here is the relevant video content. [[WIDGET:YouTube]]`;
    } else if (toolName.includes('Graph')) {
      responseText = `Here is the data visualization. [[WIDGET:Graph]]`;
    } else if (toolName.includes('Forms')) {
      responseText = `Opening the Transaction Wizard. [[WIDGET:Forms]]`;
    } else if (toolName.includes('Contacts')) {
      responseText = `Opening the Contacts Directory. [[WIDGET:Contacts]]`;
    } else if (toolName.includes('Plan') || toolName.includes('Service Plan')) {
      responseText = `Opening the Service Plan widget. [[WIDGET:Plan]]`;
    } else if (toolName.includes('Academy')) {
      responseText = `Opening Ai Academy. [[WIDGET:Academy]]`;
      __agentLog('H7','App.tsx:openWidget','open academy from menu',{});
      // Navigate to Academy view instead of opening as widget
      setCurrentView('academy');
    } else if (toolName.includes('PDF Viewer') || toolName.includes('Kindle')) {
      responseText = `Opening PDF Viewer. [[WIDGET:PDFViewer]]`;
      __agentLog('H7','App.tsx:openWidget','open pdf viewer from menu',{});
      setExpandedWidget('kindle');
      setExpandedWidgetData({ agentId: currentAgent.id, agentName: currentAgent.name });
      setExpandedInstance(prev => prev + 1);
    }
    else if (toolName.includes('Ai Hub')) {
      responseText = `Opening Ai Hub. [[WIDGET:AcademyHub]]`;
      __agentLog('H7','App.tsx:openWidget','open academy hub from menu',{});
      setExpandedWidget('academy_hub');
      setExpandedWidgetData({ agentId: currentAgent.id, agentName: currentAgent.name });
      setExpandedInstance(prev => prev + 1);
    } else {
      responseText = `[System]: The ${toolName} widget is active.`;
    }

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText + (extraText ? ` ${extraText}` : ''),
      timestamp: new Date(),
      agentId: currentAgent.id
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setTimeout(scrollToBottom, 100);
  };

  // Service Selection Handler
  const handleServiceSelect = (service: string) => {
    setShowToolsMenu(false);
    setToolsMenuMode('main');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: `Find me a ${service}.`,
      timestamp: new Date()
    };

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: `Searching Contacts Directory for "${service}"... [[WIDGET:Contacts]]`,
      timestamp: new Date(),
      agentId: currentAgent.id
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setTimeout(scrollToBottom, 100);

    // Pass the filter to the widget if needed by setting expanded data
    setExpandedWidgetData(service); // ContactsWidget can check this to pre-filter
  };

  // Render Tool Menu Content based on Mode
  const renderToolsMenu = () => {
    if (toolsMenuMode === 'main') {
      return (
        <>
          <div className="text-xs font-bold text-gray-400 uppercase px-2 py-1 mb-1">Summon Widget</div>
          <button onClick={() => setToolsMenuMode('services')} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-[#F0F4FA] hover:text-[#141D84] rounded-lg transition-colors justify-between">
            <div className="flex items-center gap-2"><Briefcase size={16} /> Services</div>
            <ChevronRight size={14} className="text-gray-400" />
          </button>
          <button onClick={() => hiddenFileInputRef.current?.click()} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-[#F0F4FA] hover:text-[#141D84] rounded-lg transition-colors">
            <FileText size={16} /> Add File
          </button>
          <button onClick={() => hiddenImageInputRef.current?.click()} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-[#F0F4FA] hover:text-[#141D84] rounded-lg transition-colors">
            <ImageIcon size={16} /> Add Image
          </button>
          <div className="h-px bg-gray-100 my-1"></div>
          {[
            { icon: ClipboardCheck, label: 'Service Plan', tool: 'Service Plan Widget' },
            { icon: FileText, label: 'Forms Wizard', tool: 'Forms Library' },
            { icon: Users, label: 'Contacts', tool: 'Contacts Directory' },
            { icon: Calendar, label: 'Calendar', tool: 'Calendar Integration' },
            { icon: MapPin, label: 'Map View', tool: 'Google Maps API' },
            { icon: Play, label: 'YouTube', tool: 'YouTube Data API' },
            { icon: BarChart3, label: 'Graph', tool: 'Graph Widget' },
            { icon: BookOpen, label: 'Ai Academy', tool: 'Ai Academy' },
            { icon: BookText, label: 'PDF Viewer', tool: 'PDF Viewer' }
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => { setShowToolsMenu(false); handleSimulateTool(item.tool); }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-[#F0F4FA] hover:text-[#141D84] rounded-lg transition-colors"
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </>
      );
    } else if (toolsMenuMode === 'services') {
      return (
        <>
          <div className="flex items-center gap-2 px-2 py-1 mb-1 text-gray-500 cursor-pointer hover:text-[#141D84]" onClick={() => setToolsMenuMode('main')}>
            <ArrowLeft size={14} /> <span className="text-xs font-bold uppercase">Back</span>
          </div>
          <button onClick={() => setToolsMenuMode('transactional')} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-[#F0F4FA] hover:text-[#141D84] rounded-lg transition-colors justify-between">
            <div className="flex items-center gap-2"><Briefcase size={16} /> Transactional Services</div>
            <ChevronRight size={14} className="text-gray-400" />
          </button>
          <button onClick={() => setToolsMenuMode('vendor')} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-[#F0F4FA] hover:text-[#141D84] rounded-lg transition-colors justify-between">
            <div className="flex items-center gap-2"><Truck size={16} /> Vendor Services</div>
            <ChevronRight size={14} className="text-gray-400" />
          </button>
        </>
      );
    } else {
      // List View (Transactional or Vendor)
      const list = toolsMenuMode === 'transactional' ? TRANSACTIONAL_SERVICES : VENDOR_SERVICES;
      return (
        <>
          <div className="flex items-center gap-2 px-2 py-1 mb-1 text-gray-500 cursor-pointer hover:text-[#141D84]" onClick={() => setToolsMenuMode('services')}>
            <ArrowLeft size={14} /> <span className="text-xs font-bold uppercase">Back to Services</span>
          </div>
          <div className="max-h-60 overflow-y-auto no-scrollbar">
            {list.map(service => (
              <button
                key={service}
                onClick={() => handleServiceSelect(service)}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#F0F4FA] hover:text-[#141D84] rounded-lg transition-colors truncate"
              >
                {service}
              </button>
            ))}
          </div>
        </>
      );
    }
  }

  return (
    <div className="fixed inset-0 bg-[#F0F4FA] font-sans text-slate-900 flex flex-col overflow-hidden">

      {/* Hidden Inputs for File/Image Upload */}
      <input
        type="file"
        ref={hiddenFileInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => handleChatFileSelect(e, 'file')}
      />
      <input
        type="file"
        ref={hiddenImageInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleChatFileSelect(e, 'image')}
      />

      {/* Sidebar */}
      <Sidebar
        config={config}
        setConfig={setConfig}
        currentAgent={currentAgent}
        updateAgent={handleUpdateAgent}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onSimulateTool={handleSimulateTool}
        onUploadToTool={handleUploadToTool}
      />

      {/* Mobile Full Screen Widget Overlay */}
      {expandedWidget && (
        <div className="fixed left-0 right-0 bottom-0 top-[134px] z-[70] bg-white md:hidden flex flex-col animate-in slide-in-from-bottom-10">
          <ExpandedWidgetPanel
            key={`${expandedWidget}-${expandedInstance}`}
            type={expandedWidget}
            onClose={handleCloseWidget}
            config={config}
            initialData={expandedWidgetData}
            instanceKey={expandedInstance}
          />
        </div>
      )}

      {/* Header - Full Width, Always on Top - Hidden in Academy view */}
      {currentView === 'dashboard' && (
        <header
          className="bg-[#141D84] border-b-[0.5px] border-[#141D84] flex-shrink-0 z-[100] shadow-md relative w-full"
          style={{ display: 'flex', visibility: 'visible', position: 'relative' }}
          key="main-header" // Force React to keep this element
        >
          {/* Top bar with logo, navigation, and menu */}
          <div className="px-4 md:px-6 py-1 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20 shadow-sm">
                <Home className="text-white" size={24} />
              </div>
              <div>
                <h1 className="font-normal text-white text-2xl font-serif leading-tight tracking-wide">HomeToHome.Ai</h1>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${config.corpusFileName ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`}></span>
                  <span className="text-xs text-blue-100 font-medium">
                    {config.corpusFileName ? `Expertise: ${config.corpusFileName}` : 'Standard Mode'}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-2 hover:bg-white/10 rounded-full text-blue-100 transition-colors"
              aria-label="Settings"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>
      )}

      {/* Agent Selector Slider - Only show in Dashboard view */}
      {currentView === 'dashboard' && (
        <div className="flex-shrink-0 z-[90] w-full relative">
          <AgentSelector agents={agents} currentAgent={currentAgent} onSelectAgent={(a) => setCurrentAgentId(a.id)} />
        </div>
      )}

      {/* Conditional Rendering: Dashboard or Academy */}
      {currentView === 'academy' ? (
        /* Academy View - Full Screen */
        <div className="flex-1 overflow-hidden">
          {/* Academy App with its own header - don't hide header when in full view */}
          <div id="academy-app-options" data-mode="full" data-chat="true" style={{ display: 'contents' }}>
            <AcademyApp onNavigateToDashboard={() => setCurrentView('dashboard')} />
          </div>
        </div>
      ) : (
        /* Dashboard View */
        <div
          ref={splitContainerRef}
          className="flex flex-1 w-full overflow-hidden"
          style={{ userSelect: isResizingSplit ? 'none' : undefined }}
        >

        {/* Left Panel: Main App Content */}
        <main
          className={`flex flex-col h-full relative transition-all duration-300 ${expandedWidget ? 'border-r border-gray-200' : ''}`}
          style={{ width: expandedWidget ? `${splitRatio * 100}%` : '100%', userSelect: isResizingSplit ? 'none' : undefined }}
        >

          {/* Messages Area - Scrollable Flex Item */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto min-h-0 relative scroll-smooth bg-[#F0F4FA] custom-scrollbar"
          >
            {/* Calculator Bar - Hidden when widget is expanded (fullscreen), sticky when collapsed, static when expanded */}
            {!expandedWidget && (
              <div className={`${!isCalculatorExpanded ? 'sticky top-0' : ''} left-0 right-0 z-[60]`}>
                <CalculatorBar
                  isVisible={isCalculatorVisible}
                  value={calculatorValue}
                  onChange={setCalculatorValue}
                  onExpand={handleCalculatorExpand}
                />
              </div>
            )}

            <div
              className="p-4 md:p-6 transition-all duration-300 ease-in-out"
              style={{
                // Adjust top padding based on CalculatorBar
                paddingTop: isCalculatorVisible && !isCalculatorExpanded ? '120px' : '20px'
              }}
            >
              <div className="max-w-3xl mx-auto pb-4">
                {messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    agent={agents.find(a => a.id === msg.agentId)}
                    config={config}
                    onExpandWidget={(type, data) => handleExpandWidget(type, data)}
                  />
                ))}

                {isTyping && (
                  <div className="flex justify-start mb-6 animate-fade-in">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full overflow-hidden border-2 border-white ring-1 ring-gray-100 shadow-sm`}>
                        <img src={currentAgent.imageUrl} alt="Thinking" className="w-full h-full object-cover opacity-80" />
                      </div>
                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-gray-400" />
                        <span className="text-sm text-gray-500 font-medium italic">{currentAgent.name} is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Input Area - Fixed at Bottom */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 pb-2 pt-2 px-2 md:px-4 z-[60] w-full">
            <div className="max-w-3xl mx-auto w-full">

              {/* Suggested Prompts Slider */}
              <div className="mb-1 min-h-[32px] flex items-center">
                <PromptSlider
                  suggestions={suggestions}
                  onSelect={handleSuggestionSelect}
                  isLoading={isGeneratingSuggestions}
                />
              </div>

              {/* Unified Input Bar */}
              <div className="flex items-end gap-2 w-full">
                <div className="flex-1 relative flex items-stretch gap-2 bg-[#F0F4FA] border border-gray-300 rounded-[24px] px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#141D84] focus-within:border-transparent focus-within:bg-white transition-all shadow-inner w-full">

                  {/* Left Icons Group */}
                  <div className="flex flex-col justify-end border-r border-gray-300 pr-2 mr-1 pb-0.5 flex-shrink-0">
                    <div className="flex gap-1">
                      {/* Tools Menu Button */}
                      <div className="relative">
                        <button
                          onClick={() => { setShowToolsMenu(!showToolsMenu); setToolsMenuMode('main'); }}
                          className="p-1.5 rounded-full flex-shrink-0 bg-[#141D84] text-[#F9FAFB] hover:bg-gray-100 hover:text-[#141D84] transition-colors"
                          title="Add Tool"
                        >
                          <Plus size={18} />
                        </button>
                        {/* Tools Menu Dropdown */}
                        {showToolsMenu && (
                          <div className="absolute bottom-14 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-56 z-50 animate-in fade-in slide-in-from-bottom-2">
                            {renderToolsMenu()}
                          </div>
                        )}
                      </div>

                      {/* Speech to Text Button */}
                      <button
                        onClick={toggleListening}
                        className={`
                          p-1.5 rounded-full flex-shrink-0 transition-all duration-200
                          ${isListening
                            ? 'bg-red-50 text-red-500'
                            : 'text-gray-500 hover:bg-[#141D84]/10 hover:text-[#141D84]'}
                        `}
                        title={isListening ? "Stop Listening" : "Start Listening"}
                      >
                        {isListening ? <Mic size={18} className="animate-pulse" /> : <Mic size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Input Text Area - Auto Expanding */}
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${currentAgent.name}...`}
                    rows={1}
                    className="flex-1 bg-transparent border-none focus:ring-0 py-1.5 text-gray-800 placeholder-gray-400 text-base resize-none leading-relaxed no-scrollbar min-h-[36px] max-h-40 mb-0.5"
                    disabled={isTyping}
                  />

                  {/* Right Actions Group */}
                  <div className="flex flex-col justify-end pb-0.5 pr-0.5">
                    <div className="flex items-center gap-1">
                      {/* Send Button */}
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() || isTyping}
                        className={`
                          p-2 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-sm w-9 h-9
                          ${!inputValue.trim() || isTyping
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#141D84] text-white hover:brightness-110 hover:shadow-md transform hover:-translate-y-0.5'}
                        `}
                        title="Send Message"
                      >
                        <Send size={18} />
                      </button>

                      {/* Expand/Collapse Button */}
                      {showCollapseToggle && (
                        <button
                          onClick={() => setIsInputCollapsed(!isInputCollapsed)}
                          className={`
                            p-2 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 border w-9 h-9
                            ${isInputCollapsed
                              ? 'bg-[#141D84] text-white border-[#141D84] shadow-sm'
                              : 'bg-white text-gray-400 border-transparent hover:bg-gray-100 hover:text-[#141D84]'}
                          `}
                          title={isInputCollapsed ? "Expand Input" : "Collapse Input"}
                        >
                          {isInputCollapsed ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Active Agent Indicator */}
              <div className="text-center mt-1.5 hidden md:block">
                <p className="text-[10px] text-gray-400">
                  <strong>{currentAgent.name}</strong> ({currentAgent.role}) is active.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Splitter Handle - desktop only */}
        {expandedWidget && (
          <div
            className="hidden md:block w-2 bg-gray-200 hover:bg-gray-300 cursor-col-resize"
            onMouseDown={handleStartResize}
            onTouchStart={handleStartResize}
            aria-label="Resize panels"
          />
        )}

        {/* Right Panel: Expanded Widget View (Desktop) */}
        {expandedWidget && (
          <aside
            className="hidden md:block h-full border-l border-gray-200 bg-[#F0F4FA] relative z-10"
            style={{ width: `${(1 - splitRatio) * 100}%` }}
          >
            <ExpandedWidgetPanel
              key={`${expandedWidget}-${expandedInstance}`}
              type={expandedWidget}
              onClose={handleCloseWidget}
              config={config}
              initialData={expandedWidgetData}
              instanceKey={expandedInstance}
            />
          </aside>
        )}
        </div>
      )}

      {/* Overlay to close menus */}
      {showToolsMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowToolsMenu(false)} />
      )}
    </div>
  );
}

export default App;
