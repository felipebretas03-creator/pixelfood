export const checkStoreIsOpen = (settings: any, isBlocked: boolean = false): boolean => {
  let isCurrentlyOpen = !isBlocked && settings.isOpen;
  
  if (isCurrentlyOpen && settings.businessHours) {
    try {
      const now = new Date();
      const spTimeStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
      const spNow = new Date(spTimeStr);

      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayIndex = spNow.getDay();
      const currentMinutes = spNow.getHours() * 60 + spNow.getMinutes();

      const checkDay = (config: any, timeToCheck: number, isYesterday: boolean): boolean => {
        if (!config || !config.isOpen) return false;
        if (config.is24Hours) return true;
        if (!config.open || !config.close) return false;

        const [openH, openM] = config.open.split(':').map(Number);
        const [closeH, closeM] = config.close.split(':').map(Number);
        
        const openTime = openH * 60 + openM;
        const closeTime = closeH * 60 + closeM;
        const crossesMidnight = closeTime <= openTime;

        if (isYesterday) {
          if (!crossesMidnight) return false;
          const adjustedTime = timeToCheck + 24 * 60;
          return adjustedTime >= openTime && adjustedTime <= (closeTime + 24 * 60);
        } else {
          const adjCloseTime = crossesMidnight ? closeTime + 24 * 60 : closeTime;
          return timeToCheck >= openTime && timeToCheck <= adjCloseTime;
        }
      };

      const todayConfig = settings.businessHours[days[dayIndex]];
      const yesterdayIndex = (dayIndex - 1 + 7) % 7;
      const yesterdayConfig = settings.businessHours[days[yesterdayIndex]];

      isCurrentlyOpen = checkDay(todayConfig, currentMinutes, false) || checkDay(yesterdayConfig, currentMinutes, true);
    } catch (err) {
      console.error("Erro ao calcular isCurrentlyOpen:", err);
    }
  }
  return isCurrentlyOpen;
};
