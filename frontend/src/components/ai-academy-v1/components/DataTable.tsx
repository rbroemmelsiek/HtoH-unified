import React, { useState, useMemo } from 'react';
import { BookPageData, LiveSession } from '../types';
import { ACADEMY_COURSES } from '../constants';

interface DataTableProps {
  data: BookPageData[];
  onSelectPage: (page: number) => void;
  onJoinLive: (session: LiveSession) => void;
  isPaid: boolean;
  onBuyCourse: () => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onSelectPage, onJoinLive, isPaid, onBuyCourse }) => {
  const [activeTab, setActiveTab] = useState<'paced' | 'live'>('paced');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  const pacedCourses = ACADEMY_COURSES;

  const liveSessions: LiveSession[] = [
    { id: 'l1', title: 'Interactive Ethics Workshop', instructor: 'Sarah J. (Lead Counsel)', type: 'Live Course', startTime: '10:00 AM EST', meetUrl: 'https://meet.google.com/new', status: 'Live' },
    { id: 'l2', title: 'Personal Risk Assessment', instructor: 'Marcus P. (Ethics Expert)', type: '1:1 Coaching', startTime: 'By Appointment', meetUrl: 'https://meet.google.com/new', status: 'Ready' },
    { id: 'l3', title: 'Certified Ethics Instructor', instructor: 'Training Certification', type: 'Instructor Training', startTime: 'Mon-Fri', meetUrl: 'https://meet.google.com/new', status: 'Upcoming' },
  ];

  const filters = ['ALL', 'ETHICS', 'RISK', 'FIDUCIARY', 'MY DEGREES'];

  const filteredCourses = useMemo(() => {
    let result = pacedCourses;
    if (selectedFilter === 'MY DEGREES') {
      result = pacedCourses.filter(c => c.isCompleted);
    } else if (selectedFilter !== 'ALL') {
      result = pacedCourses.filter(c => c.category === selectedFilter);
    }
    return result;
  }, [selectedFilter, pacedCourses]);

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(start, start + itemsPerPage);
  }, [filteredCourses, currentPage]);

  const earnedBadges = [
    { id: 'b1', name: 'Ethics Guardian', icon: 'fa-shield-halved', color: '#ff6600' },
    { id: 'b2', name: 'Fiduciary Pro', icon: 'fa-certificate', color: '#1E29BE' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#050508] p-4 md:p-8 overflow-hidden relative">
      {/* Vibrant Gradient Field Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Core Brand Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#1a237e]/40 rounded-full blur-[160px] opacity-[0.6] animate-pulse"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] bg-[#ff6600]/15 rounded-full blur-[180px] opacity-[0.3]"></div>
        <div className="absolute top-[30%] left-[30%] w-[60%] h-[60%] bg-[#04cc08]/10 rounded-full blur-[160px] opacity-[0.2]"></div>
        
        {/* Deep Field Accents */}
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] opacity-[0.3]"></div>
        <div className="absolute bottom-[20%] left-[15%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[140px] opacity-[0.4]"></div>
        
        {/* Subtle Mesh Overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,102,0,0.03),transparent_70%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div className="animate-page-entry">
            <h1 className="text-3xl md:text-5xl text-white brand-title mb-2 drop-shadow-2xl">Ai Academy Modules</h1>
            <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-[0.4em] font-black opacity-80">ON-DEMAND SKILLSETS</p>
          </div>
          
          <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10 backdrop-blur-3xl shadow-2xl gap-2">
            <button 
              onClick={() => setActiveTab('paced')}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all duration-300 ${
                activeTab === 'paced' 
                  ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                  : 'text-white/40 hover:text-white border border-transparent hover:border-white/10'
              }`}
            >
              CATALOG
            </button>
            <button 
              onClick={() => setActiveTab('live')}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all duration-300 ${
                activeTab === 'live' 
                  ? 'bg-[#04cc08] text-white shadow-[0_0_30px_rgba(4,204,8,0.4)]' 
                  : 'text-white/40 hover:text-white border border-transparent hover:border-white/10'
              }`}
            >
              LIVE
            </button>
          </div>
        </div>

        {activeTab === 'paced' ? (
          <>
            {/* Filter Tags & Badges */}
            <div className="flex flex-col gap-6 mb-8 animate-page-entry">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {filters.map(filter => (
                  <button
                    key={filter}
                    onClick={() => { setSelectedFilter(filter); setCurrentPage(1); }}
                    className={`px-5 py-2 rounded-full text-[9px] font-black tracking-widest border transition-all whitespace-nowrap ${
                      selectedFilter === filter 
                        ? 'bg-white text-black border-white shadow-lg' 
                        : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-[#ff6600] uppercase tracking-widest mb-1 opacity-70">Earning Progress</span>
                  <div className="flex items-center gap-3">
                    {earnedBadges.map(badge => (
                      <div key={badge.id} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[12px] shadow-2xl transition-transform hover:scale-110 cursor-help" style={{ color: badge.color }} title={badge.name}>
                        <i className={`fas ${badge.icon}`}></i>
                      </div>
                    ))}
                    <div className="text-[10px] text-gray-500 font-bold ml-1 opacity-60">+ 14 Locked</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Grid with Horizontal Slider */}
            <div className="flex-1 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-10">
              <div className="flex gap-5 min-w-max pr-10">
                {currentItems.map((course, idx) => (
                  <div 
                    key={course.id} 
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    className={`snap-center w-[230px] group bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 hover:border-white/40 hover:bg-white/[0.08] transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative flex flex-col min-h-[340px] animate-page-entry ${course.isCompleted ? 'ring-1 ring-[#04cc08]/40' : ''}`}
                  >
                    <div className="absolute top-0 right-0 p-5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border shadow-xl ${course.isCompleted ? 'bg-[#04cc08] text-white border-[#04cc08]/50 shadow-[0_0_20px_rgba(4,204,8,0.4)]' : 'bg-[#1a237e]/40 text-[#ff6600] border-[#ff6600]/20'}`}>
                        <i className={`fas ${course.isCompleted ? 'fa-award' : course.icon} text-lg`}></i>
                      </div>
                    </div>
                    
                    <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">{course.badge}</div>
                    <h3 className="text-xl text-white brand-title mb-4 leading-snug group-hover:text-white transition-colors h-[54px] overflow-hidden">{course.title}</h3>
                    
                    <div className="flex items-center gap-3 text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6">
                      <span className="flex items-center"><i className="far fa-clock mr-1.5 text-[#ff6600]/80"></i> {course.duration}</span>
                      <span className="flex items-center"><i className="fas fa-star text-yellow-500/80 mr-1.5"></i> {course.rating}</span>
                    </div>
                    
                    <div className="mt-auto mb-6 space-y-2.5">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em]">
                        <span className="text-gray-500">Mastery</span>
                        <span className={course.isCompleted ? 'text-[#04cc08]' : 'text-white/60'}>{course.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${course.isCompleted ? 'bg-[#04cc08] shadow-[0_0_15px_rgba(4,204,8,0.6)]' : 'bg-[#ff6600]'}`} 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="w-full flex gap-2">
                      {course.progress > 0 && !course.isCompleted ? (
                        <button 
                          onClick={() => onSelectPage(1)}
                          className="flex-1 py-3 bg-[#1a237e] text-white rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#1E29BE] transition-all shadow-xl uppercase active:scale-[0.97]"
                        >
                          RESUME
                        </button>
                      ) : course.isCompleted ? (
                        <button 
                          onClick={() => onSelectPage(1)}
                          className="flex-1 py-3 bg-[#04cc08]/20 text-[#04cc08] border border-[#04cc08]/30 rounded-2xl text-[10px] font-black tracking-widest hover:bg-[#04cc08]/30 transition-all uppercase"
                        >
                          REPLAY
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={onBuyCourse}
                            className="flex-1 py-3 bg-[#ff6600] text-white rounded-2xl text-[9px] font-black tracking-widest hover:bg-[#e65c00] transition-all shadow-2xl active:scale-[0.97] uppercase"
                          >
                            ENROLL
                          </button>
                          <button 
                            onClick={() => onSelectPage(1)}
                            className="flex-1 py-3 bg-white/5 text-white/60 rounded-2xl text-[9px] font-black tracking-widest hover:bg-white/10 transition-all border border-white/10 active:scale-[0.97] uppercase"
                          >
                            DEMO
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                {currentPage === totalPages && (
                  <div className="snap-center w-[200px] bg-dashed border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center hover:bg-white/5 hover:border-white/30 transition-all cursor-pointer min-h-[340px] group backdrop-blur-md">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-all shadow-2xl">
                      <i className="fas fa-plus text-xl text-white/30 group-hover:text-white transition-colors"></i>
                    </div>
                    <h3 className="text-white brand-title text-xl mb-2">New Subject</h3>
                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] opacity-60">Propose Module</p>
                  </div>
                )}
              </div>
            </div>

            {/* Numeric Pagination */}
            <div className="mt-4 flex justify-center items-center gap-4 animate-page-entry">
               <button 
                 disabled={currentPage === 1}
                 onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                 className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-10 transition-all border border-white/5"
               >
                 <i className="fas fa-chevron-left text-sm"></i>
               </button>
               <div className="flex gap-2">
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                   <button 
                    key={p} 
                    onClick={() => setCurrentPage(p)}
                    className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all ${currentPage === p ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/5'}`}
                   >
                     {p}
                   </button>
                 ))}
               </div>
               <button 
                 disabled={currentPage === totalPages}
                 onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                 className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-10 transition-all border border-white/5"
               >
                 <i className="fas fa-chevron-right text-sm"></i>
               </button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto no-scrollbar pb-24 pr-2 animate-page-entry">
            {liveSessions.map(session => (
              <div key={session.id} className="group bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 hover:border-[#04cc08]/60 transition-all shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative flex flex-col min-h-[400px]">
                <div className="flex justify-between items-start mb-8">
                  <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    session.status === 'Live' ? 'bg-red-600/20 text-red-500 animate-pulse border border-red-500/30' : 
                    session.status === 'Ready' ? 'bg-[#04cc08]/20 text-[#04cc08] border border-[#04cc08]/30' : 'bg-gray-800/40 text-gray-400 border border-white/10'
                  }`}>
                    {session.status}
                  </div>
                  <div className="w-14 h-14 bg-white/5 rounded-3xl flex items-center justify-center text-white shadow-2xl border border-white/10">
                    <i className={`fas ${session.type === '1:1 Coaching' ? 'fa-user-tie' : session.type === 'Live Course' ? 'fa-video' : 'fa-chalkboard-teacher'} text-2xl`}></i>
                  </div>
                </div>
                
                <div className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] mb-2">{session.type}</div>
                <h3 className="text-3xl text-white brand-title mb-2 group-hover:text-[#04cc08] transition-colors">{session.title}</h3>
                <p className="text-gray-400 text-sm mb-10 opacity-70">Expert: {session.instructor}</p>

                <div className="mt-auto space-y-4">
                  <div className="flex items-center gap-4 text-white/60 text-xs font-bold bg-white/5 p-5 rounded-2xl border border-white/5">
                    <i className="far fa-calendar-alt text-[#04cc08] text-lg"></i>
                    <span className="tracking-wide">{session.startTime}</span>
                  </div>
                  <button 
                    onClick={() => onJoinLive(session)}
                    className="w-full py-5 bg-[#04cc08] text-white rounded-3xl text-[11px] font-black tracking-[0.3em] uppercase hover:bg-[#03b307] hover:shadow-[0_15px_40px_rgba(4,204,8,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <i className="fab fa-google text-sm"></i> ACCESS SESSION
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;