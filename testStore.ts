import { checkStoreIsOpen } from './backend/src/utils/storeStatus';

const settings = {
  isOpen: true,
  businessHours: {
    sunday: { isOpen: false, is24Hours: false, open: "18:00", close: "23:00" },
    monday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
    tuesday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
    wednesday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
    thursday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
    friday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
    saturday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
    // manualOverride: { status: "OPEN", timestamp: 1724785461123 }
  }
};

console.log("Is open?", checkStoreIsOpen(settings, false));
