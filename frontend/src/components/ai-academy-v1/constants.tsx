
import { BookPageData } from './types';

// A reliable multi-page sample PDF for testing navigation and 16:9 cropping
export const DEFAULT_PDF_URL = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf";

export const MOCK_BOOK_DATA: BookPageData[] = [
  {
    pageNumber: 1,
    title: "Introduction: Risk Mitigation & Compliance",
    content: "Overview of real estate ethics and professional standards. Focus on Article 1 and fiduciary duties.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    shortsUrl: "https://www.youtube.com/shorts/P6eL1E7E-sI",
    category: "Introduction",
    keywords: ["fiduciary", "compliance", "intro"]
  },
  {
    pageNumber: 2,
    title: "Article 1: Protecting Client Interests",
    content: "REALTORS® pledge themselves to protect and promote the interests of their client. This primary obligation does not relieve REALTORS® of their obligation to treat all parties honestly.",
    youtubeUrl: "https://www.youtube.com/watch?v=6HNmU4B5xms",
    shortsUrl: "https://www.youtube.com/shorts/6HNmU4B5xms",
    category: "Duties to Clients",
    keywords: ["Article 1", "honesty", "promotion"]
  },
  {
    pageNumber: 3,
    title: "Article 2: Disclosure of Pertinent Facts",
    content: "REALTORS® shall avoid exaggeration, misrepresentation, or concealment of pertinent facts relating to the property or the transaction.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    shortsUrl: "https://www.youtube.com/shorts/P6eL1E7E-sI",
    category: "Duties to Clients",
    keywords: ["disclosure", "misrepresentation", "facts"]
  },
  {
    pageNumber: 4,
    title: "Article 3: Cooperation with Other Brokers",
    content: "REALTORS® shall cooperate with other brokers except when cooperation is not in the client's best interest. The obligation to cooperate does not include the obligation to share commissions.",
    youtubeUrl: "https://www.youtube.com/watch?v=6HNmU4B5xms",
    shortsUrl: "https://www.youtube.com/shorts/6HNmU4B5xms",
    category: "Duties to Clients",
    keywords: ["cooperation", "referrals", "commissions"]
  },
  {
    pageNumber: 5,
    title: "Article 4: Personal Interest Disclosures",
    content: "REALTORS® shall not acquire an interest in or buy or present offers from themselves, any member of their immediate families, their firms or any member thereof, or any entities in which they have any ownership interest.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    shortsUrl: "https://www.youtube.com/shorts/P6eL1E7E-sI",
    category: "Duties to Clients",
    keywords: ["interest", "ownership", "family"]
  },
  {
    pageNumber: 6,
    title: "Article 5: Professional Services Disclosure",
    content: "REALTORS® shall not undertake to provide specialized professional services concerning a property or its value where they have a present or contemplated interest unless such interest is specifically disclosed.",
    youtubeUrl: "https://www.youtube.com/watch?v=6HNmU4B5xms",
    shortsUrl: "https://www.youtube.com/shorts/6HNmU4B5xms",
    category: "Duties to Clients",
    keywords: ["specialization", "disclosure", "services"]
  },
  {
    pageNumber: 7,
    title: "Article 6: Rebates and Commissions",
    content: "REALTORS® shall not accept any commission, rebate, or profit on expenditures made for their client, without the client's knowledge and consent.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    shortsUrl: "https://www.youtube.com/shorts/P6eL1E7E-sI",
    category: "Duties to Clients",
    keywords: ["rebates", "consent", "profit"]
  },
  {
    pageNumber: 8,
    title: "Article 7: Dual Compensation Disclosure",
    content: "In a transaction, REALTORS® shall not accept compensation from more than one party, even if permitted by law, without disclosure to all parties and the informed consent of the REALTOR®'s client or clients.",
    youtubeUrl: "https://www.youtube.com/watch?v=6HNmU4B5xms",
    shortsUrl: "https://www.youtube.com/shorts/6HNmU4B5xms",
    category: "Duties to Clients",
    keywords: ["dual", "compensation", "consent"]
  },
  {
    pageNumber: 9,
    title: "Article 8: Trust Funds and Escrow",
    content: "REALTORS® shall keep in a special account in an appropriate financial institution, separated from their own funds, monies coming into their possession in trust for other persons.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    shortsUrl: "https://www.youtube.com/shorts/P6eL1E7E-sI",
    category: "Duties to Clients",
    keywords: ["trust", "escrow", "funds"]
  },
  {
    pageNumber: 10,
    title: "Article 9: Clear Written Agreements",
    content: "REALTORS®, for the protection of all parties, shall assure whenever possible that all agreements related to real estate transactions are in writing in clear and understandable language.",
    youtubeUrl: "https://www.youtube.com/watch?v=6HNmU4B5xms",
    shortsUrl: "https://www.youtube.com/shorts/6HNmU4B5xms",
    category: "Duties to Clients",
    keywords: ["contracts", "written", "clarity"]
  }
];

export const ACADEMY_COURSES = [
  { id: 1, title: 'Code of Ethics 101', duration: '2h 15m', students: 1240, rating: 4.8, badge: 'Ethicist', progress: 45, icon: 'fa-balance-scale', isCompleted: false, category: 'ETHICS' },
  { id: 2, title: 'Fiduciary Duty Mastery', duration: '1h 45m', students: 850, rating: 4.9, badge: 'Fiduciary', progress: 0, icon: 'fa-handshake', isCompleted: false, category: 'FIDUCIARY' },
  { id: 3, title: 'Trust Funds & Escrow', duration: '3h 10m', students: 2100, rating: 4.7, badge: 'Guardian', progress: 100, icon: 'fa-vault', isCompleted: true, category: 'ETHICS' },
  { id: 4, title: 'Advanced Risk Mitigation', duration: '4h 00m', students: 560, rating: 4.6, badge: 'Risk Pro', progress: 0, icon: 'fa-shield-alt', isCompleted: false, category: 'RISK' },
  { id: 5, title: 'AI in Compliance', duration: '1h 20m', students: 310, rating: 4.5, badge: 'Tech Pro', progress: 0, icon: 'fa-microchip', isCompleted: false, category: 'RISK' },
  { id: 6, title: 'Professional Standards 2024', duration: '1h 50m', students: 110, rating: 4.4, badge: 'Standards', progress: 0, icon: 'fa-book', isCompleted: false, category: 'ETHICS' },
  { id: 7, title: 'Fair Housing Protocol', duration: '2h 30m', students: 1900, rating: 4.9, badge: 'Advocate', progress: 100, icon: 'fa-house-flag', isCompleted: true, category: 'ETHICS' },
  { id: 8, title: 'Listing Presentation Ethics', duration: '1h 10m', students: 620, rating: 4.6, badge: 'Lister', progress: 0, icon: 'fa-clipboard-list', isCompleted: false, category: 'FIDUCIARY' },
  { id: 9, title: 'Escrow Dispute Laws', duration: '4h 20m', students: 340, rating: 4.3, badge: 'Arbitrator', progress: 0, icon: 'fa-gavel', isCompleted: false, category: 'RISK' },
];

export const INITIAL_SAMPLE_RANGE = "1-10";
