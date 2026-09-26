export const COLLEGES = [
  "AVK COLLEGE HASSAN",
  "TERESIAN COLLEGE MYSORE",
  "CENTRAL COMMERCE COLLEGE HASSAN",
  "MALNAD COLLEGE OF ENGINEERING HASSAN",
  "Government College for Women (Autonomous), Mandya",
  "P.E.S. College of Science, Arts & Commerce, Mandya",
  "GOVT COLLEGE CHANNARAYAPATNA",
  "GOVT FIRST GRADE WOMENS COLLEGE YADGIRI",
  "MARI MALLAPPA WOMENS COLLEGE MYSORE",
  "Maharani science college , Mysore",
  "JSS college of women's, Mysore",
  "JSS College For Women, Chamarajanagara",
  "Maharani commerce and management college , Mysore",
  "GFGC Womens college, Mysore",
  "GFGC Byrapur , Mysore",
  "BES Degree College Of Arts Commerce & Science- Bangalore",
  "KTSV degree college for women vijayanagar-Bangalore",
  "Oxford PU and Degree College-Bangalore",
  "Oxford college Banglore",
  "Kempegowda Institute of Management Studies & Research-Bangalore",
  "Government First Grade College for Women's, Gandhadakoti, Hassan",
  "SIDHARTHA COLLEGE BIDAR",
  "KSAWU VIJAYAPURA",
  "Dadapheer Huballi",
  "Hubballi Center",
  "SJAM College Ramnagar",
  "Dr.G Shankar Govt Women's First Grade College & PG Study Centre, Ajjarkadu",
  "Government First Grade College & Centre for Post Graduate Studies, Thenkanidiyur",
  "JPM College Channapatna",
  "VSMS SOMASHEKHAR R KOTHIWALE INSTITUTE OF TECHNOLOGY, NIPANI",
  "Angadi Institute of Technology Belagavi",
  "Shivkumar",
  "Pandavpura Govt College",
  "Vijaya First Grade Co-Education College B.Ed",
  "K R Pete Govt College Co-Education",
  "Girls College K R Pete",
  "Channarayapatna Govt College",
  "BGS College Channarayapatna",
  "KLE BCA College Athani",
  "Government Womens college - Ramanagara",
  "Government Girls PU college Channapatna - Ramnagara",
  "Government Polytechnic for Women Ramanagar",
  "Government Science College (Autonomous) - Hassan",
  "Shanikethan College - Ramnagara",
  "Government first grade College Ramnagar",
  "New expert college , Ramanagar",
  "GT Ramanagara",
  "VISHWA GANGA COMPUTER TRAINING CENTRE YADGIR",
  "Lingeri Konappa education trust Women's Art science and commerce degree college yadgir",
  "Basaveshwar science college, Bagalkote",
  "SADGURU SIDDHAROODH WOMENS DEGREE COLLEGE, GUMPA BIDAR",
  "GOVT. FIRST GRADE COLLEGE FOR WOMEN, NAUBAD BIDAR",
  "Shanti Vardhak Education Society Akkaamahadevi Mahila Mahavidya Bidar, Udgir Road BIDAR",
  "Vizutech Solutions Pvt Ltd.",
  "VIJAYA VITTALA INSTITUTE OF TECHNOLOGY",
  "Sree adithya degree college hosakote, Bangalore rural district",
] as const;

export const COLLEGE_ALIASES: Record<string, readonly string[]> = {
  "KSAWU - Karnataka State Akkamahadevi Women University, Jnana Shakti Campus, Vijayapura": [
    "KSAWU VIJAYAPURA",
    "Karnataka State Akkamahadevi Women University, Jnana Shakti Campus, Vijayapura",
    "KSAWU",
    "KSAW VIJAYAPURA",
    "KSAW Registry",
    "KSAW REGISTRY",
    "Akkamahadevi Women's University Vijayapura",
    "Karnataka State Akkamahadevi Women's University",
    "KSAWU Vijayapura",
    "Karnataka State Akkamahadevi Women's University, Vijayapura",
    "Karnataka State Akkamahadevi Women's University Vijayapura",
    "Akkamahadevi Womens University Vijayapura",
    "Akkamahadevi Women's University",
  ],
  "KSAWU - B.V.V. Sangha's Danammadevi Arts, Commerce and Science College for Women, Mudhol": [
    "B.V.V Sangha's Danammadevi Arts, Commerce and Science College for Women, Mudhol.",
    "B.V.V. Sangha's Danammadevi Arts, Commerce and Science College for Women, Mudhol",
    "B.V.V Sangha's Danammadevi Arts, Commerce and Science College for Women, Mudhol",
    "KSAWU - B.V.V. Sangha's Danammadevi Arts, Commerce and Science College for Women, Mudhol",
  ],
  "KSAWU - Sri Siddrameshwar Education Society's Chandragiri College of Education for Women, Shivabasava Nagar, Belgaum": [
    "KASWU-Sri. Siddrameshwar Education Society's chandrageri College of Education for Women Shivabasava nagar, Belguam-591 102,",
    "Sri. Siddrameshwar Education Society's chandrageri College of Education for Women Shivabasava nagar, Belguam-591 102,",
    "Sri Siddrameshwar Education Society's Chandragiri College of Education for Women, Shivabasava Nagar, Belgaum",
    "Sri Siddrameshwar Education Society's Chandragiri College of Education for Women Shivabasava Nagar Belgaum",
    "KSAWU - Sri Siddrameshwar Education Society's Chandragiri College of Education for Women, Shivabasava Nagar, Belgaum",
    "Siddrameshwar college",
    "Siddrameshwar College",
  ],
  "KSAWU - Akkamahadevi Arts & Commerce College for Women, Basavakalyan": [
    "Akkamahadevi Arts & Commerce College for Women, Basavakalyan",
    "Akkamahadevi Arts & Commerce College for Women Basavakalyan",
    "KSAWU - Akkamahadevi Arts & Commerce College for Women, Basavakalyan",
  ],
  "KSAWU - Akkamahadevi Mahila Mahavidyalay, Bidar": [
    "Akkamahadevi Mahila Mahavidyalay, Bidar-",
    "Akkamahadevi Mahila Mahavidyalay, Bidar",
    "Akkamahadevi Mahila Mahavidyalay Bidar",
    "KSAWU - Akkamahadevi Mahila Mahavidyalay, Bidar",
  ],
  "KSAWU - Sri Shivalingeshwar Degree College for Women, Haveri": [
    "Sri. Shivalingeshwar Degree College for Women, Haveri-",
    "Sri Shivalingeshwar Degree College for Women, Haveri",
    "Sri Shivalingeshwar Degree College for Women Haveri",
    "KSAWU - Sri Shivalingeshwar Degree College for Women, Haveri",
  ],
  "KSAWU - B.A.J.S.S. Arts & Commerce College for Women, Ranebennur": [
    "B.A.J.S.S. Arts & Commerce College for Women Ranebennur",
    "B.A.J.S.S. Arts & Commerce College for Women, Ranebennur",
    "KSAWU - B.A.J.S.S. Arts & Commerce College for Women, Ranebennur",
  ],
  "KSAWU - Anjuman Degree College for Women, Shamsuddin Circle, Bhatkal": [
    "Anjuman Degree College for Women, Shamshuddin Circle Near Hotel cola paradise Bhatkal",
    "Anjuman Degree College for Women, Shamsuddin Circle, Bhatkal",
    "Anjuman Degree College for Women Shamsuddin Circle Bhatkal",
    "KSAWU - Anjuman Degree College for Women, Shamsuddin Circle, Bhatkal",
  ],
  "KSAWU - Bethel Christian Fellowship Association® Bethel Women's Degree College, Virupapura, Anegundi Road, Gangavati": [
    "Bethel Christian Fellowship Association ® Bethel Women's Degree College, Virupapura, Anegundi Road, Gangavathi",
    "Bethel Christian Fellowship Association® Bethel Women's Degree College, Virupapura, Anegundi Road, Gangavati",
    "KSAWU - Bethel Christian Fellowship Association® Bethel Women's Degree College, Virupapura, Anegundi Road, Gangavati",
  ],
  "KSAWU - B.L.D.E's Society's Smt. Bangaramma Sajjan Arts, Commerce and Science College for Women, S.S College Campus, BLDE Hospital Road, Vijayapura": [
    "B.L.D.E's Society's Smt. Bangaramma Sajjan Arts, Commerce and Science College for Women, S.S College Campus BLDE Hospital Road, Vijayapura",
    "B.L.D.E's Society's Smt. Bangaramma Sajjan Arts, Commerce and Science College for Women, S.S College Campus, BLDE Hospital Road, Vijayapura",
    "KSAWU - B.L.D.E's Society's Smt. Bangaramma Sajjan Arts, Commerce and Science College for Women, S.S College Campus, BLDE Hospital Road, Vijayapura",
  ],
  "KSAWU - B.D.E Society's Arts and Commerce College for Women, Vijayapura": [
    "B.D.E Society's Arts Science and Commerce College foe Women, Vijayapur",
    "B.D.E Society's Arts and Commerce College for Women, Vijayapura",
    "KSAWU - B.D.E Society's Arts and Commerce College for Women, Vijayapura",
  ],
  "KSAWU - BVVS Akkamahadevi Women's Arts, Science & Commerce College, Bagalkot": [
    "BVVS Akkamahadevi Women's Arts, Science & Commerce College, Bagalkot",
    "BVVS Akkamahadevi Women's Arts ,Science & Commerce College, Bagalkot-587101",
    "BVVS Akkamahadevi Women's Arts, Science & Commerce College, Bagalkot-587101",
    "BVVS Akkamahadevi Women's Arts Science & Commerce College Bagalkot",
    "KSAWU - BVVS Akkamahadevi Women's Arts, Science & Commerce College, Bagalkot",
  ],
  "KSAWU - Shri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika Samsthe's College of Education for Women, Guledgudd": [
    "Shri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika Samsthe's College of Education for Women, Guledgudd",
    "ri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika samsthe's College of Education for women Guledgudda- 587203",
    "shri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika samsthe's College of Education for women Guledgudda- 587203",
    "Shri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika samsthe's College of Education for women Guledgudda- 587203",
    "Shri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika Samsthe's College of Education for Women Guledgudda",
    "KSAWU - Shri Jagadguru Gurusiddeshwara Vidyavardhak & Sanskritika Samsthe's College of Education for Women, Guledgudd",
  ],
  "KSAWU - Sri Hucheshwar Vidyavardhak Sangha's Education College for Women, Kamatgi": [
    "Sri Hucheshwar Vidyavardhak Sangha's Education College for Women, Kamatgi",
    "Sri Hucheshwar Vidyavardhak Sanghas, Education College for Women, Kamatgi",
    "Sri Hucheshwar Vidyavardhak Sangha's Education College for Women Kamatgi",
    "KSAWU - Sri Hucheshwar Vidyavardhak Sangha's Education College for Women, Kamatgi",
  ],
  "KSAWU - Sri Vijay Mahantesh Arts & Commerce College for Women, Ilkal": [
    "Sri Vijay Mahantesh Arts & Commerce College for Women, Ilkal",
    "Sri. Vijay Mahantesh Arts & Commerce College for Women, Ilkal-587 125",
    "Sri. Vijay Mahantesh Arts & Commerce College for Women, Ilkal",
    "Sri Vijay Mahantesh Arts & Commerce College for Women Ilkal",
    "KSAWU - Sri Vijay Mahantesh Arts & Commerce College for Women, Ilkal",
  ],
  "KSAWU - Shri Basaveshwar Education Society's Akkamahadevi Arts College for Women, Bailhongal": [
    "Shri Basaveshwar Education Society's Akkamahadevi Arts College for Women, Bailhongal",
    "Education Society's Akkamahadevi Arts college for women Bailhonga",
    "Shri Basaveshwar Education Society's Akkamahadevi Arts College for Women Bailhongal",
    "KSAWU - Shri Basaveshwar Education Society's Akkamahadevi Arts College for Women, Bailhongal",
  ],
  "KSAWU - KLE Society's Institute of Fashion Technology and Apparel Design College, Belagavi": [
    "KLE Society's Institute of Fashion Technology and Apparel Design College, Belagavi",
    "KLE Society's Institute of Fashion Technology and apparel Design Womens College, College Road, Belgaum",
    "KLE Society's Institute of Fashion Technology and Apparel Design College Belagavi",
    "KSAWU - KLE Society's Institute of Fashion Technology and Apparel Design College, Belagavi",
  ],
  "KSAWU - J.M.M's Sundrabai B. Patil Women's College of Education, Tilakwadi, Belgaum": [
    "J.M.M's Sundrabai B. Patil Women's College of Education, Tilakwadi, Belgaum",
    "J.M.M's Sundrabai B. Patil women's College of Education Tilakwadi, Belguam-590 006,",
    "J.M.M's Sundrabai B. Patil Women's College of Education Tilakwadi Belgaum",
    "KSAWU - J.M.M's Sundrabai B. Patil Women's College of Education, Tilakwadi, Belgaum",
  ],
  "KSAWU - Smt. Ahalyabai A. Patil Arts & Commerce College for Women, Chikodi": [
    "Smt. Ahalyabai A. Patil Arts & Commerce College for Women, Chikodi",
    "Smt. Ahalyabai A. Patil Arts & Commerce College for Women, Chikkodi",
    "Smt Ahalyabai A Patil Arts & Commerce College for Women Chikodi",
    "KSAWU - Smt. Ahalyabai A. Patil Arts & Commerce College for Women, Chikodi",
  ],
  "KSAWU - Smt. Allum Sumangalamma Memorial Degree College for Women, Gandhi Nagar, Ballari": [
    "Smt. Allum Sumangalamma Memorial Degree College for Women, Gandhi Nagar, Ballari",
    "Smt. Allum Sumangalamma Memorial Degree College for Wome",
    "Smt Allum Sumangalamma Memorial Degree College for Women Ballari",
    "KSAWU - Smt. Allum Sumangalamma Memorial Degree College for Women, Gandhi Nagar, Ballari",
  ],
  "KSAWU - Gujjam... Education Society's College of Education for Women (B.Ed), Bhalki": [
    "Gujjam... Education Society's College of Education for Women (B.Ed), Bhalki",
    "Gujjamma Education society's, College of Education for women (B.Ed) Near R.E.C ,Humnabad Road, Bhalki",
    "Gujjamma Education Society's College of Education for Women (B.Ed), Bhalki",
    "KSAWU - Gujjam... Education Society's College of Education for Women (B.Ed), Bhalki",
  ],
  "KSAWU - Ramchandra Veerappa Arts & Science College for Women, Humnabad": [
    "Ramchandra Veerappa Arts & Science College for Women, Humnabad",
    "Ramchandra Veerappa Arts & Science College for Women Humnabad",
    "KSAWU - Ramchandra Veerappa Arts & Science College for Women, Humnabad",
  ],
  "KSAWU - Smt. K.S. Jiglur Arts & Dr. (Smt.) S.M. Sheshgiri Commerce College for Women, Dharwad": [
    "Smt. K.S. Jiglur Arts & Dr. (Smt.) S.M. Sheshgiri Commerce College for Women, Dharwad",
    "Smt. K.S. Jiglur Arts & Dr. (Smt) S.M. Sheshgiri Commerce College for Women Near R.N. Stadium, Dharwad",
    "Smt. K.S. Jiglur Arts & Dr. S.M. Sheshgiri Commerce College for Women Dharwad",
    "KSAWU - Smt. K.S. Jiglur Arts & Dr. (Smt.) S.M. Sheshgiri Commerce College for Women, Dharwad",
  ],
  "KSAWU - S.J.M.V's Business Administration College for Women, J.C. Nagar, Hubli": [
    "S.J.M.V's Business Administration College for Women, J.C. Nagar, Hubli",
    "S.J.M.V's Business Administration College for Women J.C. Nagar, Hubli-",
    "S.J.M.V's Business Administration College for Women J.C. Nagar, Hubli",
    "KSAWU - S.J.M.V's Business Administration College for Women, J.C. Nagar, Hubli",
  ],
  "KSAWU - S.J.M.V's Arts & Commerce College for Women, J.C. Nagar, Hubli": [
    "S.J.M.V's Arts & Commerce College for Women, J.C. Nagar, Hubli",
    "S.J.M. V's Arts & Commerce College for Women J.C. Nagar, Hubli",
    "S.J.M.V's Arts & Commerce College for Women J.C. Nagar, Hubli",
    "KSAWU - S.J.M.V's Arts & Commerce College for Women, J.C. Nagar, Hubli",
  ],
  "KSAWU - Shasthriji Vasati Education College for Women, Okkalgeri, Gadag": [
    "Shasthriji Vasati Education College for Women, Okkalgeri, Gadag",
    "Shastriji Vasati Education, College for women,  Okkalgeri- Gadag",
    "Shastriji Vasati Education, College for women, Okkalgeri- Gadag",
    "KSAWU - Shasthriji Vasati Education College for Women, Okkalgeri, Gadag",
  ],
  "KSAWU - S.J.M.V: B.A.J.S.S Arts & Commerce College for Women, Church Road, Ranebennur": [
    "S.J.M.V: B.A.J.S.S Arts & Commerce College for Women, Church Road, Ranebennur",
    "S.J.M.V: B.A.J.S.S Arts & Commerce College for Women Church Road, Post Box No:52, Ranebennur",
    "S.J.M.V: B.A.J.S.S Arts & Commerce College for Women Church Road, Ranebennur",
    "KSAWU - S.J.M.V: B.A.J.S.S Arts & Commerce College for Women, Church Road, Ranebennur",
  ],
  "KSAWU - Raj Rajeshwari Arts & Commerce College for Women, Ranebennur": [
    "Raj Rajeshwari Arts & Commerce College for Women, Ranebennur",
    "Raj Rajeshwari Arts & Commerce College for Women Ranebennur",
    "KSAWU - Raj Rajeshwari Arts & Commerce College for Women, Ranebennur",
  ],
  "KSAWU - Reshmi Educational & Charitable Trust's, Kum. Sharaneshwari Reshmi Women's B.Ed College, Kalaburgi": [
    "Reshmi Educational & Charitable Trust's, Kum. Sharaneshwari Reshmi Women's B.Ed College, Kalaburgi",
    "Reshmi Educational & Charitable Trust's, Kum Sharaneshwari Reshmi Womens B.Ed College, Kalaburgi",
    "Reshmi Educational & Charitable Trust's, Kum. Sharaneshwari Reshmi Women's B.Ed College Kalaburgi",
    "KSAWU - Reshmi Educational & Charitable Trust's, Kum. Sharaneshwari Reshmi Women's B.Ed College, Kalaburgi",
  ],
  "KSAWU - Bi Bi Raza Degree College for Women (Arts & Science), Rouza Buzurg, Kalaburgi": [
    "Bi Bi Raza Degree College for Women (Arts & Science), Rouza Buzurg, Kalaburgi",
    "Bi Bi Raza Degree College or Women, (Arts & Science) Rouza Buzurg Kalaburgi -585 104,",
    "Bi Bi Raza Degree College or Women, (Arts & Science) Rouza Buzurg Kalaburgi",
    "Bi Bi Raza Degree College for Women, Rouza Buzurg, Kalaburgi",
    "Bi Bi Raza Degree College Kalaburgi",
    "KSAWU - Bi Bi Raza Degree College for Women (Arts & Science), Rouza Buzurg, Kalaburgi",
  ],
  "KSAWU - Godutai Dodappa Appa Arts, Commerce and Science Degree College for Women, Kalaburgi": [
    "Godutai Dodappa Appa Arts, Commerce and Science Degree College for Women, Kalaburgi",
    "Godutai Doddappa Appa rts, Commerce and Science Degree College for Women, Kalaburgi.",
    "Godutai Doddappa Appa Arts, Commerce and Science Degree College for Women, Kalaburgi",
    "Godutai Doddappa Appa Arts, Commerce and Science Degree College for Women, Kalaburgi.",
    "KSAWU - Godutai Dodappa Appa Arts, Commerce and Science Degree College for Women, Kalaburgi",
  ],
  "KSAWU - HKE Society's Smt Veeramma Gangasiri College for Women, PDA Engg College Road, Aiwan-E-Shahi Area, Kalaburgi": [
    "HKE Society's Smt Veeramma Gangasiri College for Women, PDA Engg College Road, Aiwan-E-Shahi Area, Kalaburgi",
    "HKE Society's Smt Veeramma Gangasiri College for Women, PDA Engg Coollege Road Aiwan-E-Shahi Area Station Bazar Kalaburagi",
    "HKE Society's Smt Veeramma Gangasiri College for Women, PDA Engg College Road Aiwan-E-Shahi Area Station Bazar Kalaburagi",
    "HKE Society's Smt Veeramma Gangasiri College for Women Kalaburgi",
    "KSAWU - HKE Society's Smt Veeramma Gangasiri College for Women, PDA Engg College Road, Aiwan-E-Shahi Area, Kalaburgi",
  ],
  "KSAWU - Godutai College of Education for Women, Sharananagar, Kalaburgi": [
    "Godutai College of Education for Women, Sharananagar, Kalaburgi",
    "Godutai College of Education for women, Sharananagar, Kalaburgi",
    "KSAWU - Godutai College of Education for Women, Sharananagar, Kalaburgi",
  ],
  "KSAWU - Reshmi Educational and Charitable Trust's Sharaneshwari Reshmi Women's Degree College, Kalaburgi": [
    "Reshmi Educational and Charitable Trust's Sharaneshwari Reshmi Women's Degree College, Kalaburgi",
    "Reshmi Educational and Charitable trust Sharaneshwari Reshmi womens degree college (BA, BSC, BOM, BBA, BCA) Kalaburgi",
    "Reshmi Educational and Charitable Trust Sharaneshwari Reshmi Women's Degree College, Kalaburgi",
    "KSAWU - Reshmi Educational and Charitable Trust's Sharaneshwari Reshmi Women's Degree College, Kalaburgi",
  ],
  "KSAWU - Kudal Sangam Education Societies Arts College for Women, Shahabad": [
    "Kudal Sangam Education Societies Arts College for Women, Shahabad",
    "Kudal Sangam Education Societies Arts College for Women Shahabad",
    "KSAWU - Kudal Sangam Education Societies Arts College for Women, Shahabad",
  ],
  "KSAWU - Sri. Gurubasappa Revanasiddappa Goled Arts & Commerce College for Women, Shahabad": [
    "Sri. Gurubasappa Revanasiddappa Goled Arts & Commerce College for Women, Shahabad",
    "Sri. Gurubasappa Revansidappa Goled Arts & Commerce College for Women, Shahabad,",
    "Sri. Gurubasappa Revansidappa Goled Arts & Commerce College for Women, Shahabad",
    "KSAWU - Sri. Gurubasappa Revanasiddappa Goled Arts & Commerce College for Women, Shahabad",
  ],
  "KSAWU - Kalmath Sri Channabasava Swamy Arts & Commerce College for Women, Gangavati": [
    "Kalmath Sri Channabasava Swamy Arts & Commerce College for Women, Gangavati",
    "Kalmath Sri Chanabasava Swamy Arts & Commerce College for Women, Gangavati",
    "Kalmath Sri Channabasava Swamy Arts & Commerce College for Women Gangavati",
    "KSAWU - Kalmath Sri Channabasava Swamy Arts & Commerce College for Women, Gangavati",
  ],
  "KSAWU - Soma Subhadramma Ramagoud Arts & Commerce College for Women, Station Road, Raichur": [
    "Soma Subhadramma Ramagoud Arts & Commerce College for Women, Station Road, Raichur",
    "Soma Subhadramma Ramangoud Arts & Commerce College for Women Station Road, Raichur",
    "Soma Subhadramma Ramagoud Arts & Commerce College for Women Station Road Raichur",
    "KSAWU - Soma Subhadramma Ramagoud Arts & Commerce College for Women, Station Road, Raichur",
  ],
  "KSAWU - Sharda Arts & Commerce College for Women, Adarsh Colony, Sindhanoor": [
    "Sharda Arts & Commerce College for Women, Adarsh Colony, Sindhanoor",
    "Sharda Arts & Commerce College for Women Adarsh Colony Sindhanoor",
    "KSAWU - Sharda Arts & Commerce College for Women, Adarsh Colony, Sindhanoor",
  ],
  "KSAWU - Shri. Valabellary Channabasaveshwar Educational Trust, Patil Women's Degree College, Sindhanoor": [
    "Shri. Valabellary Channabasaveshwar Educational Trust, Patil Women's Degree College, Sindhanoor",
    "Shri. Valabellary Channabasaveshwar Educational Trust, Patil Womens Degree College Sindhanoor",
    "KSAWU - Shri. Valabellary Channabasaveshwar Educational Trust, Patil Women's Degree College, Sindhanoor",
  ],
  "KSAWU - Smt. Uggama Devi Bhavarlal Theosophical Narhar College for Women, Asundi Bheemrao Nagar, Hampi Road, Hospet": [
    "Smt. Uggama Devi Bhavarlal Theosophical Narhar College for Women, Asundi Bheemrao Nagar, Hampi Road, Hospet",
    "Smt. Ugama devi Bhavarlal Theosophical Nahar College for Women, Asundi Bheemrao Nagar, Hampi Road, Hospet",
    "Smt. Uggama Devi Bhavarlal Theosophical Narhar College for Women Asundi Bheemrao Nagar, Hampi Road, Hospet",
    "KSAWU - Smt. Uggama Devi Bhavarlal Theosophical Narhar College for Women, Asundi Bheemrao Nagar, Hampi Road, Hospet",
  ],
  "KSAWU - Shri Padmaraj Vidyavardhak Society's Shri Padmaraj Women's Degree College, Sindagi": [
    "Shri Padmaraj Vidyavardhak Society's Shri Padmaraj Women's Degree College, Sindagi",
    "Shri Padmaraj Vidyavardhak Society's Shri. Padmaraj Women's Degree College Sindagi",
    "Shri Padmaraj Vidyavardhak Society's Shri Padmaraj Women's Degree College Sindagi",
    "KSAWU - Shri Padmaraj Vidyavardhak Society's Shri Padmaraj Women's Degree College, Sindagi",
  ],
  "KSAWU - Matoshri Kantamma Sangannagouda Patil (Sasnoor) College of Education for Women, Hirur": [
    "Matoshri Kantamma Sangannagouda Patil (Sasnoor) College of Education for Women, Hirur",
    "Matoshri Kantamma Sanganagouda Patil (Sasnoor) College of Education for women, Hirur , Vijayapura",
    "Matoshri Kantamma Sangannagouda Patil (Sasnoor) College of Education for Women Hirur",
    "KSAWU - Matoshri Kantamma Sangannagouda Patil (Sasnoor) College of Education for Women, Hirur",
  ],
  "KSAWU - Secab's A.R.S. Inamdar Arts, Science & Commerce College for Women, Noubag, Vijayapura": [
    "Secab's A.R.S. Inamdar Arts, Science & Commerce College for Women, Noubag, Vijayapura",
    "Secab's A.R.S. Inamdar Arts, Science & Commerce College for Women, Noubag Vijayapura",
    "Secab's A.R.S. Inamdar Arts Science & Commerce College for Women Noubag Vijayapura",
    "KSAWU - Secab's A.R.S. Inamdar Arts, Science & Commerce College for Women, Noubag, Vijayapura",
  ],
  "KSAWU - Sri. Bapugoud Darshanpur Memorial College for Women, Shahapur": [
    "Sri. Bapugoud Darshanpur Memorial College for Women, Shahapur",
    "Sri. Bapugoud Darshnapur Memorial College for Women, Shahapur, Yadgir",
    "Sri. Bapugoud Darshanpur Memorial College for Women Shahapur",
    "KSAWU - Sri. Bapugoud Darshanpur Memorial College for Women, Shahapur",
  ],
  "KSAWU - Shri Amareshwar Education Trust's Janani Arts College for Women, Surpur": [
    "Shri Amareshwar Education Trust's Janani Arts College for Women, Surpur",
    "Shri. Amareshwar Education Trust's Janani arts college for women, Surpur, Yadgir",
    "Shri Amareshwar Education Trust's Janani Arts College for Women Surpur",
    "KSAWU - Shri Amareshwar Education Trust's Janani Arts College for Women, Surpur",
  ],
  "Balaji Degree College -Hanumanth Nagar": [
    "Balaji Degree College -Hanumanth Nagar",
    "Balaji Degree College ,Hanumanth Nagar",
    "Balaji Degree College, Hanumanth Nagar",
    "Balaji Degree College - Hanumanth Nagar",
    "Balaji Degree College Hanumanth Nagar",
    "BALAJI DEGREE COLLEGE HANUMANTH NAGAR",
  ],
  "AMC Engineering College Bannerghatta Road, Bengaluru 560083 Autonomous Institution": [
    "AMC Engineering College Bannerghatta Road, Bengaluru 560083 Autonomous Institution",
    "AMC Engineering College Bannerghatta Road, Bengaluru 560083 Autonomous",
    "AMC Engineering College Bannerghatta Road, Bengaluru 560083",
    "AMC Engineering College",
    "AMC ENGINEERING COLLEGE",
  ],
  "BES College , Jayanagar": [
    "BES College , Jayanagar",
    "BES College , Jayanagarr",
    "BES College Jayanagar",
    "BES College, Jayanagar",
    "BES COLLEGE JAYANAGAR",
  ],
  "Angadi Institute of Technology Belagavi": [
    "Angadi Institute of Technology Belagavi",
    "ANGADI INSTITUTE OF TECHNOLOGY BELAGAVI",
    "Angadi Institute of Technology Management Belagavi",
    "Angadi Institute of Technology",
    "Angadi Institute of Technology, Belagavi",
    "Angadi Institute of Technology Belgaum",
    "Angadi Institute of Technology, Belgaum",
    "Angadi Institute of Technology Management",
    "Angadi institute of technology belagavi",
    "Angadi Institute Of Technology Belagavi",
    "AITM BELAGAVI",
    "AITM Belagavi",
    "AITM Belgaum",
    "AITM",
  ],
  "AVK COLLEGE HASSAN": [
    "AVK COLLEGE HASSAN",
    "AVK WOMENS COLLEGE",
    "AV KANTHAMMA COLLEGE FOR WOMEN",
    "AVK COLLEGE FOR WOMEN HASSAN",
    "AVK COLLEGE FOR WOMEN",
    "A V KANTHAMMA COLLEGE FOR WOMEN",
    "A.V.K COLLEGE FOR WOMEN",
    "AVK COLLEGE FOR WOMEN HASSA",
    "A V KANTHAMMA COLLEGE FOR WOMEN,HASSAN",
    "A V K COLLEGE FOR WOMEN",
    "A.V.KCOLLEGE",
    "A V KANTHAMMA COLLEGE FOR WOMEN HASSAN",
    "A. V. K. FOR WOMEN HASSAN",
    "AVK COLLLEGE FOR WOMENS HASSAN",
    "A V KANTHAMMA COLLEG FOR WOMEN Hassan",
    "A V KANTHAMMA COLLEGE FOR WOMEN, HASSAN",
    "AVKCOLLEGEFORWOMENHASSAN",
    "A V K COLLEGE FOR WOMEN HASSAN",
    "AVK COLLEGE FOR WOMEN, HASSAN",
    "AVK WOMEN'S COLLAGE",
    "AVK COLLEGE FOR WOMENS",
    "A.V KANTHAMMA (AVK) COLLEGE FOR WOMEN",
    "A.V KANTHAMMA COLLEGE FOR WOMEN, HASSAN",
    "HASSAN UNIVERSITY",
  ],
  "TERESIAN COLLEGE MYSORE": [
    "TERESIAN COLLEGE MYSORE",
    "TERESIAN COLLEGE",
  ],
  "CENTRAL COMMERCE COLLEGE HASSAN": [
    "CENTRAL COMMERCE COLLEGE HASSAN",
    "CENTRAL COMMERCE COLLEGE",
    "CENTRAL COMMERCE FIRST GRADE COLLEGE",
    "CENTRAL COMMERCE COLLEGE,HASSAN",
  ],
  "MALNAD COLLEGE OF ENGINEERING HASSAN": [
    "MALNAD COLLEGE OF ENGINEERING HASSAN",
    "MALNAD COLLEGE OF ENGINEERING",
    "MCE HASSAN",
  ],
  "Maharani science college , Mysore": [
    "Maharani science college , Mysore",
    "Maharani Science College Mysore",
    "Maharani Science College, Mysore",
    "MAHARANI SCIENCE COLLEGE MYSORE",
    "Maharani Science College for Women Mysore",
    "Maharani's Science College for Women, Mysore",
  ],
  "JSS college of women's, Mysore": [
    "JSS college of women's, Mysore",
    "JSS College of Women's Mysore",
    "JSS College of Women's, Mysore",
    "JSS College for Women Mysore",
    "JSS College for Women, Mysore",
    "JSS COLLEGE FOR WOMEN MYSORE",
    "JSS COLLEGE OF WOMEN'S MYSORE",
  ],
  "JSS College For Women, Chamarajanagara": [
    "JSS College For Women, Chamarajanagara",
    "JSS College For Women Chamarajanagara",
    "JSS College for Women Chamarajanagara",
    "JSS College for Women, Chamarajanagara",
    "JSS College for Women Chamarajanagar",
    "JSS College for Women, Chamarajanagar",
    "JSS COLLEGE FOR WOMEN CHAMARAJANAGARA",
    "JSS COLLEGE FOR WOMEN CHAMARAJANAGAR",
    "JSS College For Women chamarajanagara",
  ],
  "Maharani commerce and management college , Mysore": [
    "Maharani commerce and management college , Mysore",
    "Maharani Commerce and Management College Mysore",
    "Maharani Commerce and Management College, Mysore",
    "MAHARANI COMMERCE AND MANAGEMENT COLLEGE MYSORE",
    "Maharani's Commerce and Management College for Women Mysore",
  ],
  "GFGC Womens college, Mysore": [
    "GFGC Womens college, Mysore",
    "GFGC Womens College Mysore",
    "GFGC Women's College Mysore",
    "GFGC Women's College, Mysore",
    "GFGC WOMENS COLLEGE MYSORE",
    "Government First Grade College for Women Mysore",
    "Govt First Grade Womens College Mysore",
  ],
  "BES Degree College Of Arts Commerce & Science- Bangalore": [
    "BES Degree College Of Arts Commerce & Science- Bangalore",
    "BES Degree College Of Arts Commerce & Science Bangalore",
    "BES Degree College Of Arts Commerce & Science, Bangalore",
    "BES DEGREE COLLEGE BANGALORE",
    "BES Degree College Bangalore",
    "BES COLLEGE BANGALORE",
  ],
  "KTSV degree college for women vijayanagar-Bangalore": [
    "KTSV degree college for women vijayanagar-Bangalore",
    "KTSV degree college for women vijayanagar Bangalore",
    "KTSV degree college for women vijayanagar, Bangalore",
    "KTSV Degree College Vijayanagar Bangalore",
    "KTSV DEGREE COLLEGE FOR WOMEN VIJAYANAGAR BANGALORE",
    "KTSV College Vijayanagar",
  ],
  "Oxford PU and Degree College-Bangalore": [
    "Oxford PU and Degree College-Bangalore",
    "Oxford PU and Degree College Bangalore",
    "Oxford PU and Degree College, Bangalore",
    "Oxford PU & Degree College Bangalore",
    "OXFORD PU AND DEGREE COLLEGE BANGALORE",
    "Oxford Degree College Bangalore",
  ],
  "Kempegowda Institute of Management Studies & Research-Bangalore": [
    "Kempegowda Institute of Management Studies & Research-Bangalore",
    "Kempegowda Institute of Management Studies & Research Bangalore",
    "Kempegowda Institute of Management Studies & Research, Bangalore",
    "Kempegowda Institute of Management Studies and Research Bangalore",
    "KEMPEGOWDA INSTITUTE OF MANAGEMENT STUDIES & RESEARCH BANGALORE",
    "KIMS BANGALORE",
  ],
  "Government First Grade College for Women's, Gandhadakoti, Hassan": [
    "Government First Grade College for Women's, Gandhadakoti, Hassan",
    "Government First Grade College for Women's Gandhadakoti Hassan",
    "Government First Grade College for Women Gandhadakoti Hassan",
    "GFGC Gandhadakoti Hassan",
    "GFGC FOR WOMEN GANDHADAKOTI HASSAN",
    "Government First Grade College Gandhadakoti Hassan",
  ],

  "Shivkumar": [
    "Shivkumar",
    "Shivakumar",
    "SHIVAKUMAR",
    "SHIVKUMAR",
    "SHIVAKUMAR E",
    "SHIVAKUMAR. A",
    "shivakumar",
    "shivkumar",
  ],
  "Government College for Women (Autonomous), Mandya": [
    "Government College for Women (Autonomous), Mandya",
    "Government College for Women Mandya",
    "Govt College for Women Mandya",
    "GCW Mandya",
  ],
  "P.E.S. College of Science, Arts & Commerce, Mandya": [
    "P.E.S. College of Science, Arts & Commerce, Mandya",
    "P.E.S College of Science, Arts & Commerce, Mandya",
    "PES College of Science, Arts & Commerce, Mandya",
    "PES College of Science Arts & Commerce Mandya",
    "PES College of Science Arts and Commerce Mandya",
    "PES College of Science, Arts and Commerce, Mandya",
    "PES COLLEGE MANDYA",
    "PES College Mandya",
    "PES College, Mandya",
    "P.E.S. College, Mandya",
    "P.E.S College, Mandya",
    "PES Commerce College Mandya",
  ],
  "GOVT COLLEGE CHANNARAYAPATNA": [
    "GOVT COLLEGE CHANNARAYAPATNA",
    "GOVT FIRST GRADE COLLEGE CHANNARAYAPATNA",
    "GFGC CHANNARAYAPATNA",
    "Channarayapatna Govt College",
  ],
  "BGS College Channarayapatna": [
    "BGS College Channarayapatna",
    "BGS COLLEGE CHANNARAYAPATNA",
    "BGS FIRST GRADE COLLEGE CHANNARAYAPATNA",
    "BGS PU AND FIRST GRADE COLLEGE CHANNARAYAPATNA",
    "BGS COLLEGE",
  ],
  "GOVT FIRST GRADE WOMENS COLLEGE YADGIRI": ["GOVT FIRST GRADE WOMENS COLLEGE YADGIRI"],
  "MARI MALLAPPA WOMENS COLLEGE MYSORE": ["MARI MALLAPPA WOMENS COLLEGE MYSORE"],
  "SIDHARTHA COLLEGE BIDAR": ["SIDHARTHA COLLEGE BIDAR"],
  "Dadapheer Huballi": ["Dadapheer Huballi"],
  "Hubballi Center ": ["Hubballi Center ", "Hubballi Center"],
  "Government first grade College Ramnagar": [
    "Government first grade College Ramnagar",
    "Government First Grade College Ramnagar",
    "Government First Grade College Ramnagara",
    "Government First Grade College, Ramnagar",
    "Government First Grade College, Ramnagara",
    "GFGC Ramnagar",
    "GFGC Ramnagara",
    "GOVT FIRST GRADE COLLEGE RAMNAGAR",
    "Govt First Grade College Ramnagar",
  ],
  "New expert college , Ramanagar": [
    "New expert college , Ramanagar",
    "New Expert College, Ramanagar",
    "New Expert College Ramanagar",
    "New Expert College Ramanagara",
    "New expert college, Ramanagara",
    "NEW EXPERT COLLEGE RAMANAGAR",
    "NEW EXPERT COLLEGE",
  ],
  "GFGC Byrapur , Mysore": [
    "GFGC Byrapur , Mysore",
    "GFGC Byrapur, Mysore",
    "GFGC Byrapur Mysore",
    "GFGC Byrapura, Mysore",
    "GFGC Bairapura Mysore",
    "GFGC BYRAPUR MYSORE",
    "Government First Grade College Byrapur Mysore",
  ],
  "Oxford college Banglore": [
    "Oxford college Banglore",
    "Oxford College Bangalore",
    "Oxford College, Bangalore",
    "Oxford College Banglore",
    "Oxford College, Banglore",
    "OXFORD COLLEGE BANGLORE",
    "OXFORD COLLEGE BANGALORE",
  ],
  "GT Ramanagara": [
    "GT Ramanagara",
    "GT RAMANAGARA",
    "GT Ramanagar",
    "GT College Ramanagara",
  ],
  "VISHWA GANGA COMPUTER TRAINING CENTRE YADGIR": [
    "VISHWA GANGA COMPUTER TRAINING CENTRE YADGIR",
    "Vishwa Ganga Computer Training Centre Yadgir",
    "VISHWA GANGA COMPUTER TRAINING CENTRE",
    "Vishwa Ganga Computer Training Centre",
    "VISHWA GANGA COMPUTER TRAINING CENTRE YADGIR NEW BUS STAND OPP, AXIS BANK BESIDE, HYDRABAD ROAD YADGIR",
    "Vishwa Ganga Computer Training Centre, New Bus Stand Opp, Axis Bank Beside, Hydrabad Road Yadgir",
  ],
  "Lingeri Konappa education trust Women's Art science and commerce degree college yadgir": [
    "Lingeri Konappa education trust Women's Art science and commerce degree college yadgir",
    "Lingeri Konappa Education Trust Women's Arts, Science and Commerce Degree College Yadgir",
    "Lingeri Konappa Education Trust Women's Art Science and Commerce Degree College Yadgir",
    "Lingeri Konappa Education Trust Women's College Yadgir",
    "Lingeri Konappa Education Trust Yadgir",
    "LINGERI KONAPPA EDUCATION TRUST WOMEN'S ART SCIENCE AND COMMERCE DEGREE COLLEGE YADGIR",
    "Lingeri Konappa education trust Women's Art science and commerce degree college yadgir OPP, tahasil office main road yadgir",
    "Lingeri Konappa education trust Women's Art science and commerce degree college yadgir, OPP, tahasil office main road yadgir",
  ],
  "Basaveshwar science college, Bagalkote": [
    "Basaveshwar science college, Bagalkote",
    "Basaveshwar science college Bagalkote",
    "Basaveshwar Science College, Bagalkote",
    "Basaveshwar Science College Bagalkote",
    "Basaveshwar science college, Bagalkot",
    "Basaveshwar science college Bagalkot",
    "Basaveshwar Science College, Bagalkot",
    "Basaveshwar Science College Bagalkot",
    "BASAVESHWAR SCIENCE COLLEGE BAGALKOTE",
    "BASAVESHWAR SCIENCE COLLEGE BAGALKOT",
    "BASAVESHWAR SCIENCE COLLEGE",
    "Basaveshwar Science College",
    "Basaveshwar science college",
    "Basaveshwara Science College, Bagalkote",
    "Basaveshwara Science College Bagalkote",
    "Basaveshwara Science College, Bagalkot",
    "Basaveshwara Science College Bagalkot",
    "BVVS Basaveshwar Science College Bagalkote",
    "BVVS Basaveshwar Science College, Bagalkote",
    "BVVS Basaveshwar Science College Bagalkot",
    "BVVS Basaveshwar Science College, Bagalkot",
    "B.V.V.S Basaveshwar Science College Bagalkote",
    "B.V.V.S. Basaveshwar Science College, Bagalkote",
    "B.V.V.S Basaveshwar Science College Bagalkot",
    "B.V.V.S. Basaveshwar Science College, Bagalkot",
  ],
  "SADGURU SIDDHAROODH WOMENS DEGREE COLLEGE, GUMPA BIDAR": [
    "SADGURU SIDDHAROODH WOMENS DEGREE COLLEGE, GUMPA BIDAR",
    "SADGURU SIDDHAROODH WOMENS DEGREE COLLEGE GUMPA BIDAR",
    "SADGURU SIDDHAROODH WOMENS DEGREE COLLEGE",
    "Sadguru Siddharoodh Womens Degree College, Gumpa Bidar",
    "Sadguru Siddharoodh Womens Degree College Gumpa Bidar",
    "Sadguru Siddharoodh Womens Degree College",
    "Sadguru Siddharoodh Women's Degree College, Gumpa Bidar",
    "Sadguru Siddharoodh Women's Degree College Gumpa Bidar",
    "Sadguru Siddharoodh Women's Degree College",
    "Sadguru Siddharoodha Women's Degree College, Gumpa Bidar",
    "Sadguru Siddharoodha Womens Degree College, Gumpa Bidar",
    "Sadguru Siddharoodha Womens Degree College Gumpa Bidar",
    "Sadguru Siddharoodha Degree College Bidar",
    "SSWDC Gumpa Bidar",
    "SSWDC Bidar",
  ],
  "GOVT. FIRST GRADE COLLEGE FOR WOMEN, NAUBAD BIDAR": [
    "GOVT. FIRST GRADE COLLEGE FOR WOMEN, NAUBAD BIDAR",
    "GOVT. FIRST GRADE COLLEGE FOR WOMEN NAUBAD BIDAR",
    "GOVT FIRST GRADE COLLEGE FOR WOMEN NAUBAD BIDAR",
    "GOVT FIRST GRADE COLLEGE FOR WOMEN, NAUBAD BIDAR",
    "GOVT. FIRST GRADE COLLEGE FOR WOMEN",
    "GOVT FIRST GRADE COLLEGE FOR WOMEN",
    "Government First Grade College for Women, Naubad Bidar",
    "Government First Grade College for Women Naubad Bidar",
    "Government First Grade College for Women, Naubad, Bidar",
    "Government First Grade College for Women's, Naubad Bidar",
    "Government First Grade College for Women's, Naubad, Bidar",
    "Govt First Grade College for Women Naubad Bidar",
    "Govt. First Grade College for Women Naubad Bidar",
    "Govt First Grade College for Women, Naubad Bidar",
    "GFGC Women Naubad Bidar",
    "GFGC Women Naubad",
    "GFGC Women's Naubad Bidar",
    "GFGC FOR WOMEN NAUBAD BIDAR",
    "GFGC NAUBAD BIDAR",
    "GFGC NAUBAD",
    "GOVT FIRST GRADE COLLEGE FOR WOMEN BIDAR",
    "Government First Grade College for Women Bidar",
  ],
  "Shanti Vardhak Education Society Akkaamahadevi Mahila Mahavidya Bidar, Udgir Road BIDAR": [
    "Shanti Vardhak Education Society Akkaamahadevi Mahila Mahavidya Bidar, Udgir Road BIDAR",
    "Shanti Vardhak Education Society Akkaamahadevi Mahila Mahavidya Bidar, Udgir Road Bidar",
    "Shanti Vardhak Education Society Akkaamahadevi Mahila Mahavidya Bidar",
    "Shanti Vardhak Education Society Akkaamahadevi Mahila Mahavidyalaya Bidar",
    "Shanti Vardhak Education Society Akkamahadevi Mahila Mahavidyalaya, Udgir Road Bidar",
    "Shanti Vardhak Education Society Akkamahadevi Mahila Mahavidyalaya, Udgir Road, Bidar",
    "Shanti Vardhak Education Society Akkamahadevi Mahila Mahavidyalaya Bidar",
    "Shanti Vardhak Education Society, Akkamahadevi Mahila Mahavidyalaya, Bidar",
    "Akkamahadevi Mahila Mahavidyalaya Bidar",
    "Akkamahadevi Mahila Mahavidyalaya, Udgir Road Bidar",
    "Akkamahadevi Mahila Mahavidyalaya, Bidar",
    "Akkaamahadevi Mahila Mahavidya Bidar",
    "Akkaamahadevi Mahila Mahavidya, Udgir Road Bidar",
    "SVES Akkamahadevi Mahila Mahavidyalaya Bidar",
    "SVES Akkamahadevi College Bidar",
    "SHANTI VARDHAK EDUCATION SOCIETY AKKAAMAHADEVI MAHILA MAHAVIDYA BIDAR",
    "SHANTI VARDHAK EDUCATION SOCIETY AKKAMAHADEVI MAHILA MAHAVIDYALAYA BIDAR",
  ],
  "Vizutech Solutions Pvt Ltd.": [
    "Vizutech Solutions Pvt Ltd.",
    "Vizutech Solutions Pvt Ltd",
    "Vizutech Solutions Private Limited",
    "Vizutech Solutions Pvt. Ltd.",
    "Vizutech Solutions",
    "VIZUTECH SOLUTIONS PVT LTD",
    "VIZUTECH SOLUTIONS PRIVATE LIMITED",
    "VIZUTECH SOLUTIONS",
    "VIZUTECH",
    "Vizutech",
  ],
  "Government Polytechnic for Women Ramanagar": [
    "Government Polytechnic for Women Ramanagar",
    "Government Polytechnic for Women Ramanagara",
    "Government Polytechnic for Women, Ramanagar",
    "Government Polytechnic for Women, Ramanagara",
    "Govt Polytechnic for Women Ramanagar",
    "Govt Polytechnic for Women Ramanagara",
    "Government Polytechnic Women Ramanagar",
    "Government Polytechnic Women Ramanagara",
    "GPTW Ramanagar",
    "GPTW Ramanagara",
  ],
  "Government Science College (Autonomous) - Hassan": [
    "Government Science College (Autonomous) - Hassan",
    "Government Science College (Autonomous), Hassan",
    "Government Science College Hassan",
    "Government Science College (Autonomous) Hassan",
    "Govt Science College Hassan",
    "Government Science College, Hassan",
  ],
  "Government Womens college - Ramanagara": [
    "Government Womens college - Ramanagara",
    "Government Womens college - Ramnagara",
    "Government Women's College - Ramanagara",
    "Government Women's College - Ramnagara",
    "Government Women's College Ramanagara",
    "Government Women's College Ramnagara",
    "Government Womens College Ramanagara",
    "Government Womens College Ramnagara",
    "Govt Womens College Ramanagara",
    "Govt Womens College Ramnagara",
  ],
  "Government Girls PU college Channapatna - Ramnagara": [
    "Government Girls PU college Channapatna - Ramnagara",
    "Government Girls PU college Channapatna - Ramanagara",
    "Government Girls PU College Channapatna - Ramnagara",
    "Government Girls PU College Channapatna - Ramanagara",
    "Government Girls PU College Channapatna",
    "Government Girls PU college Channapatna",
    "Govt Girls PU College Channapatna",
  ],
  "VIJAYA VITTALA INSTITUTE OF TECHNOLOGY": [
    "VIJAYA VITTALA INSTITUTE OF TECHNOLOGY",
    "Vijaya Vittala Institute of Technology",
    "Vijaya Vittala Institute of Technology Bangalore",
    "Vijaya Vittala Institute of Technology, Bangalore",
    "Vijaya Vittala Institute of Technology Bengaluru",
    "Vijaya Vittala Institute of Technology, Bengaluru",
    "VIJAYA VITTALA INSTITUTE OF TECHNOLOGY BANGALORE",
    "VVIT",
    "VVIT Bangalore",
    "VVIT Bengaluru",
    "Vijaya Vittala College",
    "Vijaya Vithala Institute of Technology",
  ],
  "Sree adithya degree college hosakote, Bangalore rural district": [
    "Sree adithya degree college hosakote, Bangalore rural district",
    "Sree Adithya Degree College Hosakote, Bangalore Rural District",
    "Sree Adithya Degree College, Hosakote, Bangalore Rural District",
    "Sree Adithya Degree College Hosakote",
    "Sree Adithya Degree College, Hosakote",
    "Sri Adithya Degree College Hosakote",
    "Sri Adithya Degree College, Hosakote",
    "Sri Aditya Degree College Hosakote",
    "Sree Aditya Degree College Hosakote",
    "Sree Adithya Degree College",
    "Sri Adithya Degree College",
    "Sree Aditya Degree College",
    "Sri Aditya Degree College",
  ],
};

const normCollegeNameCache = new Map<string, string>();

export function normalizeCollegeName(rawName?: string | null): string {
  if (!rawName) return "";
  const trimmed = rawName.trim();
  if (!trimmed) return "";

  if (normCollegeNameCache.has(trimmed)) {
    return normCollegeNameCache.get(trimmed)!;
  }

  const cleanAlphaNumeric = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");

  for (const [canonical, aliases] of Object.entries(COLLEGE_ALIASES)) {
    if (canonical.trim().toLowerCase() === trimmed.toLowerCase()) return canonical;
    if (canonical.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanAlphaNumeric) return canonical;
    if (
      aliases.some((a) => {
        const aTrim = a.trim().toLowerCase();
        return aTrim === trimmed.toLowerCase() || a.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanAlphaNumeric;
      })
    ) {
      return canonical;
    }
  }

  const upper = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (upper === "SHIVAKUMAR" || upper === "SHIVKUMAR") return "Shivkumar";
  if (upper.includes("VIZUTECH")) return "Vizutech Solutions Pvt Ltd.";
  if (upper.includes("POLYTECHNIC") && (upper.includes("RAMNAGAR") || upper.includes("RAMANAGAR"))) return "Government Polytechnic for Women Ramanagar";
  if ((upper.includes("SCIENCE") || upper.includes("SCI")) && upper.includes("HASSAN")) return "Government Science College (Autonomous) - Hassan";
  if ((upper.includes("WOMEN") || upper.includes("WOMENS")) && (upper.includes("RAMNAGAR") || upper.includes("RAMANAGAR")) && !upper.includes("POLYTECHNIC") && !upper.includes("PU")) return "Government Womens college - Ramanagara";
  if ((upper.includes("GIRLS") || upper.includes("PU")) && upper.includes("CHANNAPATNA")) return "Government Girls PU college Channapatna - Ramnagara";
  if (upper.includes("VIJAYAVITTALA") || upper.includes("VIJAYAVITHALA") || upper === "VVIT" || upper.includes("VVITBANGALORE") || upper.includes("VVITBENGALURU")) return "VIJAYA VITTALA INSTITUTE OF TECHNOLOGY";
  if ((upper.includes("ADITHYA") || upper.includes("ADITYA")) && (upper.includes("HOSAKOTE") || upper.includes("HOSKOTE") || upper.includes("BANGALORE") || upper.includes("BENGALURU"))) return "Sree adithya degree college hosakote, Bangalore rural district";
  if (upper.includes("BASAVESHWAR") || upper.includes("BASAVESHWARA")) return "Basaveshwar science college, Bagalkote";
  if (upper.includes("SIDDRAMESHWAR")) return "KSAWU - Sri Siddrameshwar Education Society's Chandragiri College of Education for Women, Shivabasava Nagar, Belgaum";
  if (upper.includes("SIDDHAROODH") || upper.includes("SIDDHAROODHA") || upper.includes("GUMPA")) return "SADGURU SIDDHAROODH WOMENS DEGREE COLLEGE, GUMPA BIDAR";
  if (upper.includes("NAUBAD") || (upper.includes("WOMEN") && upper.includes("BIDAR") && (upper.includes("GFGC") || upper.includes("FIRSTGRADE") || upper.includes("GOVT")))) return "GOVT. FIRST GRADE COLLEGE FOR WOMEN, NAUBAD BIDAR";
  if (upper.includes("AKKAAMAHADEVI") || upper.includes("AKKAMAHADEVI") || upper.includes("SHANTIVARDHAK") || upper.includes("UDGIR") || upper.includes("SVES")) return "Shanti Vardhak Education Society Akkaamahadevi Mahila Mahavidya Bidar, Udgir Road BIDAR";
  if (upper.includes("NEWEXPERT")) return "New expert college , Ramanagar";
  if (upper.includes("BYRAPUR") || upper.includes("BAIRAPUR")) return "GFGC Byrapur , Mysore";
  if (upper.includes("OXFORD") && !upper.includes("PU")) return "Oxford college Banglore";
  if ((upper.includes("GFGC") || upper.includes("GOVTFIRSTGRADE") || upper.includes("FIRSTGRADE")) && (upper.includes("RAMNAGAR") || upper.includes("RAMNAGARA"))) return "Government first grade College Ramnagar";
  if (upper.includes("GANDHADAKOTI")) return "Government First Grade College for Women's, Gandhadakoti, Hassan";
  if (upper.includes("AVK") || upper.includes("KANTHAMMA")) return "AVK COLLEGE HASSAN";
  if (upper.includes("TERESIAN")) return "TERESIAN COLLEGE MYSORE";
  if (upper.includes("CENTRALCOMMERCE")) return "CENTRAL COMMERCE COLLEGE HASSAN";
  if (upper.includes("MALNAD") || upper === "MCE" || upper.includes("MCEHASSAN")) return "MALNAD COLLEGE OF ENGINEERING HASSAN";
  if (upper.includes("MAHARANI") && (upper.includes("SCIENCE") || upper.includes("SCI"))) return "Maharani science college , Mysore";
  if (upper.includes("MAHARANI") && (upper.includes("COMMERCE") || upper.includes("MANAGEMENT"))) return "Maharani commerce and management college , Mysore";
  if (upper.includes("JSS") && (upper.includes("CHAMARAJANAGAR") || upper.includes("CHAMARAJANAGARA"))) return "JSS College For Women, Chamarajanagara";
  if (upper.includes("JSS") && (upper.includes("WOMEN") || upper.includes("MYSORE") || upper.includes("MYSURU"))) return "JSS college of women's, Mysore";
  if ((upper.includes("GFGC") || upper.includes("GOVTFIRSTGRADE")) && (upper.includes("MYSORE") || upper.includes("MYSURU"))) return "GFGC Womens college, Mysore";
  if (upper.includes("BES") && (upper.includes("DEGREE") || upper.includes("ARTS") || upper.includes("COMMERCE") || upper.includes("BANGALORE") || upper.includes("BENGALURU"))) return "BES Degree College Of Arts Commerce & Science- Bangalore";
  if (upper.includes("KTSV")) return "KTSV degree college for women vijayanagar-Bangalore";
  if (upper.includes("OXFORD") && (upper.includes("PU") || upper.includes("DEGREE") || upper.includes("BANGALORE") || upper.includes("BENGALURU"))) return "Oxford PU and Degree College-Bangalore";
  if (upper.includes("KEMPEGOWDA") && (upper.includes("MANAGEMENT") || upper.includes("RESEARCH") || upper.includes("STUDIES"))) return "Kempegowda Institute of Management Studies & Research-Bangalore";
  if (upper.includes("KSAW")) return "KSAWU VIJAYAPURA";
  if (upper.includes("PES") && upper.includes("MANDYA")) return "P.E.S. College of Science, Arts & Commerce, Mandya";
  if (upper.includes("BGS")) return "BGS College Channarayapatna";
  if (upper.includes("CHANNARAYAPATNA")) return "GOVT COLLEGE CHANNARAYAPATNA";
  if (upper.includes("YADGIR")) return "GOVT FIRST GRADE WOMENS COLLEGE YADGIRI";
  if (upper.includes("MALLAPPA")) return "MARI MALLAPPA WOMENS COLLEGE MYSORE";
  if (upper.includes("SIDHARTHA") || upper.includes("SIDDHARTHA")) return "SIDHARTHA COLLEGE BIDAR";
  if (upper.includes("DADAPHEER")) return "Dadapheer Huballi";
  if (upper.includes("HUBBALLI") || upper.includes("HUBBALI")) return "Hubballi Center";
  const result = (upper.includes("ANGADI") || upper.includes("AITM")) ? "Angadi Institute of Technology Belagavi" : trimmed;
  normCollegeNameCache.set(trimmed, result);
  return result;
}

const collegeAliasesCache = new Map<string, string[]>();

export function getCollegeAliases(name: string): string[] {
  if (!name) return [];
  const trimmed = name.trim();
  if (!trimmed) return [];
  
  if (collegeAliasesCache.has(trimmed)) {
    return collegeAliasesCache.get(trimmed)!;
  }

  const lower = trimmed.toLowerCase();
  const cleanAlpha = lower.replace(/[^a-z0-9]/g, "");

  const canonicalFromNorm = normalizeCollegeName(trimmed);

  const matchedSet = new Set<string>([trimmed]);
  if (canonicalFromNorm) {
    matchedSet.add(canonicalFromNorm);
  }

  for (const [canonical, aliases] of Object.entries(COLLEGE_ALIASES)) {
    const canonicalClean = canonical.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const matchesCanonical = canonical.trim().toLowerCase() === lower || canonicalClean === cleanAlpha || (canonicalFromNorm && canonical.trim().toLowerCase() === canonicalFromNorm.toLowerCase());
    const matchesAliases = aliases.some((a) => {
      const aLower = a.trim().toLowerCase();
      return aLower === lower || aLower.replace(/[^a-z0-9]/g, "") === cleanAlpha;
    });

    if (matchesCanonical || matchesAliases) {
      matchedSet.add(canonical);
      for (const a of aliases) {
        matchedSet.add(a);
      }
    }
  }

  const result = Array.from(matchedSet);
  collegeAliasesCache.set(trimmed, result);
  return result;
}


export const RELIGIONS = ["Buddhist", "Christian", "Hindu", "Jain", "Muslim", "Other", "Sikh"] as const;

export const CATEGORIES = ["General", "SC", "ST", "OBC", "Minority"] as const;

export const CASTE_CERTIFICATE_TYPES = [
  "Form-E (Income & Caste)",
  "Form-F (Category 1)",
  "Form-D (SC/ST)",
  "RD Number",
  "Upload Physical Document",
] as const;

export const SPECIALLY_ABLED_TYPES = [
  "Visual",
  "Locomotive",
  "Hearing",
  "Other",
  "Intellectual",
  "Physical",
  "Speech",
] as const;

export const SPECIALLY_ABLED_SUB_TYPES = [
  "Low Vision",
  "Blindness",
  "One Leg Affected",
  "Both Legs Affected",
  "One Arm Affected",
  "Hard of Hearing",
  "Deaf",
  "Speech and Language Disability",
  "Intellectual Disability",
  "Multiple Disabilities",
] as const;

export const SALUTATIONS = ["Mr.", "Ms.", "Mrs.", "Dr."] as const;

export const STATES = [
  "ANDAMAN AND NICOBAR ISLANDS",
  "ANDHRA PRADESH",
  "ARUNACHAL PRADESH",
  "ASSAM",
  "BIHAR",
  "CHANDIGARH",
  "CHHATTISGARH",
  "DADRA AND NAGAR HAVELI",
  "DAMAN AND DIU",
  "DELHI",
  "GOA",
  "GUJARAT",
  "HARYANA",
  "HIMACHAL PRADESH",
  "JAMMU AND KASHMIR",
  "JHARKHAND",
  "KARNATAKA",
  "KERALA",
  "LAKSHADWEEP",
  "MADHYA PRADESH",
  "MAHARASHTRA",
  "MANIPUR",
  "MEGHALAYA",
  "MIZORAM",
  "NAGALAND",
  "ODISHA",
  "PUDUCHERRY",
  "PUNJAB",
  "RAJASTHAN",
  "SIKKIM",
  "TAMIL NADU",
  "TELANGANA",
  "TRIPURA",
  "UTTAR PRADESH",
  "UTTARAKHAND",
  "WEST BENGAL",
] as const;

export const DISTRICTS: Record<string, readonly string[]> = {
  KARNATAKA: [
    "BAGALKOT",
    "BALLARI",
    "BELAGAVI",
    "BENGALURU RURAL",
    "BENGALURU URBAN",
    "BIDAR",
    "CHAMARAJANAGARA",
    "CHIKKABALLAPURA",
    "CHIKKAMAGALURU",
    "CHITRADURGA",
    "DAKSHINA KANNADA",
    "DAVANAGERE",
    "DHARWAD",
    "GADAG",
    "HASSAN",
    "HAVERI",
    "KALABURAGI",
    "KODAGU",
    "KOLAR",
    "KOLLEGALA",
    "KOPPAL",
    "MANDYA",
    "MYSURU",
    "RAICHUR",
    "RAMANAGARA",
    "SHIVAMOGGA",
    "TUMAKURU",
    "UDUPI",
    "UTTARA KANNADA",
    "VIJAYANAGARA",
    "VIJAYAPURA",
    "YADGIR",
  ],
};

export const TALUKS: Record<string, readonly string[]> = {
  "BAGALKOT": ["Bagalkot", "Badami", "Bilgi", "Hunagund", "Jamkhandi", "Mudhol", "Guledgudda", "Rabkavi Banhatti", "Ilkal"],
  "BALLARI": ["Ballari", "Kurugodu", "Sandur", "Siruguppa", "Kampli"],
  "BELAGAVI": ["Belagavi", "Athani", "Bailhongal", "Chikodi", "Gokak", "Hukkeri", "Khanapur", "Raybag", "Ramdurg", "Saundatti", "Nippani", "Kagwad", "Mudalgi"],
  "BENGALURU RURAL": ["Devanahalli", "Doddaballapura", "Hoskote", "Nelamangala"],
  "BENGALURU URBAN": ["Bengaluru East", "Bengaluru North", "Bengaluru South", "Anekal", "Yelahanka"],
  "BIDAR": ["Bidar", "Bhalki", "Humnabad", "Aurad", "Basavakalyan", "Chitgoppa", "Kamalnagar"],
  "CHAMARAJANAGARA": ["Chamarajanagara", "Gundlupet", "Kollegal", "Yelandur", "Hanur"],
  "CHIKKABALLAPURA": ["Chikkaballapura", "Bagepalli", "Chintamani", "Gauribidanur", "Sidlaghatta", "Gudibanda"],
  "CHIKKAMAGALURU": ["Chikkamagaluru", "Kadur", "Koppa", "Mudigere", "Sringeri", "Tarikere", "Narasimharajapura"],
  "CHITRADURGA": ["Chitradurga", "Challakere", "Hiriyur", "Holalkere", "Hosadurga", "Molakalmuru"],
  "DAKSHINA KANNADA": ["Mangaluru", "Bantwal", "Puttur", "Sullia", "Belthangady", "Moodabidri", "Kadaba"],
  "DAVANAGERE": ["Davanegere", "Harihar", "Channagiri", "Honnali", "Jagalur"],
  "DHARWAD": ["Dharwad", "Hubballi", "Kalghatgi", "Kundgol", "Navalagund", "Alnavar", "Annigeri"],
  "GADAG": ["Gadag", "Ron", "Shirahatti", "Nargund", "Mundargi", "Gajendragad", "Lakshmeshwar"],
  "HASSAN": ["Hassan", "Alur", "Arkalgud", "Arsikere", "Belur", "Channarayapatna", "Holenarasipura", "Sakleshpur"],
  "HAVERI": ["Haveri", "Byadgi", "Hangal", "Hirekerur", "Ranebennur", "Savanur", "Shiggaon", "Rattihalli"],
  "KALABURAGI": ["Kalaburagi", "Afzalpur", "Aland", "Chincholi", "Chitapur", "Jevargi", "Sedam", "Shahabad", "Kalgi", "Kamalapur", "Yadrami"],
  "KODAGU": ["Madikeri", "Somwarpet", "Virajpet", "Kushalnagar", "Ponnampet"],
  "KOLAR": ["Kolar", "Bangarapet", "Malur", "Mulbagal", "Srinivaspur", "KGF"],
  "KOLLEGALA": ["Kollegala", "Hanur", "Yelandur"],
  "KOPPAL": ["Koppal", "Gangavathi", "Kushtagi", "Yelburga", "Kanakagiri", "Karatagi", "Kuknoor"],
  "MANDYA": ["Mandya", "Maddur", "Malavalli", "Srirangapatna", "Pandavapura", "Krishnarajapet", "Nagamangala"],
  "MYSURU": ["Mysuru", "Nanjangud", "Hunsur", "T Narasipura", "Periyapatna", "KR Nagar", "Saragur", "Saligrama"],
  "RAICHUR": ["Raichur", "Devadurga", "Lingsugur", "Manvi", "Sindhanur", "Maski", "Sirwar"],
  "RAMANAGARA": ["Ramanagara", "Channapatna", "Kanakapura", "Magadi"],
  "SHIVAMOGGA": ["Shivamogga", "Bhadravathi", "Hosanagara", "Sagar", "Shikaripur", "Sorab", "Thirthahalli"],
  "TUMAKURU": ["Tumakuru", "Chiknayakanhalli", "Gubbi", "Koratagere", "Kunigal", "Madhugiri", "Pavagada", "Sira", "Tiptur", "Turuvekere"],
  "UDUPI": ["Udupi", "Karkala", "Kundapura", "Byndoor", "Brahmavara", "Kaup", "Hebri"],
  "UTTARA KANNADA": ["Karwar", "Ankola", "Bhatkal", "Haliyal", "Honnavar", "Joida", "Kumta", "Mundgod", "Siddapur", "Sirsi", "Yellapur", "Dandeli"],
  "VIJAYANAGARA": ["Hosapete", "Harapanahalli", "Hagaribommanahalli", "Kottur", "Hadagali", "Kudligi"],
  "VIJAYAPURA": ["Vijayapura", "Indi", "Muddebihal", "Sindgi", "Basavana Bagewadi", "Babaleshwar", "Kolhar", "Nidgundi", "Devara Hipparagi", "Chadchan", "Talikoti"],
  "YADGIR": ["Yadgir", "Shahapur", "Shorapur", "Gurmitkal", "Hunasagi", "Wadagera"]
};

export const EDUCATION_LEVELS = [
  "10th",
  "PUC",
  "Diploma",
  "ITI",
  "Graduate",
  "Post Graduate",
] as const;

export const STREAMS: Record<string, readonly string[]> = {
  PUC: ["Arts", "Commerce", "Science"],
  Diploma: ["Diploma"],
  ITI: ["ITI"],
  Graduate: ["Arts", "Commerce", "Science", "Engineering", "Management", "Law", "Education"],
  "Post Graduate": ["Arts", "Commerce", "Science", "Engineering", "Management", "Law"],
  "High School": ["General"],
};

export const SUBJECTS: Record<string, readonly string[]> = {
  Arts: ["History", "Economics", "Political Science", "Sociology", "Kannada"],
  Commerce: ["Accountancy", "Business Studies", "Statistics"],
  Science: ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"],
  Engineering: ["Civil", "Mechanical", "Electrical", "Electronics", "Computer Science"],
  Management: ["Finance", "Marketing", "Human Resources", "Operations"],
  Diploma: ["Civil", "Mechanical", "Electrical", "Electronics", "Computer Science"],
  ITI: ["Fitter", "Electrician", "Welder", "Turner", "Mechanic"],
};

export const LANGUAGES_KNOWN = ["Kannada", "English", "Hindi", "Telugu", "Tamil"] as const;

export const SKILLS = [
  "AWS Academy Cloud Foundation",
  "Computer Hardware and Networking",
  "Computer Programming",
  "AWS Solution Architect Associate",
  "Business Development Guidance",
  "Cisco IT Essentials",
  "AWS Solution Architect Associate with Academy Cloud Foundation",
  "Accounts Executive - Tally ERP 9",
] as const;


export const TRAINING_DURATIONS = ["2 - 4 weeks"] as const;

export const PASSING_YEARS = Array.from({ length: 2026 - 2017 + 1 }, (_, i) => String(2017 + i));

export const LAST_SALARY = ["Less than 10,000", "10,000 to 20,000", "20,000 and 25,000", "25,000 and above"] as const;

export const EXPECTED_SALARY = [
  "7,500 to 10,000",
  "10,000 to 15,000",
  "15,000 to 20,000",
  "20,000 to 25,000",
  "25,000 and above",
] as const;

export const MIGRATION_AREAS = ["Outside District", "Outside State", "Outside Country", "Bangalore"] as const;
