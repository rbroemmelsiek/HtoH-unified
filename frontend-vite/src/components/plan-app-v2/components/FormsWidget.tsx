
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Check, FileText, Maximize2, Minimize2, RefreshCw, 
  Plus, Minus, Calendar, Clock, MapPin, ImageIcon, PenTool, DollarSign, Percent, 
  Link, Mail, Phone, Video, MousePointer, Palette, Search, Hash, Layout, Save, 
  X, Scroll, ArrowUpDown, ChevronDown, ChevronUp, HelpCircle 
} from './Icons';
import { FieldDef, MesopType } from '../types';

interface FormsWidgetProps {
  onExpand?: () => void;
  corpusData?: string;
  formData?: any;
  onUpdateFormData?: (data: any) => void;
  schema?: FieldDef[];
  data?: any;
  onSave?: (data: any) => void;
  onCancel?: () => void;
  title?: string;
  readOnly?: boolean;
  onClose?: () => void;
  onToggleFullScreen?: () => void;
  isFullScreen?: boolean;
  firstStepTitle?: string;
}

interface MesopFieldProps {
  type: MesopType;
  label: string;
  value: any;
  onChange: (val: any) => void;
  options?: string[];
  readOnly?: boolean;
  placeholder?: string;
  actionButton?: React.ReactNode;
  description?: string;
  className?: string;
}

// --- COMPONENT GALLERY SCHEMA (Showcases all types) ---
const COMPREHENSIVE_EXAMPLE_SCHEMA: FieldDef[] = [
  { name: 'sh_1', label: 'Identity & Contact', type: 'SectionHeader' },
  { name: 'name_ex', label: 'Name Field', type: 'Name', placeholder: 'Full Name' },
  { name: 'email_ex', label: 'Email Address', type: 'Email', placeholder: 'user@example.com' },
  { name: 'phone_ex', label: 'Phone Number', type: 'Phone', placeholder: '(555) 123-4567' },
  { name: 'address_ex', label: 'Mailing Address', type: 'Address' },

  { name: 'pb1', label: 'Numbers & Finance', type: 'PageBreak' },

  { name: 'price_ex', label: 'Price / Currency', type: 'Price' },
  { name: 'percent_ex', label: 'Percentage', type: 'Percent' },
  { name: 'number_ex', label: 'Number (Integer)', type: 'Number' },
  { name: 'decimal_ex', label: 'Decimal', type: 'Decimal' },
  { name: 'counter_ex', label: 'Change Counter', type: 'ChangeCounter' },
  { name: 'progress_ex', label: 'Progress Bar', type: 'Progress' },

  { name: 'pb2', label: 'Dates & Time', type: 'PageBreak' },

  { name: 'date_ex', label: 'Date Picker', type: 'Date' },
  { name: 'time_ex', label: 'Time Picker', type: 'Time' },
  { name: 'datetime_ex', label: 'Date & Time', type: 'DateTime' },
  { name: 'duration_ex', label: 'Duration', type: 'Duration' },
  { name: 'timestamp_ex', label: 'Change Timestamp', type: 'ChangeTimestamp' },

  { name: 'pb3', label: 'Media & Input', type: 'PageBreak' },

  { name: 'text_ex', label: 'Text Field', type: 'Text', placeholder: 'Simple text input' },
  { name: 'long_text_ex', label: 'Long Text / Notes', type: 'LongText', placeholder: 'Multiline text area' },
  { name: 'image_ex', label: 'Image Upload', type: 'Image' },
  { name: 'file_ex', label: 'File Upload', type: 'File' },
  { name: 'video_ex', label: 'Video Link', type: 'Video' },
  { name: 'signature_ex', label: 'Signature', type: 'Signature' },
  { name: 'drawing_ex', label: 'Drawing / Sketch', type: 'Drawing' },

  { name: 'pb4', label: 'Controls & Metadata', type: 'PageBreak' },

  { name: 'bool_ex', label: 'Yes/No Toggle', type: 'Yes/No' },
  { name: 'enum_ex', label: 'Dropdown (Enum)', type: 'Enum', options: ['Option A', 'Option B', 'Option C'] },
  { name: 'enumlist_ex', label: 'Multi-Select (EnumList)', type: 'EnumList', options: ['Aluminum', 'Bat & Board', 'Brick', 'Composite', 'Hardcoat Stucco', 'Shiplap', 'Stone', 'Synthetic Stucco', 'Vinyl', 'Wood', 'Other'] },
  { name: 'ref_ex', label: 'Reference (Ref)', type: 'Ref', options: ['Linked Item 1', 'Linked Item 2'] },
  { name: 'color_ex', label: 'Color Picker', type: 'Color' },
  { name: 'url_ex', label: 'Website URL', type: 'Url' },
  { name: 'latlong_ex', label: 'Lat/Long', type: 'LatLong' },
];

const formatNumberWithCommas = (value: string | number) => {
  if (value === undefined || value === null || value === '') return '';
  const strVal = value.toString();
  const parts = strVal.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

const formatPriceValue = (value: string | number) => {
  if (value === undefined || value === null || value === '') return '';
  const numVal = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numVal)) return '';
  return formatNumberWithCommas(numVal.toFixed(2));
};

const formatPercentValue = (value: string | number) => {
  if (value === undefined || value === null || value === '') return '';
  const numVal = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numVal)) return '';
  const parts = numVal.toString().split('.');
  if (parts.length > 1) {
    let decimals = parts[1].slice(0, 4);
    if (decimals.length < 2) decimals = decimals.padEnd(2, '0');
    return `${formatNumberWithCommas(parts[0])}.${decimals}`;
  }
  return `${formatNumberWithCommas(parts[0])}.00`;
};

const validateField = (type: MesopType, value: any): string | null => {
  if (!value && value !== 0) return null;
  const strVal = String(value);
  switch (type) {
    case 'Email': return /^\S+@\S+\.\S+$/.test(strVal) ? null : "Invalid email format";
    case 'Url': return /^(http|https):\/\/[^ "]+$/.test(strVal) ? null : "Invalid URL";
    case 'Phone': return strVal.replace(/\D/g, '').length >= 10 ? null : "Phone number too short";
    case 'LatLong': case 'XY': return /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(strVal) ? null : "Format: 00.00, 00.00";
    case 'Percent': return isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100 ? "Must be 0-100" : null;
    default: return null;
  }
};

const formatPhoneNumber = (value: string) => {
  const cleaned = ('' + value).replace(/\D/g, '');
  const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  if (match) return [match[1] ? '+1 ' : '', '(', match[2], ') ', match[3], '-', match[4]].join('');
  return value;
};

// MESOP Style: Label ALWAYS floats above the input field
const MesopLabel = ({ label, error, description }: { label: string, error?: string | null, description?: string }) => (
  <div className="absolute left-3 -top-2.5 px-1 bg-white pointer-events-none z-10 flex items-center gap-1 font-sans">
    <div className="absolute inset-0 bg-white h-[2px] top-[50%] -z-10 w-full"></div>
    <span className="text-xs font-medium text-[#202124] truncate max-w-[200px]">{label}</span>
    {error && <span className="text-[10px] font-normal text-red-500 ml-1">• {error}</span>}
    {description && (
      <span className="pointer-events-auto group relative ml-1 cursor-help">
        <HelpCircle size={10} className="text-gray-300 hover:text-[#141D84]" />
        <div className="absolute left-0 bottom-full mb-1.5 w-48 z-50 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-left leading-relaxed">
          {description}
          <div className="absolute -bottom-1 left-2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 transform rotate-45"></div>
        </div>
      </span>
    )}
  </div>
);

interface EnumPickerProps {
  label: string;
  options: string[];
  value: any;
  onChange: (val: any) => void;
  onClose: () => void;
  multi?: boolean;
}

const EnumPicker: React.FC<EnumPickerProps> = ({ label, options = [], value, onChange, onClose, multi }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Parse initial value
  const parseValue = (val: any): string[] => {
    if (multi) {
      if (Array.isArray(val)) return val.map(String);
      if (typeof val === 'string' && val) return val.split(',').map(s => s.trim());
      return [];
    }
    return val ? [String(val)] : [];
  };

  const [selected, setSelected] = useState<string[]>(parseValue(value));

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (opt: string) => {
    if (multi) {
      if (selected.includes(opt)) {
        setSelected(selected.filter(s => s !== opt));
      } else {
        setSelected([...selected, opt]);
      }
    } else {
      // Single Select - Toggle behavior: if clicking selected, don't deselect, just keep it. 
      // Or deselect if needed. Standard select usually just selects.
      setSelected([opt]);
    }
  };

  const handleDone = () => {
    if (multi) {
      onChange(selected); // Returns array for multi
    } else {
      onChange(selected[0] || ''); // Returns string for single
    }
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans shadow-2xl rounded-t-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-20">
        <h3 className="font-bold text-lg text-gray-900 mb-3">{label}</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-3 py-2.5 bg-white border border-gray-300 rounded-md text-base focus:border-[#141D84] outline-none transition-colors placeholder-gray-400 focus:ring-1 focus:ring-[#141D84]"
            autoFocus
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white pb-20">
        {filteredOptions.map(opt => {
          const isSelected = selected.includes(opt);
          return (
            <div
              key={opt}
              onClick={() => toggleOption(opt)}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
            >
              {multi ? (
                /* Checkbox for Multi */
                <div className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-[#141D84] border-[#141D84]' : 'border-gray-400 bg-white group-hover:border-gray-600'}`}>
                  {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
                </div>
              ) : (
                /* Radio for Single */
                <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all duration-200 ${isSelected ? 'border-[#141D84]' : 'border-gray-400 group-hover:border-gray-600'}`}>
                  {isSelected && <div className="w-3 h-3 bg-[#141D84] rounded-full" />}
                </div>
              )}
              <span className={`text-base ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{opt}</span>
            </div>
          )
        })}
        {filteredOptions.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No options found</div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center absolute bottom-0 left-0 right-0 z-30">
        <button
          onClick={() => setSelected([])}
          className="px-4 py-2 text-gray-600 hover:text-red-600 text-base font-medium transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleDone}
          className="px-6 py-2 bg-transparent text-[#141D84] hover:bg-blue-50 rounded-md text-base font-bold transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export const MesopField: React.FC<MesopFieldProps> = ({ type, label, value, onChange, options, readOnly, placeholder, actionButton, description, className }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = value !== '' && value !== null && value !== undefined && (Array.isArray(value) ? value.length > 0 : true);
  const isActive = isFocused || hasValue || !!placeholder;

  const handleBlur = () => {
    setIsFocused(false);
    setError(validateField(type, value));
    // Format phone number on blur
    if (type === 'Phone' && value) onChange(formatPhoneNumber(value));
  };

  const containerClass = `relative group font-sans w-full ${className || ''} my-1`;

  // MESOP Style: Section Header
  if (type === 'SectionHeader') {
    return (
      <div className="mt-4 mb-2 border-b border-[#1a1a1a] pb-2 w-full col-span-full">
        <h4 className="text-sm font-medium text-[#202124]">{label}</h4>
      </div>
    );
  }

  // MESOP Style: Text-based input fields
  if (['Text', 'Name', 'Email', 'Phone', 'Url', 'Address', 'LatLong', 'XY', 'ChangeLocation', 'Duration', 'App', 'ChangeTimestamp'].includes(type)) {
    let inputType = 'text';
    if (type === 'Email') inputType = 'email';
    if (type === 'Phone') inputType = 'tel';
    if (type === 'Url') inputType = 'url';
    let Icon = null;
    if (['Address', 'ChangeLocation'].includes(type)) Icon = MapPin;
    if (['LatLong', 'XY'].includes(type)) Icon = MousePointer;
    if (type === 'Email') Icon = Mail;
    if (type === 'Phone') Icon = Phone;
    if (['Url', 'App'].includes(type)) Icon = Link;
    if (type === 'ChangeTimestamp') Icon = Clock;

    // Handle Enter key to complete input
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      }
    };

    return (
      <div className={containerClass} onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <input
            type={inputType}
            value={value || ''}
            onChange={(e) => { setError(null); onChange(e.target.value); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            readOnly={readOnly || ['ChangeTimestamp', 'App'].includes(type)}
            placeholder=" "
            className={`
              peer w-full px-3 py-3 bg-white border rounded text-sm text-gray-900 outline-none transition-all
              ${error ? 'border-red-500 border-2' : isFocused ? 'border-[#1a1a1a] border-2' : 'border-[#1a1a1a]'}
              ${readOnly ? 'bg-gray-50 text-gray-500 cursor-default' : ''} 
              ${Icon ? 'pr-10' : ''}
            `}
          />
          <MesopLabel label={label} error={error} description={description} />
          {Icon && <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${error ? 'text-red-400' : 'text-gray-500'}`}><Icon size={18} /></div>}
          {type === 'Phone' && value && <a href={`tel:${value}`} className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-[#141D84] hover:bg-[#F0F4FA] rounded z-20"><Phone size={14} className="fill-current" /></a>}
          {actionButton && !Icon && <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">{actionButton}</div>}
        </div>
      </div>
    );
  }

  // MESOP Style: Number-based input fields
  if (['Number', 'Decimal', 'Price', 'Percent', 'ChangeCounter'].includes(type)) {
    const isPrice = type === 'Price';
    const isPercent = type === 'Percent';
    const isDecimal = type === 'Decimal';
    const isNumber = type === 'Number';

    const normalizePercent = (val: string) => {
      const num = parseFloat(val);
      if (isNaN(num)) return '';
      const parts = num.toString().split('.');
      if (parts.length > 1) {
        let decimals = parts[1].slice(0, 4);
        if (decimals.length < 2) decimals = decimals.padEnd(2, '0');
        return `${parts[0]}.${decimals}`;
      }
      return `${parts[0]}.00`;
    };

    // For display: show formatted value when not focused, raw value when editing
    const getDisplayValue = () => {
      if (isFocused) return value?.toString().replace(/,/g, '') || '';
      if (value === '' || value === null || value === undefined) return '';
      if (isPrice) return formatPriceValue(value);
      if (isPercent) return formatPercentValue(value);
      return formatNumberWithCommas(value);
    };

    // Handle numeric input - allow decimal point during typing
    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const raw = e.target.value;
      const clean = raw.replace(/,/g, '');

      // Allow empty, negative sign, or valid number patterns (including trailing decimal)
      if (clean === '' || clean === '-') {
        onChange(clean);
        return;
      }

      if (/^-?\d*\.?\d*$/.test(clean)) {
        onChange(clean); // Keep raw string while editing
      }
    };

    // Format value on blur
    const handleNumericBlur = () => {
      setIsFocused(false);
      setError(validateField(type, value));

      // Convert string to proper number on blur
      if (value !== '' && value !== null && value !== undefined) {
        const numVal = parseFloat(value.toString().replace(/,/g, ''));
        if (!isNaN(numVal)) {
          if (isPrice) {
            const fixed = numVal.toFixed(2);
            onChange(fixed);
          } else if (isNumber) {
            onChange(Math.round(numVal));
          } else if (isPercent) {
            const normalized = normalizePercent(value.toString());
            if (normalized) onChange(parseFloat(normalized));
          } else {
            onChange(numVal);
          }
        }
      }
    };

    // Handle Enter key to complete input
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      }
    };

    return (
      <div className={containerClass} onClick={(e) => e.stopPropagation()}>
        <div className={`
          relative flex items-center w-full border rounded transition-all bg-white
          ${error ? 'border-red-500 border-2' : isFocused ? 'border-[#1a1a1a] border-2' : 'border-[#1a1a1a]'}
          ${readOnly ? 'bg-gray-50' : ''}
        `}>
          {/* Dollar sign for Price field */}
          {isPrice && !isFocused && getDisplayValue() && <div className="pl-3 text-gray-500 pointer-events-none select-none"><DollarSign size={16} /></div>}

          <input
            type="text"
            value={getDisplayValue()}
            onChange={handleNumericChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={handleNumericBlur}
            readOnly={readOnly || type === 'ChangeCounter'}
            placeholder=" "
            className={`
              w-full py-3 bg-transparent outline-none appearance-none peer text-sm
              ${isPrice ? (isFocused || !getDisplayValue() ? 'pl-3' : 'pl-1') : 'pl-3'} ${(isPercent || isNumber) ? 'pr-10' : 'pr-3'}
            `}
          />
          <MesopLabel label={label} error={error} description={description} />

          {/* Right-side icons/controls */}
          {isPercent && getDisplayValue() && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><Percent size={18} /></div>}
          {type === 'ChangeCounter' && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><Hash size={18} /></div>}
          {isNumber && !readOnly && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 text-gray-500 items-center">
              <button type="button" onClick={() => onChange(Number(value || 0) - 1)} className="p-1 hover:bg-gray-100 rounded hover:text-[#141D84]"><Minus size={14} /></button>
              <button type="button" onClick={() => onChange(Number(value || 0) + 1)} className="p-1 hover:bg-gray-100 rounded hover:text-[#141D84]"><Plus size={14} /></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MESOP Style: Long text / textarea field
  if (type === 'LongText') {
    return (
      <div className={containerClass} onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={3}
            placeholder=" "
            className={`
                peer w-full px-3 py-3 bg-white border rounded text-sm text-gray-900 outline-none transition-all resize-none
                ${isFocused ? 'border-[#1a1a1a] border-2' : 'border-[#1a1a1a]'}
                ${readOnly ? 'bg-gray-50 text-gray-500' : ''}
              `}
            readOnly={readOnly}
          />
          <MesopLabel label={label} description={description} />
        </div>
      </div>
    );
  }

  // MESOP Style: Date/Time picker fields
  if (['Date', 'DateTime', 'Time'].includes(type)) {
    // Handle Enter key to complete input
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      }
    };

    return (
      <div className={containerClass} onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <input
            ref={inputRef}
            type={type === 'DateTime' ? 'datetime-local' : type === 'Time' ? 'time' : 'date'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            readOnly={readOnly}
            className={`
                peer w-full px-3 py-3 pr-20 bg-white border rounded text-sm text-gray-900 outline-none transition-all
                ${isFocused ? 'border-[#1a1a1a] border-2' : 'border-[#1a1a1a]'}
                ${!value ? 'text-gray-400' : ''} 
                ${readOnly ? 'bg-gray-50 text-gray-500' : ''}
              `}
          />
          <MesopLabel label={label} description={description} />
          
          {/* Custom Trigger Button - Positioned to the left of the native icon */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly && inputRef.current) {
                // Try modern showPicker API first
                try {
                  if (typeof inputRef.current.showPicker === 'function') {
                    inputRef.current.showPicker();
                  } else {
                    // Fallback for older browsers
                    inputRef.current.focus();
                    inputRef.current.click();
                  }
                } catch (err) {
                  // Fallback if showPicker fails (e.g. cross-origin iframe issues)
                  inputRef.current.focus();
                }
              }
            }}
            className={`absolute right-10 top-1/2 -translate-y-1/2 z-20 ${readOnly ? 'pointer-events-none text-gray-400' : 'cursor-pointer text-gray-500 hover:text-[#141D84] p-1 rounded-full hover:bg-gray-100 transition-colors'}`}
            title="Open Picker"
          >
            {type === 'Time' ? <Clock size={18} /> : <Calendar size={18} />}
          </button>
        </div>
      </div>
    );
  }

  // MESOP Style: Enum/EnumList/Ref dropdown fields
  if (['Enum', 'EnumList', 'Ref'].includes(type)) {
    const [isPickerOpen, setPickerOpen] = useState(false);

    // Display value logic
    let displayValue = value;
    if (Array.isArray(value)) {
      displayValue = value.join(', ');
    }

    return (
      <>
        <div className={containerClass} onClick={(e) => { e.stopPropagation(); if (!readOnly) setPickerOpen(true); }}>
          <div className="relative cursor-pointer">
            <div className={`
              peer w-full px-3 py-3 pr-10 bg-white border rounded text-sm text-gray-900 outline-none transition-all min-h-[46px] flex items-center
              ${isFocused || isPickerOpen ? 'border-[#1a1a1a] border-2' : 'border-[#1a1a1a]'}
              ${readOnly ? 'bg-gray-50 text-gray-500 cursor-default' : 'bg-white'}
            `}>
              <span className={`truncate ${!displayValue ? 'text-gray-400' : ''}`}>
                {displayValue || 'Select...'}
              </span>
            </div>
            <MesopLabel label={label} description={description} />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              {type === 'Ref' ? <Search size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
        </div>

        {isPickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0" onClick={() => setPickerOpen(false)}></div>

            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden max-h-[70vh] flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
              <EnumPicker
                label={label}
                options={options || []}
                value={value}
                onChange={(val: any) => { onChange(val); }}
                onClose={() => setPickerOpen(false)}
                multi={type === 'EnumList'}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // MESOP Style: Yes/No toggle field
  if (type === 'Yes/No') {
    return (
      <div className={containerClass} onClick={(e) => e.stopPropagation()}>
        <div className="relative border border-[#1a1a1a] rounded bg-white px-3 py-3 flex items-center justify-between">
          <MesopLabel label={label} description={description} />
          <button
            disabled={readOnly}
            onClick={() => onChange(!value)}
            className={`
              relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none
              ${value ? 'bg-[#141D84]' : 'bg-gray-300'} 
              ${readOnly ? 'opacity-50' : ''}
            `}
          >
            <div className={`
              absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 
              ${value ? 'translate-x-5' : 'translate-x-0'}
            `} />
          </button>
        </div>
      </div>
    );
  }

  // MESOP Style: Color picker field
  if (type === 'Color') {
    return (
      <div className={containerClass} onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className={`
              flex items-center border border-[#1a1a1a] rounded overflow-hidden p-1.5 gap-2 bg-white 
              ${readOnly ? 'bg-gray-50' : ''}
            `}>
            <input
              type="color"
              value={value || '#ffffff'}
              disabled={readOnly}
              onChange={(e) => onChange(e.target.value)}
              className="w-9 h-9 p-0 border-0 rounded cursor-pointer"
            />
            <div className="flex-1">
              <input
                type="text"
                value={value || ''}
                readOnly={readOnly}
                onChange={(e) => onChange(e.target.value)}
                className="w-full outline-none text-sm text-gray-600 uppercase bg-transparent py-1"
                maxLength={7}
              />
            </div>
            <Palette size={18} className="text-gray-500 mr-2" />
          </div>
          <MesopLabel label={label} description={description} />
        </div>
      </div>
    );
  }

  // MESOP Style: File/Image/Video upload fields
  if (['File', 'Image', 'Video', 'Thumbnail'].includes(type)) {
    let Icon = FileText;
    if (['Image', 'Thumbnail'].includes(type)) Icon = ImageIcon;
    if (type === 'Video') Icon = Video;
    return (
      <div className={containerClass} onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className={`
            border border-[#1a1a1a] rounded bg-white px-3 py-3
            ${readOnly ? 'bg-gray-50' : ''}
          `}>
            <MesopLabel label={label} description={description} />
            {readOnly && value ? (
              <div className="flex items-center gap-3 mt-1">
                {['Image', 'Thumbnail'].includes(type) ? (
                  <img src={value} alt={label} className="w-12 h-12 object-cover rounded" />
                ) : (
                  <div className="p-1.5 bg-[#F0F4FA] rounded-full text-[#141D84]"><Icon size={16} /></div>
                )}
                <span className="text-sm text-gray-600 truncate flex-1">{value}</span>
              </div>
            ) : (
              <label className="flex items-center gap-3 cursor-pointer mt-1">
                <div className="p-2 bg-[#F0F4FA] rounded-full text-[#141D84]"><Icon size={18} /></div>
                <span className="text-sm text-gray-500">{value ? value : `Click to upload ${type.toLowerCase()}`}</span>
                <input type="file" disabled={readOnly} className="hidden" onChange={(e) => onChange(e.target.files?.[0]?.name || '')} />
              </label>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MESOP Style: Signature/Drawing fields
  if (['Signature', 'Drawing'].includes(type)) {
    return (
      <div className={containerClass} onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className={`
            border border-[#1a1a1a] rounded bg-white overflow-hidden
            ${readOnly ? 'pointer-events-none opacity-80' : ''}
          `}>
            <MesopLabel label={label} description={description} />
            <div
              className={`
                h-24 bg-[#FAFAFA] hover:bg-white transition-colors cursor-crosshair relative
              `}
              onClick={() => !readOnly && onChange("Content Captured")}
            >
              {!value && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                  <PenTool size={20} className="mr-2 opacity-50" />
                  <span className="text-sm font-medium">{type === 'Drawing' ? 'Click to sketch' : 'Click to sign'}</span>
                </div>
              )}
              {value && (
                <div className="w-full h-full flex items-center justify-center text-[#141D84] font-script text-lg">
                  {value}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MESOP Style: Progress bar field
  if (type === 'Progress') {
    return (
      <div className={containerClass} onClick={(e) => e.stopPropagation()}>
        <div className="relative border border-[#1a1a1a] rounded bg-white px-3 py-3">
          <MesopLabel label={label} description={description} />
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-[#141D84] rounded-full transition-all"
                style={{ width: `${value || 0}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={value || 0}
                disabled={readOnly}
                onChange={(e) => onChange(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {/* Draggable thumb indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#141D84] rounded-full border-2 border-white shadow-md pointer-events-none"
                style={{ left: `calc(${value || 0}% - 8px)` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600 w-12 text-right">{value || 0}%</span>
          </div>
        </div>
      </div>
    );
  }

  // MESOP Style: Fallback for any other field types
  // Handle Enter key to complete input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={containerClass} onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => { setError(null); onChange(e.target.value); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          readOnly={readOnly}
          placeholder=" "
          className={`
            peer w-full px-3 py-3 bg-white border rounded text-sm text-gray-900 outline-none transition-all
            ${error ? 'border-red-500 border-2' : isFocused ? 'border-[#1a1a1a] border-2' : 'border-[#1a1a1a]'}
            ${readOnly ? 'bg-gray-50 text-gray-500 cursor-default' : ''}
          `}
        />
        <MesopLabel label={label} error={error} description={description} />
      </div>
    </div>
  );
};

export const FormsWidget: React.FC<FormsWidgetProps> = ({
  onExpand,
  corpusData,
  formData: propsFormData,
  onUpdateFormData,
  schema,
  data,
  onSave,
  onCancel,
  title,
  readOnly,
  onClose,
  onToggleFullScreen,
  isFullScreen,
  firstStepTitle
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const stepperRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // State
  const [genericFormData, setGenericFormData] = useState<any>(data || {});
  const [steps, setSteps] = useState<{ id: number, title: string, fields: FieldDef[] }[]>([]);
  const [viewMode, setViewMode] = useState<'wizard' | 'scroll'>('wizard');
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [sectionSort, setSectionSort] = useState<Record<number, 'default' | 'az'>>({});

  // Determine schema to use: provided schema OR the default Component Gallery
  const activeSchema = schema || COMPREHENSIVE_EXAMPLE_SCHEMA;
  const formData = isGenericMode() ? genericFormData : propsFormData; // Fallback only if no state

  function isGenericMode() { return true; } // Always treat as generic now to support all types

  // Initialize Steps from Schema
  useEffect(() => {
    if (activeSchema) {
      const generatedSteps: { id: number, title: string, fields: FieldDef[] }[] = [];
      let currentFields: FieldDef[] = [];
      let pageIndex = 1;
      let pageTitle = firstStepTitle || (schema ? "Page 1" : "Identity & Contact"); // Default title for gallery

      activeSchema.forEach((field, index) => {
        if (field.type === 'PageBreak') {
          if (currentFields.length > 0 || index === 0) {
            generatedSteps.push({ id: pageIndex, title: pageTitle, fields: currentFields });
          }
          pageIndex++;
          pageTitle = field.label || `Page ${pageIndex}`;
          currentFields = [];
        } else {
          currentFields.push(field);
        }
      });
      if (currentFields.length > 0) {
        generatedSteps.push({ id: pageIndex, title: pageTitle, fields: currentFields });
      }

      setSteps(generatedSteps);
      setGenericFormData(data || {});

      const initialExpanded: Record<number, boolean> = {};
      generatedSteps.forEach(s => initialExpanded[s.id] = true);
      setExpandedSections(initialExpanded);
    }
  }, [activeSchema, data, firstStepTitle]);

  const updateField = (field: string, val: any) => {
    setGenericFormData((prev: any) => ({ ...prev, [field]: val }));
    if (onUpdateFormData) onUpdateFormData({ ...formData, [field]: val });
  };

  const toggleSection = (id: number) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getSortedFields = (fields: FieldDef[], stepId: number) => {
    if (sectionSort[stepId] === 'az') {
      return [...fields].sort((a, b) => a.label.localeCompare(b.label));
    }
    return fields;
  };

  const checkScroll = () => {
    if (stepperRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = stepperRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [steps, viewMode]);

  const scrollStepper = (direction: 'left' | 'right') => {
    if (stepperRef.current) {
      const scrollAmount = 150;
      stepperRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  // Scroll stepper to make a specific step visible/centered
  const scrollToStepIndex = (stepIndex: number) => {
    if (!stepperRef.current) return;
    const stepElements = stepperRef.current.querySelectorAll('[data-step-item]');
    if (stepElements[stepIndex]) {
      const stepEl = stepElements[stepIndex] as HTMLElement;
      const container = stepperRef.current;
      const containerWidth = container.clientWidth;
      const stepLeft = stepEl.offsetLeft;
      const stepWidth = stepEl.offsetWidth;

      // Calculate scroll position to center the step
      const scrollTarget = stepLeft - (containerWidth / 2) + (stepWidth / 2);
      container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStep < steps.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTimeout(() => scrollToStepIndex(nextStep - 1), 100);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setTimeout(() => scrollToStepIndex(prevStep - 1), 100);
    }
  };

  const renderGenericFields = () => {
    const stepData = steps.find(s => s.id === currentStep);
    if (!stepData) return null;

    const fieldsToShow = getSortedFields(stepData.fields, currentStep);

    return (
      <div className="pt-2 animate-fade-in">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-normal text-[#202124]">{stepData.title}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {fieldsToShow.map(field => {
            const isLongLabel = field.label.length > 40;
            const alwaysFull = ['SectionHeader', 'LongText', 'File', 'Image', 'Signature', 'Drawing'].includes(field.type);
            const textFull = field.type === 'Text' && isLongLabel;
            const isFullWidth = alwaysFull || textFull || isLongLabel;

            return !field.hidden && (
              <div key={field.name} className={isFullWidth ? "col-span-1 md:col-span-2" : "col-span-1"}>
                <MesopField
                  type={field.type}
                  label={field.label}
                  value={genericFormData[field.name]}
                  onChange={(v) => updateField(field.name, v)}
                  options={field.options}
                  readOnly={readOnly || field.readOnly}
                  placeholder={field.placeholder}
                  description={field.description}
                />
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  const renderScrollMode = () => {
    return (
      <div className="space-y-6 pt-2 pb-20">
        {steps.map(step => {
          const sortedFields = getSortedFields(step.fields, step.id);
          const isExpanded = expandedSections[step.id];

          return (
            <div key={step.id} className="border border-gray-200 rounded-lg overflow-hidden transition-all shadow-sm">
              <div
                className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleSection(step.id)}
              >
                <h3 className="text-lg font-medium text-gray-800">{step.title}</h3>
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-white border-t border-gray-100 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    {sortedFields.map(field => {
                      const isLongLabel = field.label.length > 40;
                      const alwaysFull = ['SectionHeader', 'LongText', 'File', 'Image', 'Signature', 'Drawing'].includes(field.type);
                      const textFull = field.type === 'Text' && isLongLabel;
                      const isFullWidth = alwaysFull || textFull || isLongLabel;
                      return !field.hidden && (
                        <div key={field.name} className={isFullWidth ? "col-span-1 md:col-span-2" : "col-span-1"}>
                          <MesopField
                            type={field.type}
                            label={field.label}
                            value={genericFormData[field.name]}
                            onChange={(v) => updateField(field.name, v)}
                            options={field.options}
                            readOnly={readOnly || field.readOnly}
                            placeholder={field.placeholder}
                            description={field.description}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 w-full ${onExpand ? 'max-w-2xl mt-2' : 'h-full'} animate-fade-in overflow-hidden flex flex-col min-h-0 font-sans`}
      style={{ height: onExpand ? '600px' : '100%' }}
      onClick={(e) => { if (onExpand) onExpand(); }}
    >
      <div className="bg-[#141D84] text-white p-4 flex items-center justify-between shrink-0 shadow-md relative z-20 cursor-pointer font-sans" title={onExpand ? "Tap header to expand" : ""}>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1.5 rounded-md backdrop-blur-sm border border-white/20">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <span className="font-medium text-md tracking-wide">{title || (schema ? "Edit Record" : "Component Gallery")}</span>
        </div>
        <div className="flex gap-1 items-center">
          {onClose ? (
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
          ) : (
            onExpand && <button onClick={(e) => { e.stopPropagation(); onExpand(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Maximize2 size={18} /></button>
          )}
        </div>
      </div>

      {viewMode === 'wizard' && (
        <div className="bg-white border-b border-gray-100 relative z-10 shadow-sm font-sans py-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-20 flex items-center pl-1 transition-opacity duration-300 ${showLeftArrow ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}><button onClick={() => scrollStepper('left')} className="bg-white border border-gray-200 shadow-sm rounded-full p-1 hover:bg-[#F0F4FA] text-[#141D84]"><ChevronLeft size={14} /></button></div>
          <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-20 flex items-center justify-end pr-1 transition-opacity duration-300 ${showRightArrow ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}><button onClick={() => scrollStepper('right')} className="bg-white border border-gray-200 shadow-sm rounded-full p-1 hover:bg-[#F0F4FA] text-[#141D84]"><ChevronRight size={14} /></button></div>
          <div ref={stepperRef} onScroll={checkScroll} className="flex items-center gap-8 px-4 overflow-x-auto no-scrollbar scroll-smooth">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div
                  data-step-item
                  className={`flex items-center gap-3 cursor-pointer group flex-shrink-0 transition-opacity ${currentStep === step.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                  onClick={() => { setCurrentStep(step.id); setTimeout(() => scrollToStepIndex(idx), 100); }}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 border ${currentStep === step.id ? 'bg-[#141D84] text-white border-[#141D84]' : currentStep > step.id ? 'bg-[#141D84] text-white border-[#141D84]' : 'bg-white text-gray-400 border-gray-200'}`}>
                    {currentStep > step.id ? <Check size={12} strokeWidth={3} /> : step.id}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wide whitespace-nowrap ${currentStep === step.id ? 'text-[#141D84]' : 'text-gray-500'}`}>{step.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="h-px w-8 bg-gray-200 flex-shrink-0 border-t border-dashed border-gray-300"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 flex-1 overflow-y-auto bg-white no-scrollbar font-sans relative min-h-0">
        {viewMode === 'scroll' ? renderScrollMode() : renderGenericFields()}
      </div>

      {viewMode === 'wizard' && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between z-20 rounded-b-lg select-none" onClick={(e) => e.stopPropagation()}>
          <div>
            {onCancel && (
              <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-wider transition-colors px-2">
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handlePrev} disabled={currentStep === 1} className="text-gray-500 hover:text-[#141D84] disabled:opacity-30 font-bold text-xs flex items-center gap-1 transition-all uppercase tracking-wide">
              <ChevronLeft size={14} /> Back
            </button>

            <div className="text-xs font-black text-gray-400 tracking-widest bg-gray-200/50 px-2 py-1 rounded">
              {currentStep} / {steps.length}
            </div>

            {currentStep < steps.length ? (
              <button onClick={handleNext} className="text-[#141D84] hover:text-blue-700 font-bold text-xs flex items-center gap-1 transition-all uppercase tracking-wide">
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={(e) => {
                if (onSave) onSave(genericFormData);
                else if (onCancel) onCancel();
                else alert("Form Completed");
              }} className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1 transition-all uppercase tracking-wide">
                Finish <Check size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
