import fs from 'fs';

const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\components\\ai-academy-v1\\components\\ConfigSidebar.tsx';
let s = fs.readFileSync(p,'utf8');

const old = `<section className="bg-white/5 rounded-[2rem] border border-white/5 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff6600] mb-6 Course Injection">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-[2rem] p-10 text-center cursor-pointer hover:bg-[#ff6600]/5 hover:border-[#ff6600]/30 transition-all group">
              {isProcessing ? <i className="fas fa-circle-notch fa-spin text-[#ff6600] text-3xl"></i> : <i className="fas fa-file-upload text-[#ff6600] text-4xl group-hover:scale-110 transition-transform"></i>}
              <p className="text-[10px] font-black mt-4 uppercase tracking-widest text-gray-500">Add Volume to Advisor</p>
            </div>
          </section>`;

const fixed = `<section className="bg-white/5 rounded-[2rem] border border-white/5 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff6600] mb-6">Course Injection</h3>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-[2rem] p-10 text-center cursor-pointer hover:bg-[#ff6600]/5 hover:border-[#ff6600]/30 transition-all group">
              {isProcessing ? <i className="fas fa-circle-notch fa-spin text-[#ff6600] text-3xl"></i> : <i className="fas fa-file-upload text-[#ff6600] text-4xl group-hover:scale-110 transition-transform"></i>}
              <p className="text-[10px] font-black mt-4 uppercase tracking-widest text-gray-500">Add Volume to Advisor</p>
              <p className="text-[9px] font-black mt-2 uppercase tracking-widest text-white/30">Click to upload a PDF</p>
            </div>
          </section>`;

if (!s.includes('Course Injection')) {
  console.log('No broken Course Injection block found; skipping');
} else {
  // do a resilient regex replacement around the broken block
  s = s.replace(/<section className=\"bg-white\/5 rounded-\[2rem\] border border-white\/5 p-6\">[\s\S]*?<\/section>/m, (block) => {
    if (block.includes('Course Injection') && block.includes('fileInputRef')) {
      return fixed;
    }
    return block;
  });
  fs.writeFileSync(p,s,'utf8');
  console.log('Fixed ConfigSidebar Course Injection JSX');
}
