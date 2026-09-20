export const campaignCategories = [
  "Promotion - Services",
  "Promotion - General",
  "Special Occasion",
  "Welcome & Onboarding",
  "Re-engagement"
];

export const predefinedTemplates = [
  // PROMOTION - SERVICES
  {
    id: "hydra_facial_offer",
    category: "Promotion - Services",
    name: "Hydra Facial Offer",
    content: "Hey {{customer_name}},\n\nGet the Glowing Skin You Deserve with Our HydraFacial Offer! 🌟\nFor a limited time only, get a HydraFacial treatment for just [[price]]! 💸\n\nThis gentle yet effective treatment deeply cleanses, exfoliates, and hydrates your skin, leaving it looking radiant and refreshed. ✨\n\nBenefits of HydraFacial:\n✅ Deep pore cleansing\n✅ Hydrated and plump skin\n✅ Reduced fine lines and wrinkles\n✅ Improved skin texture and tone\n\nDon't miss out on this opportunity to pamper your skin! Share this message with your loved ones who deserve a little self-care treat! 💆‍♀️\n\nTo book an appointment, call us at ☎️ {{phone_number}} or visit 🌐 {{store_link}}\n\nBest Regards,\nTeam at {{business_name}} 💖\n\nReply STOP to unsubscribe from promotional messages",
    variables: ["price"],
    supportsImage: true
  },
  {
    id: "keratin_treatment",
    category: "Promotion - Services",
    name: "Keratin Smooth & Shine",
    content: "Hey {{customer_name}},\n\nTired of frizzy hair? 🙅‍♀️\nTransform your look with our Keratin Treatment! Get silky, smooth, and manageable hair today.\n\n💥 Special Offer: Flat [[discount_value]] OFF!\n\nBook your slot now and flaunt your perfect hair! ✨\n\nCall: {{phone_number}}\nBook Online: {{store_link}}\n\nBest,\n{{business_name}} ✂️",
    variables: ["discount_value"],
    supportsImage: true
  },
  {
    id: "massage_therapy",
    category: "Promotion - Services",
    name: "Relaxing Massage Therapy",
    content: "Hi {{customer_name}},\n\nUnwind and de-stress with our premium Massage Therapy sessions! 🧘‍♀️\nFor this week only, get a 60-minute full body massage at just [[price]].\n\nTake a break, you deserve it! 🍃\n\nCall us to reserve your spot: {{phone_number}}\n\nRegards,\n{{business_name}}",
    variables: ["price"],
    supportsImage: true
  },
  
  // PROMOTION - GENERAL
  {
    id: "cashback_discount",
    category: "Promotion - General",
    name: "Cashback and Discount Flash Offer",
    content: "Hey {{customer_name}},\n\nEscape the heat and indulge in some self-pampering at {{business_name}}! ✨\n\nGet a fantastic [[cashback_value]] cashback 💸 on all services for bills over [[bill_value_for_cashback]].\nPlus, enjoy a generous [[discount_value]] discount 💅 on services over [[bill_value_for_discount]]!\nWe have something for everyone! 🎉\n\n📍 Location: {{salon_address}}\n\nHurry, this offer is only available for a limited time! Secure your slots now by calling: ☎️ {{phone_number}} or visit 🌐 {{store_link}}\n\nBest Regards,\nTeam at {{business_name}} 💖\n\nReply STOP to unsubscribe from promotional messages",
    variables: ["cashback_value", "bill_value_for_cashback", "discount_value", "bill_value_for_discount"],
    supportsImage: true
  },
  {
    id: "weekend_sale",
    category: "Promotion - General",
    name: "Weekend Special Sale",
    content: "Hello {{customer_name}},\n\nThe weekend is here and so is our Weekend Special! 🎉\n\nEnjoy a flat [[discount_percent]]% discount on all salon services this Saturday and Sunday. Treat yourself to a fresh new look! 💇‍♀️💅\n\nHurry, limited slots available! \nBook Now: {{store_link}}\n\nSee you soon,\n{{business_name}} ✨",
    variables: ["discount_percent"],
    supportsImage: true
  },

  // SPECIAL OCCASION
  {
    id: "christmas",
    category: "Special Occasion",
    name: "Christmas Celebration",
    content: "Merry Christmas {{customer_name}}! 🎄❄️\n\nGet ready for the festive season with our exclusive Holiday Makeover packages starting at just [[package_price]]! 🎅✨\n\nLet's make you shine brighter than the Christmas tree. 🌟\n\nBook your festive glam session today: {{store_link}}\n\nWarm Wishes,\n{{business_name}} ❤️",
    variables: ["package_price"],
    supportsImage: true
  },
  {
    id: "diwali",
    category: "Special Occasion",
    name: "Diwali Festive Offer",
    content: "Happy Diwali {{customer_name}}! 🪔✨\n\nLight up the festivities with glowing skin and perfect hair! Avail our Diwali Special Combo at a flat [[discount_amount]] OFF.\n\nMay this festival of lights bring you joy and prosperity. 🙏\n\nBook your appointment: {{store_link}}\n\nBest Wishes,\n{{business_name}} 🎇",
    variables: ["discount_amount"],
    supportsImage: true
  },
  {
    id: "store_anniversary",
    category: "Special Occasion",
    name: "Store Anniversary Offer",
    content: "Hi {{customer_name}}! 🎉\n\nIt's our Anniversary! 🎂 To celebrate another beautiful year with our amazing clients, we are giving away a special [[offer_detail]] on your next visit.\n\nThank you for your continuous love and support! ❤️\n\nCelebrate with us: {{store_link}}\n\nWith Love,\n{{business_name}} 🎊",
    variables: ["offer_detail"],
    supportsImage: true
  },
  {
    id: "womens_day",
    category: "Special Occasion",
    name: "Women's Day Offer",
    content: "Happy Women's Day {{customer_name}}! 🌸👑\n\nToday is all about YOU! Treat the queen that you are with our exclusive Women's Day pampering package for just [[package_price]].\n\nYou are strong, beautiful, and inspiring! 💪💖\n\nPamper yourself today: {{store_link}}\n\nLove,\n{{business_name}} ✨",
    variables: ["package_price"],
    supportsImage: true
  },
  {
    id: "valentines_day",
    category: "Special Occasion",
    name: "Valentine's Day",
    content: "Hey {{customer_name}}, ❤️\n\nGet ready for date night! ✨ Enjoy our Valentine's Special Makeover package at just [[price]]! \n\nLook and feel your absolute best this Valentine's Day. 🌹\n\nBook your spot now: {{store_link}}\n\nXOXO,\n{{business_name}} 💋",
    variables: ["price"],
    supportsImage: true
  },

  // WELCOME & ONBOARDING
  {
    id: "welcome_discount",
    category: "Welcome & Onboarding",
    name: "Welcome First Visit Discount",
    content: "Welcome to {{business_name}}, {{customer_name}}! 🌟\n\nWe are thrilled to have you! As a special welcome gift, enjoy [[discount_percent]]% OFF on your very first service with us. 💇‍♀️💅\n\nShow this message at the reception to claim your offer!\n\nBook your first appointment: {{store_link}}\n\nSee you soon! 💖",
    variables: ["discount_percent"],
    supportsImage: false
  },

  // RE-ENGAGEMENT
  {
    id: "we_miss_you",
    category: "Re-engagement",
    name: "We Miss You Offer",
    content: "Hi {{customer_name}}, 👋\n\nIt's been a while since we last saw you at {{business_name}}! We miss you! 🥺\n\nCome back and treat yourself! We've added a special [[discount_amount]] OFF voucher to your profile for your next visit.\n\nClaim it now: {{store_link}}\n\nHope to see you soon! ✨",
    variables: ["discount_amount"],
    supportsImage: true
  }
];
