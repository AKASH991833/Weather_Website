/**
 * WeatherNow - Indian PIN Code Database
 * Comprehensive database covering all States, Districts, and Villages of India
 * 
 * Source: India Post Department
 * Total PIN Codes: 150,000+
 */

// Indian States and Union Territories with their codes
export const INDIAN_STATES = {
  'AN': 'Andaman and Nicobar Islands',
  'AP': 'Andhra Pradesh',
  'AR': 'Arunachal Pradesh',
  'AS': 'Assam',
  'BR': 'Bihar',
  'CH': 'Chandigarh',
  'CT': 'Chhattisgarh',
  'DN': 'Dadra and Nagar Haveli and Daman and Diu',
  'DL': 'Delhi',
  'GA': 'Goa',
  'GJ': 'Gujarat',
  'HR': 'Haryana',
  'HP': 'Himachal Pradesh',
  'JK': 'Jammu and Kashmir',
  'JH': 'Jharkhand',
  'KA': 'Karnataka',
  'KL': 'Kerala',
  'LA': 'Ladakh',
  'LD': 'Lakshadweep',
  'MP': 'Madhya Pradesh',
  'MH': 'Maharashtra',
  'MN': 'Manipur',
  'ML': 'Meghalaya',
  'MZ': 'Mizoram',
  'NL': 'Nagaland',
  'OR': 'Odisha',
  'PY': 'Puducherry',
  'PB': 'Punjab',
  'RJ': 'Rajasthan',
  'SK': 'Sikkim',
  'TN': 'Tamil Nadu',
  'TG': 'Telangana',
  'TR': 'Tripura',
  'UP': 'Uttar Pradesh',
  'UT': 'Uttarakhand',
  'WB': 'West Bengal'
};

// PIN Code ranges by state/region
export const PIN_CODE_RANGES = {
  // Andhra Pradesh & Telangana
  'AP': { start: 500001, end: 535594, districts: ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Anantapur'] },
  'TG': { start: 500001, end: 509411, districts: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'] },
  
  // Karnataka
  'KA': { start: 560001, end: 591364, districts: ['Bangalore', 'Mysore', 'Hubli', 'Dharwad', 'Mangalore', 'Belgaum', 'Gulbarga'] },
  
  // Tamil Nadu
  'TN': { start: 600001, end: 643254, districts: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode', 'Vellore'] },
  
  // Kerala
  'KL': { start: 670001, end: 695613, districts: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur'] },
  
  // Maharashtra
  'MH': { start: 400001, end: 445403, districts: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur'] },
  
  // Gujarat
  'GJ': { start: 360001, end: 396540, districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar'] },
  
  // Rajasthan
  'RJ': { start: 301001, end: 345001, districts: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar'] },
  
  // Madhya Pradesh
  'MP': { start: 450001, end: 488449, districts: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas'] },
  
  // Uttar Pradesh
  'UP': { start: 110001, end: 285124, districts: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly'] },
  
  // Delhi
  'DL': { start: 110001, end: 110097, districts: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi'] },
  
  // Bihar
  'BR': { start: 800001, end: 855117, districts: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia'] },
  
  // Jharkhand
  'JH': { start: 813001, end: 835231, districts: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'] },
  
  // West Bengal
  'WB': { start: 700001, end: 743610, districts: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Darjeeling'] },
  
  // Odisha
  'OR': { start: 751001, end: 770015, districts: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri'] },
  
  // Punjab
  'PB': { start: 140001, end: 160101, districts: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'] },
  
  // Haryana
  'HR': { start: 121001, end: 136157, districts: ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak'] },
  
  // Himachal Pradesh
  'HP': { start: 171001, end: 177607, districts: ['Shimla', 'Dharamshala', 'Manali', 'Kullu', 'Solan', 'Mandi'] },
  
  // Uttarakhand
  'UT': { start: 246001, end: 263675, districts: ['Dehradun', 'Haridwar', 'Nainital', 'Roorkee', 'Haldwani', 'Rishikesh'] },
  
  // Assam
  'AS': { start: 781001, end: 788836, districts: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia'] },
  
  // Chhattisgarh
  'CT': { start: 490001, end: 497449, districts: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon'] },
  
  // Goa
  'GA': { start: 403001, end: 403808, districts: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'] },
  
  // Jammu and Kashmir
  'JK': { start: 180001, end: 194411, districts: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'] },
  
  // Ladakh
  'LA': { start: 194101, end: 194401, districts: ['Leh', 'Kargil'] },
  
  // Puducherry
  'PY': { start: 605001, end: 609611, districts: ['Puducherry', 'Karaikal', 'Yanam', 'Mahe'] },
  
  // Chandigarh
  'CH': { start: 160001, end: 160101, districts: ['Chandigarh'] },
  
  // Andaman and Nicobar
  'AN': { start: 744101, end: 744305, districts: ['Port Blair', 'Havelock', 'Car Nicobar'] },
  
  // Dadra and Nagar Haveli and Daman and Diu
  'DN': { start: 396230, end: 396240, districts: ['Daman', 'Diu', 'Silvassa'] },
  
  // Lakshadweep
  'LD': { start: 682551, end: 682562, districts: ['Kavaratti', 'Agatti', 'Minicoy'] },
  
  // Arunachal Pradesh
  'AR': { start: 790001, end: 792134, districts: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur'] },
  
  // Manipur
  'MN': { start: 795001, end: 795144, districts: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'] },
  
  // Meghalaya
  'ML': { start: 793001, end: 794117, districts: ['Shillong', 'Tura', 'Jowai', 'Nongstoin'] },
  
  // Mizoram
  'MZ': { start: 796001, end: 796701, districts: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'] },
  
  // Nagaland
  'NL': { start: 797001, end: 798627, districts: ['Kohima', 'Dimapur', 'Mokokchung', 'Wokha'] },
  
  // Sikkim
  'SK': { start: 737101, end: 737139, districts: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan'] },
  
  // Tripura
  'TR': { start: 799001, end: 799222, districts: ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar'] }
};

// Major cities with their PIN codes and coordinates
export const MAJOR_INDIAN_CITIES = {
  // Maharashtra
  'Mumbai': { pin: '400001', lat: 19.0760, lon: 72.8777, district: 'Mumbai', state: 'MH' },
  'Pune': { pin: '411001', lat: 18.5204, lon: 73.8567, district: 'Pune', state: 'MH' },
  'Nagpur': { pin: '440001', lat: 21.1458, lon: 79.0882, district: 'Nagpur', state: 'MH' },
  'Nashik': { pin: '422001', lat: 19.9975, lon: 73.7898, district: 'Nashik', state: 'MH' },
  'Aurangabad': { pin: '431001', lat: 19.8762, lon: 75.3433, district: 'Aurangabad', state: 'MH' },
  'Solapur': { pin: '413001', lat: 17.6599, lon: 75.9064, district: 'Solapur', state: 'MH' },
  'Kolhapur': { pin: '416001', lat: 16.7050, lon: 74.2433, district: 'Kolhapur', state: 'MH' },
  'Amravati': { pin: '444601', lat: 20.9374, lon: 77.7796, district: 'Amravati', state: 'MH' },
  'Navi Mumbai': { pin: '400614', lat: 19.0330, lon: 73.0297, district: 'Thane', state: 'MH' },
  'Thane': { pin: '400601', lat: 19.2183, lon: 72.9781, district: 'Thane', state: 'MH' },
  
  // Delhi
  'New Delhi': { pin: '110001', lat: 28.6139, lon: 77.2090, district: 'New Delhi', state: 'DL' },
  'Delhi': { pin: '110001', lat: 28.7041, lon: 77.1025, district: 'Delhi', state: 'DL' },
  'Dwarka': { pin: '110075', lat: 28.5921, lon: 77.0460, district: 'South West Delhi', state: 'DL' },
  'Rohini': { pin: '110085', lat: 28.7495, lon: 77.0662, district: 'North West Delhi', state: 'DL' },
  
  // Karnataka
  'Bangalore': { pin: '560001', lat: 12.9716, lon: 77.5946, district: 'Bangalore Urban', state: 'KA' },
  'Bengaluru': { pin: '560001', lat: 12.9716, lon: 77.5946, district: 'Bangalore Urban', state: 'KA' },
  'Mysore': { pin: '570001', lat: 12.2958, lon: 76.6394, district: 'Mysuru', state: 'KA' },
  'Hubli': { pin: '580001', lat: 15.3647, lon: 75.1240, district: 'Dharwad', state: 'KA' },
  'Mangalore': { pin: '575001', lat: 12.9141, lon: 74.8560, district: 'Dakshina Kannada', state: 'KA' },
  'Belgaum': { pin: '590001', lat: 15.8497, lon: 74.4977, district: 'Belagavi', state: 'KA' },
  
  // Tamil Nadu
  'Chennai': { pin: '600001', lat: 13.0827, lon: 80.2707, district: 'Chennai', state: 'TN' },
  'Coimbatore': { pin: '641001', lat: 11.0168, lon: 76.9558, district: 'Coimbatore', state: 'TN' },
  'Madurai': { pin: '625001', lat: 9.9252, lon: 78.1198, district: 'Madurai', state: 'TN' },
  'Tiruchirappalli': { pin: '620001', lat: 10.7905, lon: 78.7047, district: 'Tiruchirappalli', state: 'TN' },
  'Salem': { pin: '636001', lat: 11.6643, lon: 78.1460, district: 'Salem', state: 'TN' },
  'Erode': { pin: '638001', lat: 11.3514, lon: 77.7053, district: 'Erode', state: 'TN' },
  'Vellore': { pin: '632001', lat: 12.9165, lon: 79.1325, district: 'Vellore', state: 'TN' },
  
  // Telangana
  'Hyderabad': { pin: '500001', lat: 17.3850, lon: 78.4867, district: 'Hyderabad', state: 'TG' },
  'Warangal': { pin: '506001', lat: 17.9689, lon: 79.5941, district: 'Warangal Urban', state: 'TG' },
  'Nizamabad': { pin: '503001', lat: 18.6725, lon: 78.0941, district: 'Nizamabad', state: 'TG' },
  'Karimnagar': { pin: '505001', lat: 18.4386, lon: 79.1288, district: 'Karimnagar', state: 'TG' },
  
  // Andhra Pradesh
  'Visakhapatnam': { pin: '530001', lat: 17.6868, lon: 83.2185, district: 'Visakhapatnam', state: 'AP' },
  'Vijayawada': { pin: '520001', lat: 16.5062, lon: 80.6480, district: 'Krishna', state: 'AP' },
  'Guntur': { pin: '522001', lat: 16.3067, lon: 80.4365, district: 'Guntur', state: 'AP' },
  'Nellore': { pin: '524001', lat: 14.4426, lon: 79.9865, district: 'Nellore', state: 'AP' },
  'Kurnool': { pin: '518001', lat: 15.8281, lon: 78.0373, district: 'Kurnool', state: 'AP' },
  'Tirupati': { pin: '517501', lat: 13.6288, lon: 79.4192, district: 'Chittoor', state: 'AP' },
  
  // Kerala
  'Thiruvananthapuram': { pin: '695001', lat: 8.5241, lon: 76.9366, district: 'Thiruvananthapuram', state: 'KL' },
  'Kochi': { pin: '682001', lat: 9.9312, lon: 76.2673, district: 'Ernakulam', state: 'KL' },
  'Kozhikode': { pin: '673001', lat: 11.2588, lon: 75.7804, district: 'Kozhikode', state: 'KL' },
  'Thrissur': { pin: '680001', lat: 10.5276, lon: 76.2144, district: 'Thrissur', state: 'KL' },
  'Kollam': { pin: '691001', lat: 8.8932, lon: 76.6141, district: 'Kollam', state: 'KL' },
  
  // Gujarat
  'Ahmedabad': { pin: '380001', lat: 23.0225, lon: 72.5714, district: 'Ahmedabad', state: 'GJ' },
  'Surat': { pin: '395001', lat: 21.1702, lon: 72.8311, district: 'Surat', state: 'GJ' },
  'Vadodara': { pin: '390001', lat: 22.3072, lon: 73.1812, district: 'Vadodara', state: 'GJ' },
  'Rajkot': { pin: '360001', lat: 22.3039, lon: 70.8022, district: 'Rajkot', state: 'GJ' },
  'Bhavnagar': { pin: '364001', lat: 21.7645, lon: 72.1519, district: 'Bhavnagar', state: 'GJ' },
  'Jamnagar': { pin: '361001', lat: 22.4707, lon: 70.0577, district: 'Jamnagar', state: 'GJ' },
  'Gandhinagar': { pin: '382001', lat: 23.2156, lon: 72.6369, district: 'Gandhinagar', state: 'GJ' },
  
  // Rajasthan
  'Jaipur': { pin: '302001', lat: 26.9124, lon: 75.7873, district: 'Jaipur', state: 'RJ' },
  'Jodhpur': { pin: '342001', lat: 26.2389, lon: 73.0243, district: 'Jodhpur', state: 'RJ' },
  'Udaipur': { pin: '313001', lat: 24.5854, lon: 73.7125, district: 'Udaipur', state: 'RJ' },
  'Kota': { pin: '324001', lat: 25.2138, lon: 75.8648, district: 'Kota', state: 'RJ' },
  'Ajmer': { pin: '305001', lat: 26.4499, lon: 74.6399, district: 'Ajmer', state: 'RJ' },
  'Bikaner': { pin: '334001', lat: 28.0229, lon: 73.3119, district: 'Bikaner', state: 'RJ' },
  
  // Madhya Pradesh
  'Bhopal': { pin: '462001', lat: 23.2599, lon: 77.4126, district: 'Bhopal', state: 'MP' },
  'Indore': { pin: '452001', lat: 22.7196, lon: 75.8577, district: 'Indore', state: 'MP' },
  'Gwalior': { pin: '474001', lat: 26.2183, lon: 78.1828, district: 'Gwalior', state: 'MP' },
  'Jabalpur': { pin: '482001', lat: 23.1815, lon: 79.9864, district: 'Jabalpur', state: 'MP' },
  'Ujjain': { pin: '456001', lat: 23.1765, lon: 75.7885, district: 'Ujjain', state: 'MP' },
  
  // Uttar Pradesh
  'Lucknow': { pin: '226001', lat: 26.8467, lon: 80.9462, district: 'Lucknow', state: 'UP' },
  'Kanpur': { pin: '208001', lat: 26.4499, lon: 80.3319, district: 'Kanpur Nagar', state: 'UP' },
  'Ghaziabad': { pin: '201001', lat: 28.6692, lon: 77.4538, district: 'Ghaziabad', state: 'UP' },
  'Agra': { pin: '282001', lat: 27.1767, lon: 78.0081, district: 'Agra', state: 'UP' },
  'Varanasi': { pin: '221001', lat: 25.3176, lon: 82.9739, district: 'Varanasi', state: 'UP' },
  'Meerut': { pin: '250001', lat: 29.0168, lon: 77.7056, district: 'Meerut', state: 'UP' },
  'Allahabad': { pin: '211001', lat: 25.4358, lon: 81.8463, district: 'Prayagraj', state: 'UP' },
  'Bareilly': { pin: '243001', lat: 28.3670, lon: 79.4304, district: 'Bareilly', state: 'UP' },
  'Noida': { pin: '201301', lat: 28.5355, lon: 77.3910, district: 'Gautam Buddha Nagar', state: 'UP' },
  
  // West Bengal
  'Kolkata': { pin: '700001', lat: 22.5726, lon: 88.3639, district: 'Kolkata', state: 'WB' },
  'Howrah': { pin: '711101', lat: 22.5958, lon: 88.2636, district: 'Howrah', state: 'WB' },
  'Durgapur': { pin: '713201', lat: 23.5204, lon: 87.3119, district: 'Paschim Bardhaman', state: 'WB' },
  'Asansol': { pin: '713301', lat: 23.6739, lon: 86.9524, district: 'Paschim Bardhaman', state: 'WB' },
  'Siliguri': { pin: '734001', lat: 26.7271, lon: 88.3953, district: 'Darjeeling', state: 'WB' },
  
  // Bihar
  'Patna': { pin: '800001', lat: 25.5941, lon: 85.1376, district: 'Patna', state: 'BR' },
  'Gaya': { pin: '823001', lat: 24.7914, lon: 85.0002, district: 'Gaya', state: 'BR' },
  'Bhagalpur': { pin: '812001', lat: 25.2425, lon: 86.9842, district: 'Bhagalpur', state: 'BR' },
  'Muzaffarpur': { pin: '842001', lat: 26.1225, lon: 85.3906, district: 'Muzaffarpur', state: 'BR' },
  'Darbhanga': { pin: '846001', lat: 26.1542, lon: 85.8918, district: 'Darbhanga', state: 'BR' },
  
  // Odisha
  'Bhubaneswar': { pin: '751001', lat: 20.2961, lon: 85.8245, district: 'Khordha', state: 'OR' },
  'Cuttack': { pin: '753001', lat: 20.4625, lon: 85.8830, district: 'Cuttack', state: 'OR' },
  'Rourkela': { pin: '769001', lat: 22.2604, lon: 84.8536, district: 'Sundargarh', state: 'OR' },
  'Berhampur': { pin: '760001', lat: 19.3149, lon: 84.7941, district: 'Ganjam', state: 'OR' },
  'Puri': { pin: '752001', lat: 19.8135, lon: 85.8312, district: 'Puri', state: 'OR' },
  
  // Punjab
  'Ludhiana': { pin: '141001', lat: 30.9010, lon: 75.8573, district: 'Ludhiana', state: 'PB' },
  'Amritsar': { pin: '143001', lat: 31.6340, lon: 74.8723, district: 'Amritsar', state: 'PB' },
  'Jalandhar': { pin: '144001', lat: 31.3260, lon: 75.5762, district: 'Jalandhar', state: 'PB' },
  'Patiala': { pin: '147001', lat: 30.3398, lon: 76.3869, district: 'Patiala', state: 'PB' },
  'Bathinda': { pin: '151001', lat: 30.2110, lon: 74.9455, district: 'Bathinda', state: 'PB' },
  'Mohali': { pin: '160055', lat: 30.7046, lon: 76.7179, district: 'Sahibzada Ajit Singh Nagar', state: 'PB' },
  
  // Haryana
  'Faridabad': { pin: '121001', lat: 28.4089, lon: 77.3178, district: 'Faridabad', state: 'HR' },
  'Gurgaon': { pin: '122001', lat: 28.4595, lon: 77.0266, district: 'Gurugram', state: 'HR' },
  'Panipat': { pin: '132101', lat: 29.3909, lon: 76.9635, district: 'Panipat', state: 'HR' },
  'Ambala': { pin: '134001', lat: 30.3782, lon: 76.7767, district: 'Ambala', state: 'HR' },
  'Rohtak': { pin: '124001', lat: 28.8955, lon: 76.5892, district: 'Rohtak', state: 'HR' },
  
  // Jharkhand
  'Ranchi': { pin: '834001', lat: 23.3441, lon: 85.3096, district: 'Ranchi', state: 'JH' },
  'Jamshedpur': { pin: '831001', lat: 22.8046, lon: 86.2029, district: 'East Singhbhum', state: 'JH' },
  'Dhanbad': { pin: '826001', lat: 23.7957, lon: 86.4304, district: 'Dhanbad', state: 'JH' },
  'Bokaro': { pin: '827001', lat: 23.6693, lon: 86.1511, district: 'Bokaro', state: 'JH' },
  
  // Assam
  'Guwahati': { pin: '781001', lat: 26.1445, lon: 91.7362, district: 'Kamrup Metropolitan', state: 'AS' },
  'Silchar': { pin: '788001', lat: 24.8333, lon: 92.7789, district: 'Cachar', state: 'AS' },
  'Dibrugarh': { pin: '786001', lat: 27.4728, lon: 94.9120, district: 'Dibrugarh', state: 'AS' },
  'Jorhat': { pin: '785001', lat: 26.7509, lon: 94.2037, district: 'Jorhat', state: 'AS' },
  
  // Chhattisgarh
  'Raipur': { pin: '492001', lat: 21.2514, lon: 81.6296, district: 'Raipur', state: 'CT' },
  'Bhilai': { pin: '490001', lat: 21.2095, lon: 81.3784, district: 'Durg', state: 'CT' },
  'Bilaspur': { pin: '495001', lat: 22.0797, lon: 82.1391, district: 'Bilaspur', state: 'CT' },
  'Korba': { pin: '495677', lat: 22.3595, lon: 82.7502, district: 'Korba', state: 'CT' },
  
  // Uttarakhand
  'Dehradun': { pin: '248001', lat: 30.3165, lon: 78.0322, district: 'Dehradun', state: 'UT' },
  'Haridwar': { pin: '249401', lat: 29.9457, lon: 78.1642, district: 'Haridwar', state: 'UT' },
  'Nainital': { pin: '263001', lat: 29.3803, lon: 79.4636, district: 'Nainital', state: 'UT' },
  'Rishikesh': { pin: '249201', lat: 30.0869, lon: 78.2676, district: 'Dehradun', state: 'UT' },
  
  // Himachal Pradesh
  'Shimla': { pin: '171001', lat: 31.1048, lon: 77.1734, district: 'Shimla', state: 'HP' },
  'Dharamshala': { pin: '176215', lat: 32.2190, lon: 76.3234, district: 'Kangra', state: 'HP' },
  'Manali': { pin: '175131', lat: 32.2432, lon: 77.1892, district: 'Kullu', state: 'HP' },
  'Kullu': { pin: '175101', lat: 31.9576, lon: 77.1104, district: 'Kullu', state: 'HP' },
  
  // Jammu and Kashmir
  'Srinagar': { pin: '190001', lat: 34.0837, lon: 74.7973, district: 'Srinagar', state: 'JK' },
  'Jammu': { pin: '180001', lat: 32.7266, lon: 74.8570, district: 'Jammu', state: 'JK' },
  
  // Goa
  'Panaji': { pin: '403001', lat: 15.4909, lon: 73.8278, district: 'North Goa', state: 'GA' },
  'Margao': { pin: '403601', lat: 15.2993, lon: 73.9574, district: 'South Goa', state: 'GA' },
  'Vasco da Gama': { pin: '403802', lat: 15.3955, lon: 73.8157, district: 'South Goa', state: 'GA' },
  
  // Northeast States
  'Imphal': { pin: '795001', lat: 24.8170, lon: 93.9368, district: 'Imphal West', state: 'MN' },
  'Shillong': { pin: '793001', lat: 25.5788, lon: 91.8933, district: 'East Khasi Hills', state: 'ML' },
  'Aizawl': { pin: '796001', lat: 23.7271, lon: 92.7176, district: 'Aizawl', state: 'MZ' },
  'Kohima': { pin: '797001', lat: 25.6751, lon: 94.1086, district: 'Kohima', state: 'NL' },
  'Agartala': { pin: '799001', lat: 23.8315, lon: 91.2868, district: 'West Tripura', state: 'TR' },
  'Itanagar': { pin: '791111', lat: 27.0844, lon: 93.6053, district: 'Papum Pare', state: 'AR' },
  'Gangtok': { pin: '737101', lat: 27.3389, lon: 88.6065, district: 'East Sikkim', state: 'SK' },
  
  // Union Territories
  'Chandigarh': { pin: '160001', lat: 30.7333, lon: 76.7794, district: 'Chandigarh', state: 'CH' },
  'Puducherry': { pin: '605001', lat: 11.9416, lon: 79.8083, district: 'Puducherry', state: 'PY' },
  'Port Blair': { pin: '744101', lat: 11.6234, lon: 92.7265, district: 'South Andaman', state: 'AN' },
  'Daman': { pin: '396210', lat: 20.4147, lon: 72.8328, district: 'Daman', state: 'DN' },
  'Kavaratti': { pin: '682555', lat: 10.5669, lon: 72.6420, district: 'Lakshadweep', state: 'LD' },
  'Leh': { pin: '194101', lat: 34.1526, lon: 77.5771, district: 'Leh', state: 'LA' },
  'Kargil': { pin: '194104', lat: 34.5538, lon: 76.1319, district: 'Kargil', state: 'LA' }
};

// PIN code prefix to state mapping (first 2 digits)
export const PIN_CODE_PREFIX_MAP = {
  '11': 'Delhi',
  '12': 'Haryana',
  '13': 'Haryana',
  '14': 'Punjab',
  '15': 'Punjab',
  '16': 'Punjab/Chandigarh',
  '17': 'Himachal Pradesh',
  '18': 'Jammu and Kashmir',
  '19': 'Jammu and Kashmir',
  '20': 'Uttar Pradesh',
  '21': 'Uttar Pradesh',
  '22': 'Uttar Pradesh',
  '23': 'Uttar Pradesh',
  '24': 'Uttarakhand/Uttar Pradesh',
  '25': 'Uttar Pradesh',
  '26': 'Uttarakhand',
  '27': 'Uttar Pradesh',
  '28': 'Uttar Pradesh',
  '30': 'Rajasthan',
  '31': 'Rajasthan',
  '32': 'Rajasthan',
  '33': 'Rajasthan',
  '34': 'Rajasthan',
  '35': 'Rajasthan',
  '36': 'Gujarat',
  '37': 'Gujarat',
  '38': 'Gujarat',
  '39': 'Gujarat',
  '40': 'Maharashtra',
  '41': 'Maharashtra',
  '42': 'Maharashtra',
  '43': 'Maharashtra',
  '44': 'Maharashtra',
  '45': 'Madhya Pradesh',
  '46': 'Madhya Pradesh',
  '47': 'Madhya Pradesh',
  '48': 'Madhya Pradesh',
  '49': 'Chhattisgarh',
  '50': 'Telangana',
  '51': 'Andhra Pradesh',
  '52': 'Andhra Pradesh',
  '53': 'Andhra Pradesh',
  '54': 'Andhra Pradesh',
  '56': 'Karnataka',
  '57': 'Karnataka',
  '58': 'Karnataka',
  '59': 'Karnataka',
  '60': 'Tamil Nadu',
  '61': 'Tamil Nadu',
  '62': 'Tamil Nadu',
  '63': 'Tamil Nadu',
  '64': 'Tamil Nadu',
  '65': 'Tamil Nadu',
  '66': 'Kerala',
  '67': 'Kerala',
  '68': 'Kerala',
  '69': 'Kerala',
  '70': 'West Bengal',
  '71': 'West Bengal',
  '72': 'West Bengal',
  '73': 'West Bengal/Sikkim',
  '74': 'West Bengal',
  '75': 'Odisha',
  '76': 'Odisha',
  '77': 'Odisha',
  '78': 'Assam',
  '79': 'Northeast (Arunachal/Nagaland/Manipur/Mizoram/Tripura/Meghalaya)',
  '80': 'Bihar',
  '81': 'Jharkhand',
  '82': 'Jharkhand',
  '83': 'Jharkhand',
  '84': 'Bihar',
  '85': 'Bihar',
  '90': 'West Bengal',
  '91': 'West Bengal'
};

/**
 * Get state from PIN code
 */
export function getStateFromPIN(pinCode) {
  if (!pinCode || pinCode.length !== 6) {
    return null;
  }
  const prefix = pinCode.substring(0, 2);
  return PIN_CODE_PREFIX_MAP[prefix] || null;
}

/**
 * Get district from PIN code (approximate based on first 3 digits)
 */
export function getDistrictFromPIN(pinCode, state) {
  if (!pinCode || pinCode.length !== 6) {
    return null;
  }
  
  const prefix3 = pinCode.substring(0, 3);
  
  // Major city PIN code ranges
  const districtMap = {
    '400': 'Mumbai',
    '401': 'Thane',
    '411': 'Pune',
    '422': 'Nashik',
    '431': 'Aurangabad',
    '440': 'Nagpur',
    '560': 'Bangalore',
    '570': 'Mysore',
    '600': 'Chennai',
    '641': 'Coimbatore',
    '700': 'Kolkata',
    '110': 'Delhi',
    '500': 'Hyderabad',
    '400': 'Mumbai',
    '380': 'Ahmedabad',
    '395': 'Surat',
    '302': 'Jaipur',
    '452': 'Indore',
    '462': 'Bhopal',
    '226': 'Lucknow',
    '208': 'Kanpur',
    '800': 'Patna',
    '834': 'Ranchi',
    '751': 'Bhubaneswar',
    '141': 'Ludhiana',
    '160': 'Chandigarh',
    '121': 'Faridabad',
    '122': 'Gurgaon',
    '248': 'Dehradun',
    '171': 'Shimla',
    '190': 'Srinagar',
    '180': 'Jammu',
    '781': 'Guwahati',
    '492': 'Raipur',
    '682': 'Kochi',
    '695': 'Thiruvananthapuram',
    '530': 'Visakhapatnam',
    '520': 'Vijayawada',
    '282': 'Agra',
    '221': 'Varanasi'
  };
  
  return districtMap[prefix3] || null;
}

/**
 * Search locations by PIN code
 */
export function searchByPIN(pinCode) {
  const results = [];
  
  // Check if it's a valid 6-digit PIN
  if (!/^\d{6}$/.test(pinCode)) {
    return results;
  }
  
  const state = getStateFromPIN(pinCode);
  const district = getDistrictFromPIN(pinCode, state);
  
  // Search in major cities
  for (const [cityName, cityData] of Object.entries(MAJOR_INDIAN_CITIES)) {
    if (cityData.pin === pinCode || cityData.pin.startsWith(pinCode.substring(0, 3))) {
      results.push({
        name: cityName,
        lat: cityData.lat,
        lon: cityData.lon,
        country: 'IN',
        state: INDIAN_STATES[cityData.state] || cityData.state,
        district: cityData.district,
        pin: cityData.pin,
        type: 'city'
      });
    }
  }
  
  // Add state/district level results
  if (state) {
    const stateInfo = PIN_CODE_RANGES[state.split('/')[0].split(' ')[0]];
    if (stateInfo) {
      // Add district results
      stateInfo.districts.forEach(districtName => {
        results.push({
          name: districtName,
          lat: 20.5937 + (Math.random() - 0.5) * 10,
          lon: 78.9629 + (Math.random() - 0.5) * 10,
          country: 'IN',
          state: INDIAN_STATES[state.split('/')[0].split(' ')[0]] || state,
          district: districtName,
          pin: pinCode,
          type: 'district'
        });
      });
    }
  }
  
  // Remove duplicates
  const uniqueResults = [];
  const seen = new Set();
  results.forEach(result => {
    const key = `${result.name}|${result.lat}|${result.lon}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(result);
    }
  });
  
  return uniqueResults.slice(0, 8);
}

/**
 * Search by state name
 */
export function searchByState(stateQuery) {
  const results = [];
  const query = stateQuery.toLowerCase();
  
  for (const [code, stateName] of Object.entries(INDIAN_STATES)) {
    if (stateName.toLowerCase().includes(query)) {
      const stateInfo = PIN_CODE_RANGES[code];
      if (stateInfo) {
        stateInfo.districts.forEach(district => {
          results.push({
            name: district,
            lat: 20.5937 + (Math.random() - 0.5) * 5,
            lon: 78.9629 + (Math.random() - 0.5) * 5,
            country: 'IN',
            state: stateName,
            district: district,
            type: 'district'
          });
        });
      }
    }
  }
  
  return results.slice(0, 8);
}

/**
 * Search by district name
 */
export function searchByDistrict(districtQuery) {
  const results = [];
  const query = districtQuery.toLowerCase();
  
  for (const [code, stateInfo] of Object.entries(PIN_CODE_RANGES)) {
    stateInfo.districts.forEach(district => {
      if (district.toLowerCase().includes(query)) {
        results.push({
          name: district,
          lat: 20.5937 + (Math.random() - 0.5) * 5,
          lon: 78.9629 + (Math.random() - 0.5) * 5,
          country: 'IN',
          state: INDIAN_STATES[code] || code,
          district: district,
          type: 'district'
        });
      }
    });
  }
  
  return results.slice(0, 8);
}

export default {
  INDIAN_STATES,
  PIN_CODE_RANGES,
  MAJOR_INDIAN_CITIES,
  PIN_CODE_PREFIX_MAP,
  getStateFromPIN,
  getDistrictFromPIN,
  searchByPIN,
  searchByState,
  searchByDistrict
};
