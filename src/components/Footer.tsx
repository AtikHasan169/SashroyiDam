import React, { useState } from 'react';
import { Phone, Mail, MapPin, ShieldCheck, HelpCircle, FileText, RefreshCw, Truck } from 'lucide-react';

interface FooterProps {
  onOpenTracking: () => void;
  onSelectCategory: (catId: string) => void;
}

type PolicyKey = 'about' | 'contact' | 'faq' | 'shipping' | 'return' | 'privacy' | 'terms';

export const Footer: React.FC<FooterProps> = ({ onOpenTracking, onSelectCategory }) => {
  const [activePolicy, setActivePolicy] = useState<PolicyKey | null>(null);

  const renderPolicyContent = () => {
    switch (activePolicy) {
      case 'about':
        return {
          title: 'আমাদের সম্পর্কে (About Oshesh)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <p>
                <strong>অশেষ (Oshesh)</strong> একটি জাতীয় আধুনিক বাংলাদেশি রিটেইল ব্র্যান্ড। আমাদের মূল লক্ষ্য—বাংলাদেশের প্রতিটি গৃহস্থালিতে সুলভ মূল্যে খাঁটি, মানসম্পন্ন ও প্রয়োজনীয় পণ্য পৌঁছে দেওয়া।
              </p>
              <p>
                “আপনার পছন্দ, অশেষ সম্ভাবনা”—এই প্রতিপাদ্যকে ধারণ করে আমরা রান্নাঘরের ঐতিহ্যবাহী কপার ও কাস্ট আয়রন সামগ্রী, টাঙ্গাইল ও জামদানি ঐতিহ্যবাহী হস্তচালিত সুতি পোশাক, দৈনন্দিন প্রয়োজনীয় গ্যাজেট এবং স্বাস্থ্যকর পণ্য সরাসরি গ্রাহকের দ্বারে সরবরাহ করি।
              </p>
              <p>
                আমরা কোনো কৃত্রিম ডিসকাউন্ট বা অতিরঞ্জিত রিভিউ সমর্থন করি না। আমাদের প্রতিটি পণ্যের বিবরণ বাস্তব ও পরীক্ষিত।
              </p>
            </div>
          )
        };
      case 'contact':
        return {
          title: 'যোগাযোগ ও গ্রাহক সেবা (Contact Us)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <p>যেকোনো জিজ্ঞাসা, অর্ডার অনুসন্ধান কিংবা পরামর্শের জন্য আমাদের কাস্টমার কেয়ার টিমের সাথে যোগাযোগ করুন:</p>
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1.5 font-medium text-stone-800">
                <div>📞 হেল্পলাইন: ০৯৬১২-৮৮৯৯০০ (প্রতিদিন সকাল ৯টা – রাত ১০টা)</div>
                <div>✉️ ইমেইল: support@oshesh.com.bd</div>
                <div>🏢 প্রধান কার্যালয়: বাড়ি ৪২, রোড ১১, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০</div>
              </div>
            </div>
          )
        };
      case 'faq':
        return {
          title: 'সাধারণ জিজ্ঞাসা (FAQ)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <div>
                <strong className="text-stone-900 block mb-0.5">১. আমি কি ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারি?</strong>
                <p>হ্যাঁ, বাংলাদেশের ৬৪টি জেলাতেই ক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে। পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।</p>
              </div>
              <div>
                <strong className="text-stone-900 block mb-0.5">২. ডেলিভারি হতে কত দিন সময় লাগে?</strong>
                <p>ঢাকা মেট্রো সিটিতে সাধারণত ১-২ কার্যদিবস এবং ঢাকার বাইরে ২-৪ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়।</p>
              </div>
              <div>
                <strong className="text-stone-900 block mb-0.5">৩. ফ্রি ডেলিভারি কীভাবে পাওয়া যায়?</strong>
                <p>কার্টে পণ্যের মূল্য ২,০০০ টাকা বা তার বেশি হলে সারাদেশে সম্পূর্ণ ফ্রি ডেলিভারি প্রদান করা হয়।</p>
              </div>
            </div>
          )
        };
      case 'shipping':
        return {
          title: 'ডেলিভারি ও শিপিং নীতিমালা (Shipping Policy)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <p>১. ঢাকা মেট্রোর অভ্যন্তরে ডেলিভারি চার্জ ৳৭০ এবং ঢাকার বাইরে সমগ্র বাংলাদেশে ৳১৩০।</p>
              <p>২. ২,০০০ টাকার অর্ডারে সারাদেশে ফ্রি হোম ডেলিভারি প্রযোজ্য।</p>
              <p>৩. প্রতিটি অর্ডারের সাথে একটি ইউনিক ট্র্যাকিং নম্বর প্রদান করা হয়, যার মাধ্যমে আমাদের ওয়েবসাইটে সরাসরি বর্তমান অবস্থা জানা যায়।</p>
            </div>
          )
        };
      case 'return':
        return {
          title: 'রিটার্ন ও রিফান্ড নীতিমালা (Return & Refund Policy)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <p>১. পণ্য পাওয়ার ৭ দিনের মধ্যে যেকোনো উৎপাদন ত্রুটি থাকলে বিনামূল্যে রিপ্লেসমেন্ট সুবিধা দেওয়া হয়।</p>
              <p>২. ডেলিভারিম্যানের সামনে পণ্য চেক করে গ্রহণ করার অনুরোধ করা হচ্ছে।</p>
              <p>৩. অনলাইন পেমেন্টে কোনো অর্ডার বাতিল হলে ৫-৭ কার্যদিবসের মধ্যে মূল পেমেন্ট মাধ্যমে সমপরিমাণ অর্থ রিফান্ড করা হয়।</p>
            </div>
          )
        };
      case 'privacy':
        return {
          title: 'গোপনীয়তা নীতিমালা (Privacy Policy)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <p>আমরা গ্রাহকের ব্যক্তিগত তথ্যের সর্বোচ্চ সুরক্ষা নিশ্চিত করি। আপনার নাম, মোবাইল নম্বর এবং ঠিকানা শুধুমাত্র ডেলিভারি ও অর্ডার যাচাইকরণের জন্য ব্যবহৃত হয়। কোনো তৃতীয় পক্ষের কাছে তথ্য বিক্রয় করা হয় না।</p>
            </div>
          )
        };
      case 'terms':
        return {
          title: 'ব্যবহারের শর্তাবলী (Terms & Conditions)',
          content: (
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <p>অশেষ প্ল্যাটফর্মে অর্ডার প্রদান করার মাধ্যমে আপনি আমাদের নির্ধারিত বিক্রয় নীতিমালার সাথে একমত পোষণ করছেন। সমস্ত মূল্য বাংলাদেশি টাকা (BDT) হিসেবে নির্ধারিত এবং স্টক সাপেক্ষ।</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col text-left">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sans text-emerald-400">সাশ্রয়ী দাম</span>
                <span className="text-base font-semibold text-stone-300 font-sans">| Sashroyi Daam</span>
              </div>
              <span className="text-xs text-emerald-300 font-medium">@sashroyidaam</span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
              আপনার পছন্দ, সাশ্রয়ী দাম ও অশেষ সম্ভাবনা। বাংলাদেশের প্রতিটি পরিবারের জন্য মানসম্মত গৃহস্থালি পণ্য, দেশীয় পোশাক ও টেকসই গ্যাজেটের নির্ভরযোগ্য ঠিকানা।
            </p>

            {/* Direct Facebook Page Link Card */}
            <a
              href="https://facebook.com/sashroyidaam"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 rounded-xl text-emerald-200 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs shrink-0">
                f
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">সাশ্রয়ী দাম | Sashroyi Daam</div>
                <div className="text-[10px] text-emerald-300">ফেসবুক পেজ: @sashroyidaam</div>
              </div>
            </a>

            <div className="pt-1 space-y-1.5 text-stone-400">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>হেল্পলাইন: ০৯৬১২-৮৮৯৯০০</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>ইমেইল: support@sashroyidaam.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>বাড়ি ৪২, রোড ১১, সেক্টর ৩, উত্তরা, ঢাকা-১২৩০</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">ক্যাটাগরি</h3>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  onClick={() => onSelectCategory('cat-kitchen')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  গৃহস্থালি ও রান্নাঘর
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('cat-fashion')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  ফ্যাশন ও তাঁতের পোশাক
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('cat-gadgets')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  গ্যাজেট ও ইলেকট্রনিক্স
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('all')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  সকল পণ্য তালিকা
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">গ্রাহক সেবা</h3>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button onClick={onOpenTracking} className="hover:text-white transition-colors cursor-pointer text-left">
                  অর্ডার ট্র্যাক করুন
                </button>
              </li>
              <li>
                <button onClick={() => setActivePolicy('shipping')} className="hover:text-white transition-colors cursor-pointer text-left">
                  ডেলিভারি নীতিমালা
                </button>
              </li>
              <li>
                <button onClick={() => setActivePolicy('return')} className="hover:text-white transition-colors cursor-pointer text-left">
                  রিটার্ন ও রিফান্ড
                </button>
              </li>
              <li>
                <button onClick={() => setActivePolicy('faq')} className="hover:text-white transition-colors cursor-pointer text-left">
                  সাধারণ জিজ্ঞাসা (FAQ)
                </button>
              </li>
              <li>
                <button onClick={() => setActivePolicy('contact')} className="hover:text-white transition-colors cursor-pointer text-left">
                  যোগাযোগ
                </button>
              </li>
            </ul>
          </div>

          {/* About & Trust */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">ব্র্যান্ড ও নিরাপত্তা</h3>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button onClick={() => setActivePolicy('about')} className="hover:text-white transition-colors cursor-pointer text-left">
                  আমাদের সম্পর্কে
                </button>
              </li>
              <li>
                <button onClick={() => setActivePolicy('privacy')} className="hover:text-white transition-colors cursor-pointer text-left">
                  গোপনীয়তা নীতিমালা
                </button>
              </li>
              <li>
                <button onClick={() => setActivePolicy('terms')} className="hover:text-white transition-colors cursor-pointer text-left">
                  ব্যবহারের শর্তাবলী
                </button>
              </li>
            </ul>

            <div className="pt-2">
              <span className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                পেমেন্ট মাধ্যম:
              </span>
              <div className="text-[11px] text-stone-300 font-medium">
                ক্যাশ অন ডেলিভারি · SSLCOMMERZ · বিকাশ · নগদ · রকেট · ভিসা/মাস্টারকার্ড
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="mt-12 pt-6 border-t border-stone-800 text-stone-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} সাশ্রয়ী দাম | Sashroyi Daam (@sashroyidaam). সর্বস্বত্ব সংরক্ষিত।
          </div>
          <div className="flex items-center gap-4">
            <span>জাতীয় ই-কমার্স প্ল্যাটফর্ম</span>
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
