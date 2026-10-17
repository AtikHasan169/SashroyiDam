export interface District {
  id: string;
  nameBn: string;
  nameEn: string;
  division: string;
  isDhakaCity: boolean;
}

export const BANGLADESH_DISTRICTS: District[] = [
  // Dhaka Division
  { id: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka', division: 'Dhaka', isDhakaCity: true },
  { id: 'gazipur', nameBn: 'গাজীপুর', nameEn: 'Gazipur', division: 'Dhaka', isDhakaCity: false },
  { id: 'narayanganj', nameBn: 'নারায়ণগঞ্জ', nameEn: 'Narayanganj', division: 'Dhaka', isDhakaCity: false },
  { id: 'tangail', nameBn: 'টাঙ্গাইল', nameEn: 'Tangail', division: 'Dhaka', isDhakaCity: false },
  { id: 'faridpur', nameBn: 'ফরিদপুর', nameEn: 'Faridpur', division: 'Dhaka', isDhakaCity: false },
  { id: 'gopalganj', nameBn: 'গোপালগঞ্জ', nameEn: 'Gopalganj', division: 'Dhaka', isDhakaCity: false },
  { id: 'kishoreganj', nameBn: 'কিশোরগঞ্জ', nameEn: 'Kishoreganj', division: 'Dhaka', isDhakaCity: false },
  { id: 'madaripur', nameBn: 'মাদারীপুর', nameEn: 'Madaripur', division: 'Dhaka', isDhakaCity: false },
  { id: 'manikganj', nameBn: 'মানিকগঞ্জ', nameEn: 'Manikganj', division: 'Dhaka', isDhakaCity: false },
  { id: 'munshiganj', nameBn: 'মুন্সীগঞ্জ', nameEn: 'Munshiganj', division: 'Dhaka', isDhakaCity: false },
  { id: 'narsingdi', nameBn: 'নরসিংদী', nameEn: 'Narsingdi', division: 'Dhaka', isDhakaCity: false },
  { id: 'rajbari', nameBn: 'রাজবাড়ী', nameEn: 'Rajbari', division: 'Dhaka', isDhakaCity: false },
  { id: 'shariatpur', nameBn: 'শরীয়তপুর', nameEn: 'Shariatpur', division: 'Dhaka', isDhakaCity: false },

  // Chattogram Division
  { id: 'chattogram', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram', division: 'Chattogram', isDhakaCity: false },
  { id: 'coxsbazar', nameBn: 'কক্সবাজার', nameEn: 'Cox\'s Bazar', division: 'Chattogram', isDhakaCity: false },
  { id: 'cumilla', nameBn: 'কুমিল্লা', nameEn: 'Cumilla', division: 'Chattogram', isDhakaCity: false },
  { id: 'feni', nameBn: 'ফেনী', nameEn: 'Feni', division: 'Chattogram', isDhakaCity: false },
  { id: 'brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', nameEn: 'Brahmanbaria', division: 'Chattogram', isDhakaCity: false },
  { id: 'chandpur', nameBn: 'চাঁদপুর', nameEn: 'Chandpur', division: 'Chattogram', isDhakaCity: false },
  { id: 'lakshmipur', nameBn: 'লক্ষ্মীপুর', nameEn: 'Lakshmipur', division: 'Chattogram', isDhakaCity: false },
  { id: 'noakhali', nameBn: 'নোয়াখালী', nameEn: 'Noakhali', division: 'Chattogram', isDhakaCity: false },
  { id: 'bandarban', nameBn: 'বান্দরবান', nameEn: 'Bandarban', division: 'Chattogram', isDhakaCity: false },
  { id: 'khagrachhari', nameBn: 'খাগড়াছড়ি', nameEn: 'Khagrachhari', division: 'Chattogram', isDhakaCity: false },
  { id: 'rangamati', nameBn: 'রাঙ্গামাটি', nameEn: 'Rangamati', division: 'Chattogram', isDhakaCity: false },

  // Sylhet Division
  { id: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet', division: 'Sylhet', isDhakaCity: false },
  { id: 'moulvibazar', nameBn: 'মৌলভীবাজার', nameEn: 'Moulvibazar', division: 'Sylhet', isDhakaCity: false },
  { id: 'habiganj', nameBn: 'হবিগঞ্জ', nameEn: 'Habiganj', division: 'Sylhet', isDhakaCity: false },
  { id: 'sunamganj', nameBn: 'সুনামগঞ্জ', nameEn: 'Sunamganj', division: 'Sylhet', isDhakaCity: false },

  // Rajshahi Division
  { id: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi', division: 'Rajshahi', isDhakaCity: false },
  { id: 'bogura', nameBn: 'বগুড়া', nameEn: 'Bogura', division: 'Rajshahi', isDhakaCity: false },
  { id: 'pabna', nameBn: 'পাবনা', nameEn: 'Pabna', division: 'Rajshahi', isDhakaCity: false },
  { id: 'sirajganj', nameBn: 'সিরাজগঞ্জ', nameEn: 'Sirajganj', division: 'Rajshahi', isDhakaCity: false },
  { id: 'naogaon', nameBn: 'নওগাঁ', nameEn: 'Naogaon', division: 'Rajshahi', isDhakaCity: false },
  { id: 'natore', nameBn: 'নাটোর', nameEn: 'Natore', division: 'Rajshahi', isDhakaCity: false },
  { id: 'chapai-nawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', nameEn: 'Chapai Nawabganj', division: 'Rajshahi', isDhakaCity: false },
  { id: 'joypurhat', nameBn: 'জয়পুরহাট', nameEn: 'Joypurhat', division: 'Rajshahi', isDhakaCity: false },

  // Khulna Division
  { id: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna', division: 'Khulna', isDhakaCity: false },
  { id: 'jashore', nameBn: 'যশোর', nameEn: 'Jashore', division: 'Khulna', isDhakaCity: false },
  { id: 'kushtia', nameBn: 'কুষ্টিয়া', nameEn: 'Kushtia', division: 'Khulna', isDhakaCity: false },
  { id: 'satkhira', nameBn: 'সাতক্ষীরা', nameEn: 'Satkhira', division: 'Khulna', isDhakaCity: false },
  { id: 'bagerhat', nameBn: 'বাগেরহাট', nameEn: 'Bagerhat', division: 'Khulna', isDhakaCity: false },
  { id: 'chuadanga', nameBn: 'চুয়াডাঙ্গা', nameEn: 'Chuadanga', division: 'Khulna', isDhakaCity: false },
  { id: 'jhenaidah', nameBn: 'ঝিনাইদহ', nameEn: 'Jhenaidah', division: 'Khulna', isDhakaCity: false },
  { id: 'magura', nameBn: 'মাগুরা', nameEn: 'Magura', division: 'Khulna', isDhakaCity: false },
  { id: 'meherpur', nameBn: 'মেহেরপুর', nameEn: 'Meherpur', division: 'Khulna', isDhakaCity: false },
  { id: 'narail', nameBn: 'নড়াইল', nameEn: 'Narail', division: 'Khulna', isDhakaCity: false },

  // Barishal Division
  { id: 'barishal', nameBn: 'বরিশাল', nameEn: 'Barishal', division: 'Barishal', isDhakaCity: false },
  { id: 'bhola', nameBn: 'ভোলা', nameEn: 'Bhola', division: 'Barishal', isDhakaCity: false },
  { id: 'jhalokathi', nameBn: 'ঝালকাঠি', nameEn: 'Jhalokathi', division: 'Barishal', isDhakaCity: false },
  { id: 'patuakhali', nameBn: 'পটুয়াখালী', nameEn: 'Patuakhali', division: 'Barishal', isDhakaCity: false },
  { id: 'pirojpur', nameBn: 'পিরোজপুর', nameEn: 'Pirojpur', division: 'Barishal', isDhakaCity: false },
  { id: 'barguna', nameBn: 'বরগুনা', nameEn: 'Barguna', division: 'Barishal', isDhakaCity: false },

  // Rangpur Division
  { id: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur', division: 'Rangpur', isDhakaCity: false },
  { id: 'dinajpur', nameBn: 'দিনাজপুর', nameEn: 'Dinajpur', division: 'Rangpur', isDhakaCity: false },
  { id: 'gaibandha', nameBn: 'গাইবান্ধা', nameEn: 'Gaibandha', division: 'Rangpur', isDhakaCity: false },
  { id: 'kurigram', nameBn: 'কুড়িগ্রাম', nameEn: 'Kurigram', division: 'Rangpur', isDhakaCity: false },
  { id: 'lalmonirhat', nameBn: 'লালমনিরহাট', nameEn: 'Lalmonirhat', division: 'Rangpur', isDhakaCity: false },
  { id: 'nilphamari', nameBn: 'নীলফামারী', nameEn: 'Nilphamari', division: 'Rangpur', isDhakaCity: false },
  { id: 'panchagarh', nameBn: 'পঞ্চগড়', nameEn: 'Panchagarh', division: 'Rangpur', isDhakaCity: false },
  { id: 'thakurgaon', nameBn: 'ঠাকুরগাঁও', nameEn: 'Thakurgaon', division: 'Rangpur', isDhakaCity: false },

  // Mymensingh Division
  { id: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', division: 'Mymensingh', isDhakaCity: false },
  { id: 'jamalpur', nameBn: 'জামালপুর', nameEn: 'Jamalpur', division: 'Mymensingh', isDhakaCity: false },
  { id: 'netrokona', nameBn: 'নেত্রকোণা', nameEn: 'Netrokona', division: 'Mymensingh', isDhakaCity: false },
  { id: 'sherpur', nameBn: 'শেরপুর', nameEn: 'Sherpur', division: 'Mymensingh', isDhakaCity: false },
];

export const getDistrictById = (id: string): District | undefined => {
  return BANGLADESH_DISTRICTS.find(d => d.id === id);
};

export const getDeliveryFeeForDistrict = (districtId: string, subtotal: number): number => {
  if (subtotal >= 2000) return 0; // Free delivery over 2000 BDT nationwide
  const district = getDistrictById(districtId);
  if (district && district.isDhakaCity) {
    return 70; // Dhaka Metro 70 BDT
  }
  return 130; // Outside Dhaka 130 BDT
};
