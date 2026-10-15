import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, RefreshCw, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-16">
      {/* Core Value Propositions */}
      <div className="border-b border-gray-100 bg-brand-light/50 py-8">
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-brand text-white shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                যাচাইকৃত মান ও সঠিক বিবরণ
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                প্রতিটি পণ্যের আসল ছবি ও সঠিক বিবরণ দেখে নিশ্চিন্তে অর্ডার করুন।
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-brand text-white shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                সারা বাংলাদেশে হোম ডেলিভারি
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                ঢাকা ও ঢাকার বাইরে দ্রুত ডেলিভারি এবং ক্যাশ অন ডেলিভারি সুবিধা।
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-brand text-white shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                সহজ রিটার্ন ও সমাধান
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                ত্রুটিপূর্ণ বা ভুল পণ্য পেলে আমাদের নীতিমালা অনুযায়ী দ্রুত পরিবর্তনের সুবিধা।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-lg">
              সা
            </div>
            <div>
              <p className="font-bold text-lg text-brand leading-none">
                সাশ্রয়ী দাম
              </p>
              <p className="text-xs text-gray-500">Sashroyi Daam (SashroyiDam)</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            আপনার পছন্দ, সাশ্রয়ী দামে অশেষ সম্ভাবনা। বাংলাদেশের প্রতিটি পরিবারের দৈনন্দিন কেনাকাটাকে সহজ, সাশ্রয়ী এবং নির্ভরযোগ্য করাই আমাদের লক্ষ্য।
          </p>
          <div className="pt-1">
            <a
              href="https://facebook.com/sashroyidaam"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
            >
              <span>Facebook: সাশ্রয়ী দাম | Sashroyi Daam (@sashroyidaam)</span>
            </a>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3 text-base">পণ্য ক্যাটাগরি</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <Link href="/products?category=home-and-kitchen" className="hover:text-brand">
                হোম ও কিচেন সামগ্রী
              </Link>
            </li>
            <li>
              <Link href="/products?category=gadget-accessories" className="hover:text-brand">
                মোবাইল ও গ্যাজেট এক্সেসরিজ
              </Link>
            </li>
            <li>
              <Link href="/products?category=everyday-fashion" className="hover:text-brand">
                ডেইলি ফ্যাশন ও লাইফস্টাইল
              </Link>
            </li>
            <li>
              <Link href="/products?category=home-organizers" className="hover:text-brand">
                হোম অর্গানাইজার
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care & Policies */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3 text-base">গ্রাহক সেবা ও নীতিমালা</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <Link href="/track-order" className="hover:text-brand font-medium text-brand">
                অর্ডার ট্র্যাক করুন (Track Order)
              </Link>
            </li>
            <li>
              <Link href="/policies/shipping" className="hover:text-brand">
                ডেলিভারি ও শিপিং নীতিমালা
              </Link>
            </li>
            <li>
              <Link href="/policies/return-refund" className="hover:text-brand">
                রিটার্ন ও রিফান্ড নীতিমালা
              </Link>
            </li>
            <li>
              <Link href="/policies/privacy" className="hover:text-brand">
                প্রাইভেসি পলিসি (Privacy Policy)
              </Link>
            </li>
            <li>
              <Link href="/policies/terms" className="hover:text-brand">
                ব্যবহারের শর্তাবলী (Terms & Conditions)
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Details */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3 text-base">যোগাযোগ</h4>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-brand shrink-0 mt-1" />
              <span>হেল্পলাইন: ০৯৬০০-০০০০০০ (সকাল ১০টা – রাত ৮টা)</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-brand shrink-0 mt-1" />
              <span>support@sashroyidaam.com</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand shrink-0 mt-1" />
              <span>ঢাকা, বাংলাদেশ (সারা বাংলাদেশে কুরিয়ার ডেলিভারি)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-gray-200 bg-gray-50 py-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} সাশ্রয়ী দাম | Sashroyi Daam (SashroyiDam). সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p>নিরাপদ পেমেন্ট: Cash on Delivery (COD) ও SSLCOMMERZ</p>
        </div>
      </div>
    </footer>
  );
}
