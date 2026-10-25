export type Language = 'en' | 'am';

export interface Translations {
  [key: string]: {
    en: string;
    am: string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav.home': { en: 'Home', am: 'ዋና ገጽ' },
  'nav.properties': { en: 'Properties', am: 'ቤቶች እና ሕንፃዎች' },
  'nav.map_search': { en: 'Map Search', am: 'በካርታ ፈልግ' },
  'nav.my_portal': { en: 'My Portal', am: 'የእኔ ፖርታል' },
  'nav.about': { en: 'About Us', am: 'ስለ እኛ' },
  'nav.contact': { en: 'Contact', am: 'ያግኙን' },
  'nav.services': { en: 'Services', am: 'አገልግሎቶች' },
  'nav.dashboard': { en: 'Dashboard', am: 'ዳሽቦርድ' },
  'nav.signin': { en: 'Sign In', am: 'ግባ' },
  'nav.signup': { en: 'Sign Up', am: 'ተመዝገብ' },
  'nav.logout': { en: 'Logout', am: 'ውጣ' },
  'nav.welcome': { en: 'Welcome', am: 'እንኳን ደህና መጡ' },
  'nav.menu': { en: 'Menu', am: 'ምናሌ' },
  'nav.language': { en: 'Language', am: 'ቋንቋ' },
  'nav.account': { en: 'Account', am: 'መለያ' },

  // Common Actions
  'action.search': { en: 'Search', am: 'ፈልግ' },
  'action.filter': { en: 'Filter', am: 'አጣራ' },
  'action.reset': { en: 'Reset', am: 'እንደገና ጀምር' },
  'action.save': { en: 'Save', am: 'አስቀምጥ' },
  'action.cancel': { en: 'Cancel', am: 'ሰርዝ' },
  'action.edit': { en: 'Edit', am: 'አስተካክል' },
  'action.delete': { en: 'Delete', am: 'አጥፋ' },
  'action.view': { en: 'View', am: 'ተመልከት' },
  'action.view_details': { en: 'View Details', am: 'ዝርዝር ይመልከቱ' },
  'action.submit': { en: 'Submit', am: 'አስገባ' },
  'action.add': { en: 'Add New', am: 'አዲስ ጨምር' },
  'action.add_property': { en: 'Add Property', am: 'አዲስ ቤት ጨምር' },
  'action.add_user': { en: 'Add User', am: 'አዲስ ተጠቃሚ ጨምር' },
  'action.back': { en: 'Back', am: 'ተመለስ' },
  'action.next': { en: 'Next', am: 'ቀጣይ' },
  'action.previous': { en: 'Previous', am: 'ቀዳሚ' },
  'action.close': { en: 'Close', am: 'ዝጋ' },
  'action.confirm': { en: 'Confirm', am: 'አረጋግጥ' },
  'action.download': { en: 'Download', am: 'አውርድ' },
  'action.upload': { en: 'Upload', am: 'ጫን' },
  'action.print': { en: 'Print', am: 'አትም' },
  'action.refresh': { en: 'Refresh', am: 'አድስ' },
  'action.browse_properties': { en: 'Browse Properties', am: 'ቤቶችን ይመልከቱ' },
  'action.contact_agent': { en: 'Contact an Agent', am: 'ደላላ ያነጋግሩ' },
  'action.learn_more': { en: 'Learn More', am: 'ተጨማሪ ይወቁ' },
  'action.explore': { en: 'Explore More', am: 'ተጨማሪ ያስሱ' },
  'action.apply_filters': { en: 'Apply Filters', am: 'ማጣሪያዎችን ተግብር' },
  'action.send_message': { en: 'Send Message', am: 'መልእክት ላክ' },
  'action.sending': { en: 'Sending...', am: 'በመላክ ላይ...' },

  // Statuses
  'status.available': { en: 'Available', am: 'የሚገኝ' },
  'status.sold': { en: 'Sold', am: 'የተሸጠ' },
  'status.rented': { en: 'Rented', am: 'የተከራየ' },
  'status.unavailable': { en: 'Unavailable', am: 'የማይገኝ' },
  'status.pending': { en: 'Pending', am: 'በመጠባበቅ ላይ' },
  'status.approved': { en: 'Approved', am: 'የጸደቀ' },
  'status.rejected': { en: 'Rejected', am: 'ውድቅ የተደረገ' },
  'status.active': { en: 'Active', am: 'ንቁ' },
  'status.inactive': { en: 'Inactive', am: 'ቦዝኗል' },
  'status.blocked': { en: 'Blocked', am: 'የታገደ' },
  'status.completed': { en: 'Completed', am: 'የተጠናቀቀ' },
  'status.under_review': { en: 'Under Review', am: 'በግምገማ ላይ' },

  // Roles
  'role.admin': { en: 'Admin', am: 'አስተዳዳሪ' },
  'role.administrator': { en: 'Administrator', am: 'ዋና አስተዳዳሪ' },
  'role.manager': { en: 'Manager', am: 'ስራ አስኪያጅ' },
  'role.owner': { en: 'Owner', am: 'ባለቤት' },
  'role.accountant': { en: 'Accountant', am: 'የሂሳብ ሹም' },
  'role.agent': { en: 'Agent', am: 'ወኪል / ደላላ' },
  'role.customer': { en: 'Customer', am: 'ደንበኛ' },
  'role.user': { en: 'User', am: 'ተጠቃሚ' },

  // Property Details
  'property.type': { en: 'Property Type', am: 'የንብረት ዓይነት' },
  'property.price': { en: 'Price', am: 'ዋጋ' },
  'property.bedrooms': { en: 'Bedrooms', am: 'መኝታ ቤቶች' },
  'property.bathrooms': { en: 'Bathrooms', am: 'መታጠቢያ ቤቶች' },
  'property.area': { en: 'Area (sqft)', am: 'ስፋት (ካሬ)' },
  'property.location': { en: 'Location', am: 'አድራሻ' },
  'property.city': { en: 'City', am: 'ከተማ' },
  'property.views': { en: 'Views', am: 'እይታዎች' },
  'property.amenities': { en: 'Amenities', am: 'ተጨማሪ አገልግሎቶች' },
  'property.featured': { en: 'Featured Properties', am: 'ተመራጭ ቤቶች' },
  'property.types': { en: 'Property Types', am: 'የቤት ዓይነቶች' },
  'property.all_types': { en: 'All Types', am: 'ሁሉም ዓይነቶች' },
  'property.apartment': { en: 'Apartment', am: 'አፓርታማ' },
  'property.villa': { en: 'Villa', am: 'ቪላ' },
  'property.condo': { en: 'Condo', am: 'ኮንዶሚኒየም' },
  'property.house': { en: 'House', am: 'መኖሪያ ቤት' },
  'property.land': { en: 'Land', am: 'መሬት' },
  'property.commercial': { en: 'Commercial', am: 'የንግድ ሕንፃ' },
  'property.office': { en: 'Office', am: 'ቢሮ' },
  'property.shop': { en: 'Commercial Shop', am: 'የንግድ ሱቅ' },
  'property.warehouse': { en: 'Warehouse', am: 'መጋዘን' },
  'property.hot_deal': { en: 'Hot Deal', am: 'ልዩ ቅናሽ' },
  'property.beds': { en: 'beds', am: 'መኝታ' },
  'property.baths': { en: 'baths', am: 'መታጠቢያ' },
  'property.sqft': { en: 'sqft', am: 'ስፋት' },

  // Dashboard & Admin Panels
  'dashboard.title': { en: 'Admin Dashboard', am: 'የአስተዳዳሪ ዳሽቦርድ' },
  'dashboard.overview': { en: 'Overview of your real estate platform performance', am: 'የቤቶች መድረክ አጠቃላይ የሥራ አፈጻጸም እይታ' },
  'dashboard.total_properties': { en: 'Total Properties', am: 'ጠቅላላ ቤቶች' },
  'dashboard.available_properties': { en: 'Available Properties', am: 'የሚገኙ ቤቶች' },
  'dashboard.sold_rented': { en: 'Sold / Rented', am: 'የተሸጡ / የተከራዩ' },
  'dashboard.total_orders': { en: 'Total Orders', am: 'ጠቅላላ ትዕዛዞች' },
  'dashboard.total_views': { en: 'Total Views', am: 'ጠቅላላ እይታዎች' },
  'dashboard.total_revenue': { en: 'Total Revenue', am: 'ጠቅላላ ገቢ' },
  'dashboard.quick_actions': { en: 'Quick Actions', am: 'ፈጣን እርምጃዎች' },
  'dashboard.announcements': { en: 'Announcements', am: 'ማስታወቂያዎች' },
  'dashboard.recent_activity': { en: 'Recent Activity', am: 'የቅርብ ጊዜ እንቅስቃሴዎች' },
  'dashboard.welcome_msg': { en: 'Welcome to your dashboard', am: 'እንኳን ወደ ዳሽቦርድዎ በደህና መጡ' },
  'dashboard.total_users': { en: 'Total Users', am: 'ጠቅላላ ተጠቃሚዎች' },
  'dashboard.active_users': { en: 'Active Users', am: 'ንቁ ተጠቃሚዎች' },
  'dashboard.blocked_users': { en: 'Blocked Users', am: 'የታገዱ ተጠቃሚዎች' },
  'dashboard.role_types': { en: 'Role Types', am: 'የሚና ዓይነቶች' },
  'dashboard.user_management': { en: 'User Management', am: 'የተጠቃሚዎች አስተዳደር' },
  'dashboard.house_management': { en: 'House Management', am: 'የቤቶች አስተዳደር' },
  'dashboard.all_roles': { en: 'All Roles', am: 'ሁሉም ሚናዎች' },
  'dashboard.all_statuses': { en: 'All Statuses', am: 'ሁሉም ሁኔታዎች' },
  'dashboard.search_placeholder': { en: 'Search by name, email, or phone...', am: 'በስም፣ ኢሜይል ወይም ስልክ ይፈልጉ...' },

  // Panels
  'panel.admin': { en: 'Admin Panel', am: 'የአስተዳዳሪ ክፍል' },
  'panel.owner': { en: 'Owner Panel', am: 'የባለቤት ክፍል' },
  'panel.manager': { en: 'Manager Panel', am: 'የስራ አስኪያጅ ክፍል' },
  'panel.accountant': { en: 'Accountant Panel', am: 'የሂሳብ ክፍል' },
  'panel.agent': { en: 'Agent Panel', am: 'የወኪል/ደላላ ክፍል' },
  'panel.customer': { en: 'Customer Panel', am: 'የደንበኛ ክፍል' },
  'panel.user': { en: 'User Panel', am: 'የተጠቃሚ ክፍል' },

  // Home Page Sections
  'home.hero_title': { en: 'Find Your Dream Home With Us', am: 'የህልምዎን ቤት ከእኛ ጋር ያግኙ' },
  'home.hero_subtitle': { en: 'Discover premium houses, luxury apartments, and profitable real estate investments across Ethiopia.', am: 'በኢትዮጵያ ውስጥ ምርጥ ቤቶችን፣ ዘመናዊ አፓርታማዎችን እና አዋጭ የሪል እስቴት ኢንቨስትመንቶችን ያግኙ።' },
  'home.about_title': { en: 'Your Trusted Real Estate Partner', am: 'የእርስዎ ታማኝ የሪል እስቴት አጋር' },
  'home.about_p1': { en: 'With over 15 years of trusted experience in Ethiopia, we have connected thousands of families and investors with exceptional properties and secure investments.', am: 'በኢትዮጵያ ከ15 ዓመታት በላይ ባካበትነው አስተማማኝ ልምድ፣ በሺዎች የሚቆጠሩ ቤተሰቦችን እና ባለሀብቶችን ከተመረጡ ንብረቶች እና አስተማማኝ ኢንቨስትመንቶች ጋር አገናኝተናል።' },
  'home.about_p2': { en: 'Our mission is to provide transparent, modern, and reliable property management and house sales services.', am: 'ተልዕኳችን ግልፅ፣ ዘመናዊ እና አስተማማኝ የቤት ሽያጭ፣ ኪራይ እና አስተዳደር አገልግሎት መስጠት ነው።' },
  'home.services_title': { en: 'Our Services', am: 'አገልግሎቶቻችን' },
  'home.services_subtitle': { en: 'Comprehensive real estate services tailored to your unique requirements', am: 'ለእርስዎ ፍላጎት የተበጁ አጠቃላይ የሪል እስቴት አገልግሎቶች' },
  'home.why_choose_us': { en: 'Why Choose Us', am: 'ለምን እኛን ይመርጣሉ?' },
  'home.trusted_experience': { en: 'Trusted Experience', am: 'አስተማማኝ ልምድ' },
  'home.transparent_process': { en: 'Transparent Process', am: 'ግልጽ አሰራር' },
  'home.best_prices': { en: 'Best Market Prices', am: 'ምርጥ የገበያ ዋጋ' },
  'home.legal_support': { en: 'Full Legal Support', am: 'የተሟላ የህግ ድጋፍ' },

  // About Page
  'about.title': { en: 'About RealEstate Pro', am: 'ስለ ሪል እስቴት ፕሮ' },
  'about.subtitle': { en: 'Helping you find the perfect place to call home since 2005. Experience excellence in real estate with our dedicated team of professionals.', am: 'ከ2005 ጀምሮ ትክክለኛውን መኖሪያ ቤት እንዲያገኙ በመርዳት ላይ እንገኛለን። ከባለሙያ ቡድናችን ጋር የላቀ የሪል እስቴት አገልግሎት ያግኙ።' },
  'about.story_title': { en: 'More Than Just Properties', am: 'ከንብረት ሽያጭ በላይ' },
  'about.team_title': { en: 'Meet Our Leadership Team', am: 'የአመራር ቡድናችንን ይወቁ' },
  'about.values_title': { en: 'Our Core Values', am: 'መሰረታዊ እሴቶቻችን' },

  // Contact Page
  'contact.title': { en: 'Contact Us', am: 'ያግኙን' },
  'contact.subtitle': { en: 'Have questions? Get in touch with our expert real estate team today.', am: 'ጥያቄ አለዎት? ዛሬውኑ ከሪል እስቴት ባለሙያዎቻችን ጋር ይገናኙ።' },
  'contact.form_title': { en: 'Send us a Message', am: 'መልእክት ይላኩልን' },
  'contact.name_placeholder': { en: 'Full Name *', am: 'ሙሉ ስም *' },
  'contact.contact_placeholder': { en: 'Email or Phone *', am: 'ኢሜይል ወይም ስልክ ቁጥር *' },
  'contact.subject_placeholder': { en: 'Select Subject *', am: 'ርዕስ ይምረጡ *' },
  'contact.message_placeholder': { en: 'Your Message *', am: 'መልእክትዎትን እዚህ ይጻፉ *' },
  'contact.location_text': { en: 'Addis Ababa, Ethiopia', am: 'አዲስ አበባ፣ ኢትዮጵያ' },
  'contact.phone_text': { en: '+251 906 974 055', am: '+251 906 974 055' },
  'contact.email_text': { en: 'info@realestatepro.com', am: 'info@realestatepro.com' },

  // Auth Pages
  'auth.signin_title': { en: 'Sign In to Your Account', am: 'ወደ መለያዎ ይግቡ' },
  'auth.signin_subtitle': { en: 'Welcome back! Please enter your credentials to continue.', am: 'እንኳን ደህና መጡ! ለመቀጠል መረጃዎን ያስገቡ።' },
  'auth.signup_title': { en: 'Create an Account', am: 'አዲስ መለያ ይክፈቱ' },
  'auth.signup_subtitle': { en: 'Join our platform to buy, sell, or rent properties seamlessly.', am: 'ቤቶችን ለመግዛት፣ ለመሸጥ ወይም ለመከራየት ይቀላቀሉን።' },
  'auth.phone': { en: 'Phone Number', am: 'ስልክ ቁጥር' },
  'auth.password': { en: 'Password', am: 'የይለፍ ቃል' },
  'auth.confirm_password': { en: 'Confirm Password', am: 'የይለፍ ቃል ያረጋግጡ' },
  'auth.full_name': { en: 'Full Name', am: 'ሙሉ ስም' },
  'auth.email': { en: 'Email Address', am: 'የኢሜይል አድራሻ' },
  'auth.forgot_password': { en: 'Forgot password?', am: 'የይለፍ ቃል ረሱ?' },
  'auth.no_account': { en: "Don't have an account?", am: 'መለያ የለዎትም?' },
  'auth.have_account': { en: 'Already have an account?', am: 'ቀደም ሲል መለያ አለዎት?' },
  'auth.login_btn': { en: 'Sign In', am: 'ግባ' },
  'auth.register_btn': { en: 'Sign Up', am: 'ይመዝገቡ' },
  'auth.or_otp': { en: 'Sign in with OTP', am: 'በስልክ ኮድ (OTP) ግባ' },
  'auth.send_otp': { en: 'Send OTP Code', am: 'የማረጋገጫ ኮድ ላክ' },
  'auth.verify_otp': { en: 'Verify OTP', am: 'ኮዱን አረጋግጥ' },

  // Footer
  'footer.about_desc': { en: 'RealEstate Pro is Ethiopia’s premier real estate management and property marketplace platform, ensuring trust and seamless transactions.', am: 'ሪል እስቴት ፕሮ የታመነ፣ ዘመናዊ እና ቀላል የቤት ሽያጭና ኪራይ አገልግሎት የሚሰጥ የኢትዮጵያ መሪ መድረክ ነው።' },
  'footer.quick_links': { en: 'Quick Links', am: 'ፈጣን ማያያዣዎች' },
  'footer.services': { en: 'Services', am: 'አገልግሎቶች' },
  'footer.contact_info': { en: 'Contact Info', am: 'የመገኛ አድራሻ' },
  'footer.rights_reserved': { en: 'All rights reserved.', am: 'መብቱ በህግ የተጠበቀ ነው።' },
  'footer.office_hours': { en: 'Office Hours', am: 'የስራ ሰዓት' },
  'footer.hours_detail': { en: 'Mon - Fri: 8:30 AM - 5:30 PM\nSat: 9:00 AM - 1:00 PM', am: 'ሰኞ - አርብ፡ ከጠዋቱ 2:30 - ከሰዓት 11:30\nቅዳሜ፡ ከጠዋቱ 3:00 - 7:00' },
};

export function getTranslation(key: string, lang: Language, fallback?: string): string {
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  return fallback || (translations[key] ? translations[key]['en'] : key);
}
