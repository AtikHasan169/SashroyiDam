export interface BDDivisionData {
  id: string;
  nameBn: string;
  nameEn: string;
  districts: {
    nameBn: string;
    nameEn: string;
    upazilas: string[];
  }[];
}

export const BANGLADESH_DIVISIONS: BDDivisionData[] = [
  {
    id: 'dhaka',
    nameBn: 'ঢাকা',
    nameEn: 'Dhaka',
    districts: [
      {
        nameBn: 'ঢাকা',
        nameEn: 'Dhaka',
        upazilas: [
          'ধানমন্ডি',
          'গুলশান',
          'বনানী',
          'মিরপুর',
          'উত্তরা',
          'মোহাম্মদপুর',
          'মতিঝিল',
          'নিউ মার্কেট',
          'তেজগাঁও',
          'বাড্ডা',
          'খিলগাঁও',
          'যাত্রাবাড়ী',
          'সাভার',
          'কেরানীগঞ্জ',
          'ধামরাই'
        ]
      },
      {
        nameBn: 'গাজীপুর',
        nameEn: 'Gazipur',
        upazilas: ['গাজীপুর সদর', 'কালিয়াকৈর', 'শ্রীপুর', 'কাপাসিয়া', 'কালীগঞ্জ']
      },
      {
        nameBn: 'নারায়ণগঞ্জ',
        nameEn: 'Narayanganj',
        upazilas: ['নারায়ণগঞ্জ সদর', 'সিদ্ধিরগঞ্জ', 'ফতুল্লা', 'রূপগঞ্জ', 'সোনারগাঁও', 'আড়াইহাজার']
      },
      {
        nameBn: 'টাঙ্গাইল',
        nameEn: 'Tangail',
        upazilas: ['টাঙ্গাইল সদর', 'মির্জাপুর', 'ঘাটাইল', 'মধুপুর', 'কালিহাতী', 'সখীপুর']
      },
      {
        nameBn: 'নরসিংদী',
        nameEn: 'Narsingdi',
        upazilas: ['নরসিংদী সদর', 'পলাশ', 'রায়পুরা', 'শিবপুর', 'বেলাবো', 'মনোহরদী']
      },
      {
        nameBn: 'মানিকগঞ্জ',
        nameEn: 'Manikganj',
        upazilas: ['মানিকগঞ্জ সদর', 'সিংগাইর', 'শিবালয়', 'সাটুরিয়া']
      },
      {
        nameBn: 'মুন্সীগঞ্জ',
        nameEn: 'Munshiganj',
        upazilas: ['মুন্সীগঞ্জ সদর', 'শ্রীনগর', 'সিরাজদিখান', 'লৌহজং', 'গজারিয়া']
      },
      {
        nameBn: 'ফরিদপুর',
        nameEn: 'Faridpur',
        upazilas: ['ফরিদপুর সদর', 'বোয়ালমারী', 'মধুখালী', 'ভাঙ্গা']
      }
    ]
  },
  {
    id: 'chattogram',
    nameBn: 'চট্টগ্রাম',
    nameEn: 'Chattogram',
    districts: [
      {
        nameBn: 'চট্টগ্রাম',
        nameEn: 'Chattogram',
        upazilas: ['কোতোয়ালী', 'পাঁচলাইশ', 'হালিশহর', 'খুলশী', 'পতেঙ্গা', 'পটিয়া', 'হাটহাজারী', 'সীতাকুণ্ড', 'মিরসরাই', 'রাউজান']
      },
      {
        nameBn: 'কক্সবাজার',
        nameEn: "Cox's Bazar",
        upazilas: ['কক্সবাজার সদর', 'রামু', 'উখিয়া', 'টেকনাফ', 'চকরিয়া']
      },
      {
        nameBn: 'কুমিল্লা',
        nameEn: 'Cumilla',
        upazilas: ['আদর্শ সদর', 'সদর দক্ষিণ', 'দাউদকান্দি', 'চান্দিনা', 'লাকসাম', 'চৌদ্দগ্রাম']
      },
      {
        nameBn: 'ব্রাহ্মণবাড়িয়া',
        nameEn: 'Brahmanbaria',
        upazilas: ['ব্রাহ্মণবাড়িয়া সদর', 'আশুগঞ্জ', 'সরাইল', 'কসবা', 'নবীনগর']
      },
      {
        nameBn: 'ফেনী',
        nameEn: 'Feni',
        upazilas: ['ফেনী সদর', 'দাগনভূঞা', 'সোনাগাজী', 'ছাগলনাইয়া']
      },
      {
        nameBn: 'নোয়াখালী',
        nameEn: 'Noakhali',
        upazilas: ['নোয়াখালী সদর', 'বেগমগঞ্জ', 'চাটখিল', 'কোম্পানীগঞ্জ']
      }
    ]
  },
  {
    id: 'sylhet',
    nameBn: 'সিলেট',
    nameEn: 'Sylhet',
    districts: [
      {
        nameBn: 'সিলেট',
        nameEn: 'Sylhet',
        upazilas: ['সিলেট সদর', 'দক্ষিণ সুরমা', 'গোলাপগঞ্জ', 'বিয়ানীবাজার', 'জৈন্তাপুর', 'বিশ্বনাথ']
      },
      {
        nameBn: 'মৌলভীবাজার',
        nameEn: 'Moulvibazar',
        upazilas: ['মৌলভীবাজার সদর', 'শ্রীমঙ্গল', 'কমলগঞ্জ', 'কুলাউড়া']
      },
      {
        nameBn: 'হবিগঞ্জ',
        nameEn: 'Habiganj',
        upazilas: ['হবিগঞ্জ সদর', 'মাধবপুর', 'চুনারুঘাট', 'নবীগঞ্জ']
      },
      {
        nameBn: 'সুনামগঞ্জ',
        nameEn: 'Sunamganj',
        upazilas: ['সুনামগঞ্জ সদর', 'ছাতক', 'জগন্নাথপুর', 'তাহিরপুর']
      }
    ]
  },
  {
    id: 'rajshahi',
    nameBn: 'রাজশাহী',
    nameEn: 'Rajshahi',
    districts: [
      {
        nameBn: 'রাজশাহী',
        nameEn: 'Rajshahi',
        upazilas: ['বোয়ালিয়া', 'মতিহার', 'রাজপাড়া', 'পবা', 'গোদাগাড়ী', 'বাঘা', 'চারঘাট']
      },
      {
        nameBn: 'বগুড়া',
        nameEn: 'Bogura',
        upazilas: ['বগুড়া সদর', 'শেরপুর', 'শিবগঞ্জ', 'দুপচাঁচিয়া', 'গাবতলী']
      },
      {
        nameBn: 'পাবনা',
        nameEn: 'Pabna',
        upazilas: ['পাবনা সদর', 'ঈশ্বরদী', 'সাঁথিয়া', 'সুজানগর', 'চাটমোহর']
      },
      {
        nameBn: 'সিরাজগঞ্জ',
        nameEn: 'Sirajganj',
        upazilas: ['সিরাজগঞ্জ সদর', 'শাহজাদপুর', 'উল্লাপাড়া', 'বেলকুচি']
      }
    ]
  },
  {
    id: 'khulna',
    nameBn: 'খুলনা',
    nameEn: 'Khulna',
    districts: [
      {
        nameBn: 'খুলনা',
        nameEn: 'Khulna',
        upazilas: ['খুলনা সদর', 'সোনাডাঙ্গা', 'খালিশপুর', 'ডুমুরিয়া', 'রূপসা', 'পাইকগাছা']
      },
      {
        nameBn: 'যশোর',
        nameEn: 'Jashore',
        upazilas: ['যশোর সদর', 'ঝিকরগাছা', 'অভয়নগর', 'কেশবপুর', 'মনিরামপুর']
      },
      {
        nameBn: 'কুষ্টিয়া',
        nameEn: 'Kushtia',
        upazilas: ['কুষ্টিয়া সদর', 'কুমারখালী', 'মিরপুর', 'ভেড়ামারা']
      },
      {
        nameBn: 'সাতক্ষীরা',
        nameEn: 'Satkhira',
        upazilas: ['সাতক্ষীরা সদর', 'কালীগঞ্জ', 'শ্যামনগর', 'তালা']
      }
    ]
  },
  {
    id: 'barishal',
    nameBn: 'বরিশাল',
    nameEn: 'Barishal',
    districts: [
      {
        nameBn: 'বরিশাল',
        nameEn: 'Barishal',
        upazilas: ['বরিশাল সদর', 'বাবুগঞ্জ', 'উজিরপুর', 'গৌরনদী', 'বাকেরগঞ্জ']
      },
      {
        nameBn: 'পটুয়াখালী',
        nameEn: 'Patuakhali',
        upazilas: ['পটুয়াখালী সদর', 'কলাপাড়া', 'গলাচিপা', 'বাউফল']
      },
      {
        nameBn: 'ভোলা',
        nameEn: 'Bhola',
        upazilas: ['ভোলা সদর', 'বোরহানউদ্দিন', 'চরফ্যাশন', 'দৌলতখান']
      }
    ]
  },
  {
    id: 'rangpur',
    nameBn: 'রংপুর',
    nameEn: 'Rangpur',
    districts: [
      {
        nameBn: 'রংপুর',
        nameEn: 'Rangpur',
        upazilas: ['রংপুর সদর', 'মিঠাপুকুর', 'পীরগঞ্জ', 'বদরগঞ্জ', 'কাউনিয়া']
      },
      {
        nameBn: 'দিনাজপুর',
        nameEn: 'Dinajpur',
        upazilas: ['দিনাজপুর সদর', 'বিরল', 'বীরগঞ্জ', 'ফুলবাড়ী', 'পার্বতীপুর']
      },
      {
        nameBn: 'কুড়িগ্রাম',
        nameEn: 'Kurigram',
        upazilas: ['কুড়িগ্রাম সদর', 'উলিপুর', 'নাগেশ্বরী', 'চিলমারী']
      }
    ]
  },
  {
    id: 'mymensingh',
    nameBn: 'ময়মনসিংহ',
    nameEn: 'Mymensingh',
    districts: [
      {
        nameBn: 'ময়মনসিংহ',
        nameEn: 'Mymensingh',
        upazilas: ['ময়মনসিংহ সদর', 'মুক্তাগাছা', 'ত্রিশাল', 'ভালুকা', 'গফরগাঁও']
      },
      {
        nameBn: 'জামালপুর',
        nameEn: 'Jamalpur',
        upazilas: ['জামালপুর সদর', 'সরিষাবাড়ী', 'মেলান্দহ', 'ইসলামপুর']
      }
    ]
  }
];
