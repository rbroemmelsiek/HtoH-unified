
import React, { useState, useEffect, useRef } from 'react';
import { Star, Plus, Phone, Mail, User, Briefcase, Search, Check, Users, HardHat, Shield, Maximize2, Minimize2, Table, LayoutGrid, ArrowLeft, ArrowRight, X, Edit3, Filter, ChevronRight, SlidersHorizontal, GalleryHorizontalEnd } from 'lucide-react';
import { FormsWidget } from './FormsWidget';
import { FieldDef, TableDefinition } from '../types';

interface Contact {
  id: string;
  name: string;
  role: string;
  company?: string;
  phone: string;
  email: string;
  category: 'party' | 'provider' | 'vendor';
  isFavorite: boolean;
  imageUrl: string;
  address?: string;
  notes?: string;
  [key: string]: any;
}

interface ContactsWidgetProps {
  onExpand?: (selectedId?: string) => void;
  isExpanded?: boolean;
  initialSelectedId?: string;
  tableDef?: TableDefinition;
  onClose?: () => void;
  onToggleFullScreen?: () => void;
  isFullScreen?: boolean;
}

interface ActiveFilter {
  id: string;
  field: string;
  label: string;
  value: string;
}

const DEFAULT_CONTACTS_SCHEMA: FieldDef[] = [
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
  { name: 'parentId', label: 'Parent ID', type: 'Ref', hidden: true },
];

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Alice Freeman', role: 'Buyer', phone: '(555) 123-4567', email: 'alice@example.com', category: 'party', isFavorite: true, imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80', address: '123 Maple Dr, Springfield', notes: 'Pre-approved for $600k.' },
  { id: '2', name: 'Bob Smith', role: 'Seller', phone: '(555) 987-6543', email: 'bob@example.com', category: 'party', isFavorite: false, imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=600&q=80', address: '456 Oak Ln, Springfield', notes: 'Motivated seller, moving out of state.' },
  { id: '3', name: 'Sarah Jenkins', role: 'Listing Agent', company: 'Prime Realty', phone: '(555) 222-3333', email: 'sarah@primerealty.com', category: 'provider', isFavorite: true, imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', notes: 'Co-listing agent.' },
  { id: '4', name: 'Mike Ross', role: 'Loan Officer', company: 'Quick Loans', phone: '(555) 444-5555', email: 'mike@quickloans.com', category: 'provider', isFavorite: false, imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80', notes: 'Fast closer.' },
  { id: '5', name: 'Elena Rodriguez', role: 'Escrow Officer', company: 'Secure Title', phone: '(555) 666-7777', email: 'elena@securetitle.com', category: 'provider', isFavorite: true, imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80' },
  { id: '6', name: 'Tom Wilson', role: 'Home Inspector', company: 'CheckIt Inspections', phone: '(555) 888-9999', email: 'tom@checkit.com', category: 'vendor', isFavorite: false, imageUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488058?auto=format&fit=crop&w=600&q=80' },
  { id: '7', name: 'Fix-It Felix', role: 'General Contractor', company: 'Felix Construction', phone: '(555) 000-1111', email: 'felix@build.com', category: 'vendor', isFavorite: true, imageUrl: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=600&q=80' },
  { id: '8', name: 'Green Thumb Landscaping', role: 'Landscaper', company: 'Green Thumb', phone: '(555) 222-1212', email: 'info@greenthumb.com', category: 'vendor', isFavorite: false, imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80' }
];

export const ContactsWidget: React.FC<ContactsWidgetProps> = ({
  onExpand,
  isExpanded = false,
  initialSelectedId,
  tableDef,
  onClose,
  onToggleFullScreen,
  isFullScreen
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'party' | 'provider' | 'vendor'>('all');
  const [viewMode, setViewMode] = useState<'deck' | 'table' | 'carousel'>('carousel');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedFilterField, setSelectedFilterField] = useState<FieldDef | null>(null);
  const [newFilterValue, setNewFilterValue] = useState('');

  // Data State
  const [contacts, setContacts] = useState(MOCK_CONTACTS);

  // Selection / Editing State
  const [selectedContactId, setSelectedContactId] = useState<string | null>(initialSelectedId || null);
  const [isEditing, setIsEditing] = useState(false);

  // Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Play Control State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playDirection, setPlayDirection] = useState<'next' | 'prev'>('next');
  const [rotationSpeed, setRotationSpeed] = useState(2000);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPressed = useRef(false);

  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);

  // Split View Resizing State
  const [splitRatio, setSplitRatio] = useState(40); // Percentage width of the left panel
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize Logic
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const newRatio = (relativeX / containerRect.width) * 100;

      // Constrain between 20% and 80%
      const clampedRatio = Math.max(20, Math.min(80, newRatio));
      setSplitRatio(clampedRatio);
    };

    const handleGlobalMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isResizing]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const schema = tableDef?.schema || DEFAULT_CONTACTS_SCHEMA;
  const labelField = tableDef?.labelField || 'name';

  // Effect to sync initial selection
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedContactId(initialSelectedId);
    }
  }, [initialSelectedId]);

  const filteredContacts = contacts.filter(c => {
    const matchesTab = activeTab === 'all' || c.category === activeTab;
    const query = searchQuery.toLowerCase();
    const labelVal = String(c[labelField] || '').toLowerCase();
    const matchesSearch = !query ||
      labelVal.includes(query) ||
      (c.role || '').toLowerCase().includes(query) ||
      (c.company && c.company.toLowerCase().includes(query));

    let matchesFilters = true;
    if (activeFilters.length > 0) {
      matchesFilters = activeFilters.every(f => {
        const val = c[f.field as keyof Contact];
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(f.value.toLowerCase());
      });
    }
    return matchesTab && matchesSearch && matchesFilters;
  });

  // Sync Carousel Index with filtered results or selection
  useEffect(() => {
    if (filteredContacts.length === 0) return;

    // If a contact is selected, make sure carousel shows it when we return
    if (selectedContactId) {
      const idx = filteredContacts.findIndex(c => c.id === selectedContactId);
      if (idx !== -1 && idx !== carouselIndex) {
        setCarouselIndex(idx);
        return;
      }
    }

    // Safety check if index is out of bounds after filtering
    if (carouselIndex >= filteredContacts.length) {
      setCarouselIndex(0);
    }
  }, [selectedContactId, filteredContacts.length, carouselIndex]);

  const navigateRecord = (direction: 'prev' | 'next') => {
    setCarouselIndex(prev => {
      let newIndex = prev + (direction === 'next' ? 1 : -1);
      if (newIndex >= filteredContacts.length) newIndex = 0;
      if (newIndex < 0) newIndex = filteredContacts.length - 1;
      return newIndex;
    });

    // If detail view is active, update the selection instantly
    if (selectedContactId) {
      let newIndex = carouselIndex + (direction === 'next' ? 1 : -1);
      if (newIndex >= filteredContacts.length) newIndex = 0;
      if (newIndex < 0) newIndex = filteredContacts.length - 1;
      setSelectedContactId(filteredContacts[newIndex].id);
    }
  };

  // Handle Play/Pause via Long Press
  const handlePressStart = (direction: 'next' | 'prev') => {
    isPressed.current = true;
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (rotationTimer.current) clearTimeout(rotationTimer.current);

    if (isPlaying) {
      setPlayDirection(direction);
    } else {
      pressTimer.current = setTimeout(() => {
        setIsPlaying(true);
        setPlayDirection(direction);
        setRotationSpeed(2000);
      }, 600);
    }
  };

  const handlePressEnd = (direction: 'next' | 'prev') => {
    if (!isPressed.current) return;
    isPressed.current = false;
    if (pressTimer.current) clearTimeout(pressTimer.current);

    if (!isPlaying) {
      navigateRecord(direction);
    } else {
      setRotationSpeed(2000);
    }
  };

  const stopAutoPlay = () => {
    setIsPlaying(false);
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
  };

  useEffect(() => {
    if (isPlaying && filteredContacts.length > 0) {
      const step = () => {
        setCarouselIndex(prev => {
          let next = prev + (playDirection === 'next' ? 1 : -1);
          if (next >= filteredContacts.length) next = 0;
          if (next < 0) next = filteredContacts.length - 1;
          return next;
        });

        let nextDelay = rotationSpeed;
        if (isPressed.current) {
          nextDelay = Math.max(200, rotationSpeed * 0.8);
          setRotationSpeed(nextDelay);
        } else {
          nextDelay = 2000;
          setRotationSpeed(2000);
        }
        rotationTimer.current = setTimeout(step, nextDelay);
      };
      rotationTimer.current = setTimeout(step, rotationSpeed);
    }
    return () => { if (rotationTimer.current) clearTimeout(rotationTimer.current); }
  }, [isPlaying, playDirection, rotationSpeed, filteredContacts.length]);

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  const handleRowClick = (id: string) => {
    if (!isExpanded && onExpand) {
      onExpand(id);
    } else {
      setSelectedContactId(id);
    }
  };

  const toggleFavorite = (id: string) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  const handleSaveContact = (updatedData: any) => {
    setContacts(prev => prev.map(c => c.id === updatedData.id ? updatedData : c));
    setIsEditing(false);
  };

  const addFilter = () => {
    if (selectedFilterField && newFilterValue) {
      setActiveFilters(prev => [...prev, { id: Date.now().toString(), field: selectedFilterField.name, label: selectedFilterField.label, value: newFilterValue }]);
      setNewFilterValue('');
      setSelectedFilterField(null);
    }
  };

  const removeFilter = (id: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== id));
  };

  const toggleViewMode = () => {
    if (viewMode === 'deck') setViewMode('table');
    else if (viewMode === 'table') setViewMode('carousel');
    else setViewMode('deck');
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setStartX(clientX);
    stopAutoPlay();
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setDragDelta(clientX - startX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const spacing = isExpanded ? 500 : 200;
    const threshold = spacing / 4;

    if (Math.abs(dragDelta) > threshold) {
      const direction = dragDelta > 0 ? -1 : 1;
      const steps = Math.max(1, Math.round(Math.abs(dragDelta) / spacing));
      let newIdx = carouselIndex + (direction * steps);
      const count = filteredContacts.length;
      newIdx = ((newIdx % count) + count) % count;
      setCarouselIndex(newIdx);
    }
    setDragDelta(0);
  };

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      onClick={(e) => { e.stopPropagation(); setActiveTab(id); }}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all border ${activeTab === id ? 'bg-[#141D84] text-white border-[#141D84] shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'} `}
    >
      <Icon size={14} /><span>{label}</span>
    </button>
  );

  if (isEditing && selectedContact) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-lg h-[600px] shadow-2xl rounded-xl overflow-hidden bg-white">
          <FormsWidget schema={schema} data={selectedContact} onSave={handleSaveContact} onCancel={() => setIsEditing(false)} title={`Edit ${selectedContact[labelField]}`} />
        </div>
      </div>
    );
  }

  // Detail View Overlay
  if (selectedContactId && selectedContact) {
    return (
      <div className="flex flex-col h-full w-full bg-gray-50 animate-in fade-in z-20 absolute inset-0">
        <div className="bg-[#141D84] p-4 text-white shadow-md flex justify-between items-center shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedContactId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 cursor-pointer">
              <ArrowLeft size={20} /> <span className="text-sm font-bold">Back</span>
            </button>
            <div className="flex gap-2 items-center bg-white/10 rounded-full px-2 py-1">
              <button onClick={() => navigateRecord('prev')} className="p-1 hover:bg-white/20 rounded-full disabled:opacity-50"><ArrowLeft size={14} /></button>
              <span className="text-xs font-medium opacity-90">{filteredContacts.findIndex(c => c.id === selectedContactId) + 1} / {filteredContacts.length}</span>
              <button onClick={() => navigateRecord('next')} className="p-1 hover:bg-white/20 rounded-full disabled:opacity-50"><ArrowRight size={14} /></button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-1 bg-white text-[#141D84] rounded-full text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm"><Edit3 size={14} /> Edit</button>
            {onToggleFullScreen && (
              <button onClick={onToggleFullScreen} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Toggle Fullscreen">
                {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Close">
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative z-20">
          <div className={`mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${isFullScreen ? 'max-w-5xl' : 'max-w-3xl'} w-full transition-all duration-300`}>
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
              <img src={selectedContact.imageUrl} alt={selectedContact[labelField]} className="w-24 h-24 border-4 border-white absolute -bottom-12 left-6 object-cover shadow-md bg-white rounded-lg" />
            </div>
            <div className="pt-16 pb-8 px-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedContact[labelField]}</h2>
                  <p className="text-lg text-gray-500 font-medium">{selectedContact.role} {selectedContact.company && <span className="text-[#141D84]">@ {selectedContact.company}</span>}</p>
                </div>
                <button className="p-2 border border-gray-200 rounded-full text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all shadow-sm" onClick={() => toggleFavorite(selectedContact.id)}>
                  <Star size={24} fill={selectedContact.isFavorite ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 py-2.5 bg-[#141D84] text-white rounded-lg font-bold text-sm hover:bg-blue-900 flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"><Phone size={18} /> Call Mobile</button>
                <button className="flex-1 py-2.5 border border-gray-200 text-gray-700 bg-white rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"><Mail size={18} /> Send Email</button>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-gray-700 group cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-[#141D84] group-hover:text-white transition-colors"><Phone size={18} /></div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">Phone</p>
                          <span className="font-medium text-lg">{selectedContact.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-700 group cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Mail size={18} /></div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">Email</p>
                          <span className="font-medium text-lg">{selectedContact.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedContact.address && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Address</h4>
                      <p className="text-gray-800 font-medium">{selectedContact.address}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {selectedContact.notes && (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 relative">
                      <div className="absolute -top-2 -left-2 bg-yellow-200 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">PRIVATE</div>
                      <h4 className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-2 mt-1">Notes</h4>
                      <p className="text-gray-700 italic font-medium leading-relaxed">"{selectedContact.notes}"</p>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Meta Data</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-400">ID:</span> <span className="font-mono text-gray-600">{selectedContact.id}</span></div>
                      <div><span className="text-gray-400">Type:</span> <span className="font-bold text-gray-600 uppercase">{selectedContact.category}</span></div>
                      <div><span className="text-gray-400">Created:</span> <span className="text-gray-600">2023-10-27</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tableColumns = schema.filter(f => !f.hidden && f.type !== 'SectionHeader' && f.type !== 'PageBreak' && f.name !== 'imageUrl' && f.name !== 'id').slice(0, 4);

  const renderCarousel = () => {
    if (filteredContacts.length === 0) return null;
    const count = filteredContacts.length;
    const spacing = isExpanded ? 600 : 200;
    const effectiveIndex = carouselIndex - (dragDelta / spacing);

    return (
      <div
        className={`relative h-full w-full flex items-center justify-center overflow-hidden py-4 bg-gradient-to-b from-gray-50 to-white ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1200px' }}>
          {filteredContacts.map((contact, i) => {
            let offset = (i - effectiveIndex);
            while (offset > count / 2) offset -= count;
            while (offset < -count / 2) offset += count;

            if (Math.abs(offset) > 3) return null;

            const isCenter = Math.abs(offset) < 0.5;
            // Lower Z-indices for small widget to prevent bleed-through
            const baseZ = isExpanded ? 20 : 5;
            const zIndex = baseZ - Math.floor(Math.abs(offset) * 5);
            const scale = Math.max(0.7, 1.05 - Math.abs(offset) * 0.15);
            const opacity = Math.max(0.3, 1 - Math.abs(offset) * 0.4);

            const xOffset = offset * (isExpanded ? 550 : 180);
            const rotateY = offset * -20;
            const zOffset = -Math.abs(offset) * (isExpanded ? 200 : 100);

            return (
              <div
                key={contact.id}
                onClick={(e) => {
                  if (isDragging) return;
                  e.stopPropagation();
                  if (isCenter && Math.abs(dragDelta) < 5) {
                    handleRowClick(contact.id);
                  } else if (!isCenter) {
                    setCarouselIndex(i);
                  }
                }}
                className={`
                        absolute transition-transform duration-300 ease-out shadow-2xl rounded-2xl overflow-hidden bg-white border border-gray-200 select-none
                        ${isCenter ? 'ring-2 ring-[#141D84]/50' : 'grayscale-[50%] blur-[1px]'}
                     `}
                style={{
                  transform: `translateX(${xOffset}px) translateZ(${zOffset}px) rotateY(${rotateY}deg) scale(${scale})`,
                  zIndex: zIndex,
                  opacity: opacity,
                  width: isExpanded ? '750px' : '240px',
                  height: isExpanded ? '480px' : '340px',
                  left: '50%',
                  top: '50%',
                  marginTop: isExpanded ? '-240px' : '-170px',
                  marginLeft: isExpanded ? '-375px' : '-120px',
                }}
              >
                <div className="relative w-full h-full pointer-events-none bg-black rounded-2xl overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center blur-xl opacity-40"
                    style={{ backgroundImage: `url(${contact.imageUrl})` }}
                  />
                  <img
                    src={contact.imageUrl}
                    alt={contact[labelField]}
                    className="relative w-full h-full object-contain z-10"
                    draggable={false}
                  />

                  {/* Text Overlay - HIDE in Expanded Mode, and ensure negative Z-index */}
                  <div className={`
                           absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/90 via-black/60 to-transparent
                           transition-all duration-300 flex flex-col justify-end
                           ${isCenter ? 'opacity-100 h-2/3' : 'opacity-0 h-0'}
                           ${isExpanded ? 'hidden z-[-1]' : 'z-20'} 
                        `}>
                    {isCenter && (
                      <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-end justify-between">
                          <div>
                            <h3 className={`font-bold leading-tight ${isExpanded ? 'text-3xl' : 'text-xl'}`}>{contact[labelField]}</h3>
                            <p className={`font-medium text-white/90 ${isExpanded ? 'text-lg' : 'text-sm'}`}>{contact.role}</p>
                          </div>
                          {contact.isFavorite && <Star size={24} fill="currentColor" className="text-amber-400 mb-1" />}
                        </div>
                        <div className="mt-3 space-y-1">
                          {contact.company && <p className="text-sm text-white/80 font-semibold">{contact.company}</p>}
                          <p className="text-sm text-white/70">{contact.phone}</p>
                          <div className="mt-3 flex gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${contact.category === 'party' ? 'bg-blue-600' : contact.category === 'provider' ? 'bg-purple-600' : 'bg-orange-600'}`}>{contact.category}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onMouseDown={() => handlePressStart('prev')}
          onMouseUp={() => handlePressEnd('prev')}
          onMouseLeave={() => handlePressEnd('prev')}
          onTouchStart={() => handlePressStart('prev')}
          onTouchEnd={() => handlePressEnd('prev')}
          className={`
                absolute left-8 p-3 rounded-full shadow-xl border border-white/40 transition-all hover:scale-110 select-none
                ${isPlaying && playDirection === 'prev' ? 'bg-green-500 text-white animate-pulse border-green-400 scale-110' : 'bg-white/80 backdrop-blur-md text-gray-900 hover:bg-white'}
                ${isExpanded ? 'z-30' : 'z-10'}
             `}
        >
          <ArrowLeft size={isExpanded ? 28 : 20} />
        </button>
        <button
          onMouseDown={() => handlePressStart('next')}
          onMouseUp={() => handlePressEnd('next')}
          onMouseLeave={() => handlePressEnd('next')}
          onTouchStart={() => handlePressStart('next')}
          onTouchEnd={() => handlePressEnd('next')}
          className={`
                absolute right-8 p-3 rounded-full shadow-xl border border-white/40 transition-all hover:scale-110 select-none
                ${isPlaying && playDirection === 'next' ? 'bg-green-500 text-white animate-pulse border-green-400 scale-110' : 'bg-white/80 backdrop-blur-md text-gray-900 hover:bg-white'}
                ${isExpanded ? 'z-30' : 'z-10'}
             `}
        >
          <ArrowRight size={isExpanded ? 28 : 20} />
        </button>
      </div>
    );
  };

  // Render Helpers
  const renderDetailContent = (contact: Contact) => (
    <div className={`mx-auto bg-white overflow-hidden w-full h-full flex flex-col`}>
      <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative shrink-0">
        <img src={contact.imageUrl} alt={contact[labelField]} className="w-24 h-24 border-4 border-white absolute -bottom-12 left-6 object-cover shadow-md bg-white rounded-lg" />
      </div>
      <div className="pt-16 pb-8 px-6 flex-1 overflow-y-auto">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{contact[labelField]}</h2>
            <p className="text-lg text-gray-500 font-medium">{contact.role} {contact.company && <span className="text-[#141D84]">@ {contact.company}</span>}</p>
          </div>
          <button className="p-2 border border-gray-200 rounded-full text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all shadow-sm" onClick={() => toggleFavorite(contact.id)}>
            <Star size={24} fill={contact.isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-2.5 bg-[#141D84] text-white rounded-lg font-bold text-sm hover:bg-blue-900 flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"><Phone size={18} /> Call Mobile</button>
          <button className="flex-1 py-2.5 border border-gray-200 text-gray-700 bg-white rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"><Mail size={18} /> Send Email</button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-700 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-[#141D84] group-hover:text-white transition-colors"><Phone size={18} /></div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Phone</p>
                    <span className="font-medium text-lg">{contact.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-700 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Mail size={18} /></div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Email</p>
                    <span className="font-medium text-lg">{contact.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {contact.address && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Address</h4>
                <p className="text-gray-800 font-medium">{contact.address}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {contact.notes && (
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 relative">
                <div className="absolute -top-2 -left-2 bg-yellow-200 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">PRIVATE</div>
                <h4 className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-2 mt-1">Notes</h4>
                <p className="text-gray-700 italic font-medium leading-relaxed">"{contact.notes}"</p>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Meta Data</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">ID:</span> <span className="font-mono text-gray-600">{contact.id}</span></div>
                <div><span className="text-gray-400">Type:</span> <span className="font-bold text-gray-600 uppercase">{contact.category}</span></div>
                <div><span className="text-gray-400">Created:</span> <span className="text-gray-600">2023-10-27</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderListView = () => (
    <>
      <div className={`p-3 border-b border-gray-100 bg-gray-50 space-y-3 shadow-sm ${isExpanded ? 'z-10' : 'z-[1]'}`} onClick={(e) => e.stopPropagation()}>
        <div className={`relative transition-all duration-300 ${isExpanded ? 'w-full px-2' : 'w-[90%] md:w-[85%] mx-auto'}`}>
          <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, role, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#141D84]/20 focus:border-[#141D84] transition-all bg-white text-gray-900 shadow-sm"
          />
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors ${isFilterOpen || activeFilters.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center bg-white border border-gray-100 p-2 rounded-lg animate-in slide-in-from-top-1">
            <div className="flex items-center gap-1 text-xs font-bold text-[#141D84] mr-1"><Filter size={12} /><span>Filters</span></div>
            {activeFilters.map(filter => (
              <div key={filter.id} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full border border-indigo-100">
                <span className="font-medium">{filter.label}:</span><span>{filter.value}</span>
                <button onClick={() => removeFilter(filter.id)} className="ml-1 hover:text-red-500"><X size={12} /></button>
              </div>
            ))}
            <button onClick={() => setActiveFilters([])} className="text-[10px] text-gray-400 hover:text-red-500 ml-auto underline">Clear All</button>
          </div>
        )}

        {/* Filters Tabs - Show even if expanded for list filtering */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
          <TabButton id="all" label="All" icon={Users} />
          <TabButton id="party" label="Parties" icon={User} />
          <TabButton id="provider" label="Services" icon={Briefcase} />
          <TabButton id="vendor" label="Vendors" icon={HardHat} />
        </div>
      </div>

      <div className={`flex-1 bg-gray-50/50 ${isExpanded ? 'overflow-auto' : 'overflow-hidden relative'}`}>
        {/* On Mobile/Collapsed, clicking background expands */}
        {!isExpanded && <div className="absolute inset-0 pointer-events-none z-0" onClick={() => onExpand && onExpand()}></div>}
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400"><Search size={32} className="mb-2 opacity-50" /><p className="text-sm">No contacts found.</p></div>
        ) : viewMode === 'carousel' && !isExpanded ? (
          // Only use 3D Carousel in non-expanded/collapsed mode for wow factor
          // In split view, table or list is better.
          renderCarousel()
        ) : viewMode === 'table' ? (
          // Default to Table in Expanded Split View for clearer data density
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[300px]">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-3 border-b border-gray-200 bg-gray-50">Name</th>
                  <th className="p-3 border-b border-gray-200 bg-gray-50 hidden md:table-cell">Role</th>
                  <th className="p-3 border-b border-gray-200 bg-gray-50 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredContacts.map(contact => (
                  <tr
                    key={contact.id}
                    onClick={() => handleRowClick(contact.id)}
                    className={`hover:bg-blue-50 cursor-pointer transition-colors text-sm ${selectedContactId === contact.id ? 'bg-blue-50 border-l-4 border-[#141D84]' : 'border-l-4 border-transparent'}`}
                  >
                    <td className="p-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <img src={contact.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                        <div>
                          <div className="font-bold text-gray-900">{contact[labelField]}</div>
                          <div className="text-xs text-gray-500 md:hidden">{contact.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-700 hidden md:table-cell">{contact.role}</td>
                    <td className="p-3 text-right">
                      {contact.isFavorite && <Star size={14} className="text-amber-400 inline-block" fill="currentColor" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {filteredContacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => handleRowClick(contact.id)}
                className={`bg-white p-3 rounded-xl border hover:border-[#141D84]/30 hover:shadow-md cursor-pointer transition-all flex items-center gap-3 relative group/card ${selectedContactId === contact.id ? 'border-[#141D84] ring-1 ring-[#141D84]' : 'border-gray-200'}`}
              >
                <img src={contact.imageUrl} alt={contact[labelField]} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{contact[labelField]}</h4>
                  <p className="text-xs text-gray-500 truncate">{contact.role}</p>
                  <div className="flex gap-1 mt-1">
                    <span className={`text-[10px] px-1.5 rounded-full ${contact.category === 'party' ? 'bg-blue-100 text-blue-700' : contact.category === 'provider' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{contact.category}</span>
                  </div>
                </div>
                {contact.isFavorite && <Star size={16} className="text-amber-400 flex-shrink-0" fill="currentColor" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  // Non-Expanded Mode: Show Detail Overlay if selected, otherwise List
  if (!isExpanded && selectedContactId && selectedContact) {
    return (
      <div className="flex flex-col h-full w-full bg-gray-50 animate-in fade-in z-20 absolute inset-0">
        <div className="bg-[#141D84] p-4 text-white shadow-md flex justify-between items-center shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedContactId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 cursor-pointer">
              <ArrowLeft size={20} /> <span className="text-sm font-bold">Back</span>
            </button>
            <div className="flex gap-2 items-center bg-white/10 rounded-full px-2 py-1">
              <button onClick={() => navigateRecord('prev')} className="p-1 hover:bg-white/20 rounded-full disabled:opacity-50"><ArrowLeft size={14} /></button>
              <span className="text-xs font-medium opacity-90">{filteredContacts.findIndex(c => c.id === selectedContactId) + 1} / {filteredContacts.length}</span>
              <button onClick={() => navigateRecord('next')} className="p-1 hover:bg-white/20 rounded-full disabled:opacity-50"><ArrowRight size={14} /></button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-1 bg-white text-[#141D84] rounded-full text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm"><Edit3 size={14} /> Edit</button>
            {onToggleFullScreen && (
              <button onClick={onToggleFullScreen} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Toggle Fullscreen">
                {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Close">
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full relative z-20">
          {renderDetailContent(selectedContact)}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`
        bg-white flex flex-col font-sans animate-fade-in relative
        ${isExpanded
          ? 'w-full h-full border-0 rounded-none shadow-none mt-0 overflow-hidden'
          : 'w-full max-w-2xl h-[600px] rounded-xl shadow-lg border border-gray-200 mt-2 overflow-hidden'}
      `}
      onClick={(e) => { if (!isExpanded && onExpand) onExpand(); }}
    >
      <div className={`bg-[#141D84] text-white p-4 shrink-0 flex justify-between items-center cursor-pointer shadow-md relative z-[60]`}>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1.5 rounded-md border border-white/10">
            <Users size={20} className="text-white" />
          </div>
          <h3 className="font-bold text-lg tracking-wide text-white">{tableDef ? tableDef.name : 'Contacts Directory'}</h3>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-px bg-white/20 mx-1"></div>

          <button
            onClick={() => setIsEditing(true)}
            className={`p-1.5 hover:bg-white/10 rounded-full transition-colors ${selectedContact ? 'opacity-100' : 'opacity-30 cursor-not-allowed'}`}
            disabled={!selectedContact}
            title="Edit Contact"
          >
            <Edit3 size={18} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); toggleViewMode(); }}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center w-9 h-9"
            title={`Switch View (Current: ${viewMode})`}
          >
            {viewMode === 'deck' ? <Table size={20} /> : viewMode === 'table' ? <GalleryHorizontalEnd size={20} /> : <LayoutGrid size={20} />}
          </button>

          {onToggleFullScreen && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFullScreen(); }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors w-9 h-9 flex items-center justify-center"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          )}

          {onClose ? (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors w-9 h-9 flex items-center justify-center"
              title="Close"
            >
              <X size={20} />
            </button>
          ) : (
            onExpand && !isExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); onExpand(); }}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                title="Expand"
              >
                <Maximize2 size={20} />
              </button>
            )
          )}
        </div>
      </div>

      {isExpanded ? (
        // EXPANDED / SPLIT VIEW
        <div className="flex flex-1 overflow-hidden h-full relative">
          {viewMode === 'carousel' ? (
            <div className="w-full h-full bg-gray-100 relative">
              {renderCarousel()}
            </div>
          ) : (
            <>
              {/* Left Panel: List */}
              <div
                style={{ width: `${splitRatio}%` }}
                className="flex flex-col border-r border-gray-200 h-full relative"
              >
                {renderListView()}

                {/* Resizer Handle Overlay */}
                <div
                  onMouseDown={startResizing}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 z-50 flex items-center justify-center group transition-colors translate-x-1/2"
                >
                  <div className="w-[1px] h-full bg-gray-200 group-hover:bg-blue-400"></div>
                </div>
              </div>

              {/* Right Panel: Detail */}
              <div className="flex-1 h-full overflow-hidden bg-gray-50 flex flex-col relative" style={{ width: `${100 - splitRatio}%` }}>
                {selectedContact ? (
                  renderDetailContent(selectedContact)
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Users size={64} className="mb-4 opacity-20" />
                    <p className="font-medium text-lg">Select a contact to view details</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        // COLLAPSED / STANDARD VIEW
        <div className="flex flex-col flex-1 overflow-hidden">
          {renderListView()}
        </div>
      )}

      {isFilterOpen && (
        <div className="absolute inset-y-0 right-0 w-80 bg-white z-40 flex flex-col animate-in slide-in-from-right-10 font-sans shadow-2xl border-l border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              {selectedFilterField ? (
                <button onClick={() => setSelectedFilterField(null)} className="hover:bg-gray-100 p-1 rounded-full"><ArrowLeft size={20} className="text-gray-600" /></button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); setIsFilterOpen(false); }} className="hover:bg-gray-100 p-1 rounded-full"><ArrowLeft size={20} className="text-gray-600" /></button>
              )}
              <h3 className="font-bold text-gray-800 text-lg">{selectedFilterField ? selectedFilterField.label : "Filter"}</h3>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white p-2">
            {selectedFilterField ? (
              <div className="p-2 space-y-4 animate-in slide-in-from-right-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contains text</label>
                  <input
                    autoFocus
                    type="text"
                    value={newFilterValue}
                    onChange={(e) => setNewFilterValue(e.target.value)}
                    placeholder={`Enter value for ${selectedFilterField.label}`}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#141D84] focus:border-[#141D84] outline-none bg-white text-gray-900"
                  />
                </div>
              </div>
            ) : (
              schema.filter(f => !['SectionHeader', 'PageBreak', 'Image'].includes(f.type)).map(field => (
                <div key={field.name} onClick={() => { setSelectedFilterField(field); setNewFilterValue(''); }} className="flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group rounded-lg mb-1">
                  <div className="flex flex-col"><span className="text-sm font-medium text-gray-700">{field.label}</span></div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600" />
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            {selectedFilterField ? (
              <button onClick={addFilter} disabled={!newFilterValue} className="w-full py-2 bg-[#141D84] text-white rounded-lg font-bold text-sm hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">Apply Filter</button>
            ) : (
              <><button onClick={(e) => { e.stopPropagation(); setActiveFilters([]); }} className="text-gray-500 font-medium text-sm hover:text-red-500">Clear</button><button onClick={(e) => { e.stopPropagation(); setIsFilterOpen(false); }} className="text-[#141D84] font-bold text-sm hover:underline">Done</button></>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
