import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Instagram } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';

interface FooterProps {
  onOpenTracking: () => void;
  onSelectCategory?: (catId: string) => void;
}

type PolicyKey = 'about' | 'contact' | 'faq' | 'shipping' | 'return' | 'privacy' | 'terms';

export const Footer: React.FC<FooterProps> = ({ onOpenTracking }) => {
  const [activePolicy, setActivePolicy] = useState<PolicyKey | null>(null);

  const renderPolicyContent = () => {
    switch (activePolicy) {
      case 'about':
        return {
          title: 'আমাদের সম্পর্কে (About Us)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed font-sans">
              <p>
                <strong>সাশ্রয়ী দাম | Sashroyi Daam</strong> একটি নির্ভরযোগ্য জাতীয় অনলাইন রিটেইল প্ল্যাটফর্ম। আমাদের মূল লক্ষ্য—বাংলাদেশের প্রতিটি গৃহস্থালিতে সুলভ মূল্যে খাঁটি, মানসম্পন্ন ও প্রয়োজনীয় পণ্য পৌঁছে দেওয়া।
              </p>
              <p>
                “আপনার পছন্দ, সাশ্রয়ী দাম ও সেরা মান”—এই প্রতিপাদ্যকে ধারণ করে আমরা রান্নাঘরের ঐতিহ্যবাহী টেকসই সামগ্রী, দেশীয় পোশাক, দৈনন্দিন প্রয়োজনীয় গ্যাজেট সরাসরি গ্রাহকের দ্বারে সরবরাহ করি।
              </p>
            </div>
          )
        };
      case 'contact':
        return {
          title: 'যোগাযোগ ও সাপোর্ট (Contact & Support)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed font-sans">
              <p>যেকোনো জিজ্ঞাসা, অর্ডার অনুসন্ধান কিংবা পরামর্শের জন্য আমাদের কাস্টমার কেয়ার টিমের সাথে যোগাযোগ করুন:</p>
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1.5 font-medium text-stone-800">
                <div>📞 হেল্পলাইন: ০৯৬১২-৮৮৯৯০০ (সকাল ৯টা – রাত ১০টা)</div>
                <div>💬 হোয়াটসঅ্যাপ: +880 1700-000000</div>
                <div>✉️ ইমেইল: support@sashroyidaam.com</div>
                <div>🏢 প্রধান কার্যালয়: বাড়ি ৪২, রোড ১১, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০</div>
              </div>
            </div>
          )
        };
      case 'faq':
        return {
          title: 'সাধারণ জিজ্ঞাসা (FAQ)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed font-sans">
              <div>
                <strong className="text-stone-900 block mb-0.5">১. আমি কি অ্যাকাউন্ট ছাড়াই অর্ডার করতে পারি?</strong>
                <p>হ্যাঁ, কোনো অ্যাকাউন্ট ছাড়াও চেকআউটে নাম, মোবাইল ও ঠিকানা দিয়ে সরাসরি ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারবেন।</p>
              </div>
              <div>
                <strong className="text-stone-900 block mb-0.5">২. ডেলিভারি হতে কত দিন সময় লাগে?</strong>
                <p>ঢাকায় ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে সারাদেশে ৭২ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়।</p>
              </div>
              <div>
                <strong className="text-stone-900 block mb-0.5">৩. দেখে কি মূল্য পরিশোধ করা যাবে?</strong>
                <p>হ্যাঁ, ডেলিভারিম্যানের সামনে পার্সেল যাচাই করে আসল পণ্য নিশ্চিত হয়ে মূল্য পরিশোধের শতভাগ নিশ্চয়তা রয়েছে।</p>
              </div>
            </div>
          )
        };
      case 'shipping':
        return {
          title: 'ডেলিভারি নীতিমালা (Delivery Policy)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed font-sans">
              <p>১. ঢাকা মেট্রোর ভেতরে ডেলিভারি চার্জ ৳৬০ এবং ঢাকার বাইরে সারাদেশে ৳১২০।</p>
              <p>২. ২,০০০ টাকার কেনাকাটায় সারাদেশে সম্পূর্ণ ফ্রি হোম ডেলিভারি।</p>
              <p>৩. প্রতিটি অর্ডারে ট্র্যাকিং আইডি দেওয়া হয়, যা দিয়ে ওয়েবসাইটে সরাসরি পার্সেল ট্র্যাক করা যায়।</p>
            </div>
          )
        };
      case 'return':
        return {
          title: 'রিটার্ন ও রিপ্লেসমেন্ট (Return & Replacement Policy)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed font-sans">
              <p>১. পণ্যে কোনো উৎপাদন ত্রুটি থাকলে ৭ কার্যদিবসের মধ্যে ১০০% ঝামেলাহীন রিপ্লেসমেন্ট প্রদান করা হয়।</p>
              <p>২. ডেলিভারিম্যানের সামনে পণ্য যাচাই করে কোনো ত্রুটি পেলে সাথে সাথেই রিটার্ন করতে পারেন।</p>
            </div>
          )
        };
      case 'privacy':
        return {
          title: 'গোপনীয়তা নীতিমালা (Privacy Policy)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed font-sans">
              <p>গ্রাহকের তথ্যের সর্বোচ্চ গোপনীয়তা আমাদের অঙ্গীকার। নাম, মোবাইল নম্বর এবং ঠিকানা কেবল অর্ডার ডেলিভারি ও যাচাইকরণের জন্য ব্যবহৃত হয়। কোনো তৃতীয় পক্ষের কাছে তথ্য হস্তান্তর করা হয় না।</p>
            </div>
          )
        };
      case 'terms':
        return {
          title: 'ব্যবহারের শর্তাবলী (Terms & Conditions)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed font-sans">
              <p>সাশ্রয়ী দাম প্ল্যাটফর্মে অর্ডার প্রদান করার মাধ্যমে আপনি আমাদের বিক্রয় নীতিমালার সাথে একমত পোষণ করছেন। সমস্ত মূল্য বাংলাদেশি টাকা (BDT) হিসেবে নির্ধারিত এবং স্টক সাপেক্ষ।</p>
            </div>
          )
        };
      default:
        return null;
    }
  };

  const policyData = renderPolicyContent();

  return (
    <footer className="bg-stone-900 text-stone-300 text-xs border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand Info & Social Links */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="light" size="md" showTagline={true} />
            <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
              বাংলাদেশের প্রতিটি পরিবারের জন্য মানসম্মত পণ্য, সাশ্রয়ী দাম ও নির্ভরযোগ্য সেবা। সারাদেশে দ্রুত হোম ডেলিভারি ও পার্সেল দেখে পরিশোধের নিশ্চয়তা।
            </p>

            {/* Social Links: Facebook, WhatsApp, Instagram */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
                কানেক্টেড থাকুন (Social Links)
              </span>
              <div className="flex items-center gap-2.5">
                {/* Facebook */}
                <a
                  href="https://facebook.com/sashroyidaam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#1877F2]/20 hover:bg-[#1877F2] text-white border border-[#1877F2]/50 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xs cursor-pointer group"
                  title="Facebook (@sashroyidaam)"
                  aria-label="Facebook"
                >
                  <span className="font-bold text-sm leading-none">f</span>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/8801700000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/50 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xs cursor-pointer group"
                  title="WhatsApp (+8801700000000)"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 fill-current/20 group-hover:fill-current" />
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com/sashroyidaam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-pink-500/20 hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] text-pink-400 hover:text-white border border-pink-500/50 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xs cursor-pointer group"
                  title="Instagram (@sashroyidaam)"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Helpline details */}
            <div className="pt-2 space-y-1.5 text-stone-400 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>হেল্পলাইন: ০৯৬১২-৮৮৯৯০০ (সকাল ৯টা – রাত ১০টা)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ইমেইল: support@sashroyidaam.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>বাড়ি ৪২, রোড ১১, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০</span>
              </div>
            </div>
          </div>

          {/* Quick Help & Tracking */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">গ্রাহক সেবা</h3>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  onClick={onOpenTracking}
                  className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>অর্ডার ট্র্যাক করুন (Track Order)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicy('shipping')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  ডেলিভারি নীতিমালা (Delivery Policy)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicy('return')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  রিটার্ন ও রিপ্লেসমেন্ট (Replacement)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicy('faq')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  সাধারণ জিজ্ঞাসা (FAQ)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicy('contact')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  যোগাযোগ ও সাপোর্ট (Support)
                </button>
              </li>
            </ul>
          </div>

          {/* About & Trust */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">ব্র্যান্ড ও শর্তাবলী</h3>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  onClick={() => setActivePolicy('about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  আমাদের সম্পর্কে (About Us)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicy('privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  গোপনীয়তা নীতিমালা (Privacy)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicy('terms')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  ব্যবহারের শর্তাবলী (Terms)
                </button>
              </li>
            </ul>

            <div className="pt-2">
              <span className="text-[11px] font-semibold text-stone-400 block mb-1">
                পেমেন্ট মাধ্যম:
              </span>
              <div className="text-[11px] text-stone-300 font-medium leading-relaxed">
                ক্যাশ অন ডেলিভারি · বিকাশ · নগদ · রকেট · কার্ড
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="mt-10 pt-5 border-t border-stone-800 text-stone-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} সাশ্রয়ী দাম | Sashroyi Daam. সর্বস্বত্ব সংরক্ষিত।
          </div>
          <div className="flex items-center gap-4">
            <span>জাতীয় অনলাইন শপ</span>
            <span aria-hidden="true">·</span>
            <span>ঢাকা, বাংলাদেশ</span>
          </div>
        </div>
      </div>

      {/* POLICY POPUP MODAL */}
      {policyData && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900">{policyData.title}</h3>
              <button
                onClick={() => setActivePolicy(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            {policyData.content}
            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setActivePolicy(null)}
                className="px-4 py-1.5 bg-[#0F4C3A] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
