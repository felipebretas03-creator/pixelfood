export const checkStoreIsOpen = (settings: any, isBlocked: boolean = false): boolean => {
  if (isBlocked) return false;
  if (!settings.businessHours) return settings.isOpen;

  try {
    const now = new Date();
    const spTimeStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const spNow = new Date(spTimeStr);

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = spNow.getDay();
    const currentMinutes = spNow.getHours() * 60 + spNow.getMinutes();

    let autoIsOpen = false;

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

    const todayConfig = settings.businessHours[days[todayIndex]];
    const yesterdayIndex = (todayIndex - 1 + 7) % 7;
    const yesterdayConfig = settings.businessHours[days[yesterdayIndex]];

    autoIsOpen = checkDay(todayConfig, currentMinutes, false) || checkDay(yesterdayConfig, currentMinutes, true);

    // Verificar manual override
    if (settings.businessHours.manualOverride) {
      const overrideStatus = settings.businessHours.manualOverride.status === 'OPEN';
      const overrideTime = new Date(settings.businessHours.manualOverride.timestamp).getTime();
      
      let lastTransitionTime = 0;

      const createDateForDay = (offsetDays: number, hours: number, mins: number) => {
        const d = new Date(spNow);
        d.setDate(d.getDate() + offsetDays);
        d.setHours(hours, mins, 0, 0);
        return d.getTime();
      };

      if (yesterdayConfig && yesterdayConfig.isOpen && !yesterdayConfig.is24Hours && yesterdayConfig.open && yesterdayConfig.close) {
        const [oH, oM] = yesterdayConfig.open.split(':').map(Number);
        const [cH, cM] = yesterdayConfig.close.split(':').map(Number);
        const crosses = (cH * 60 + cM) <= (oH * 60 + oM);
        
        const openTime = createDateForDay(-1, oH, oM);
        const closeTime = createDateForDay(crosses ? 0 : -1, cH, cM);
        
        if (openTime <= spNow.getTime() && openTime > lastTransitionTime) lastTransitionTime = openTime;
        if (closeTime <= spNow.getTime() && closeTime > lastTransitionTime) lastTransitionTime = closeTime;
      }
      
      if (todayConfig && todayConfig.isOpen && !todayConfig.is24Hours && todayConfig.open && todayConfig.close) {
        const [oH, oM] = todayConfig.open.split(':').map(Number);
        const [cH, cM] = todayConfig.close.split(':').map(Number);
        const crosses = (cH * 60 + cM) <= (oH * 60 + oM);
        
        const openTime = createDateForDay(0, oH, oM);
        const closeTime = createDateForDay(crosses ? 1 : 0, cH, cM);
        
        if (openTime <= spNow.getTime() && openTime > lastTransitionTime) lastTransitionTime = openTime;
        if (closeTime <= spNow.getTime() && closeTime > lastTransitionTime) lastTransitionTime = closeTime;
      }

      // Se o override foi feito APÓS a última transição de horário programada
      if (overrideTime > lastTransitionTime) {
        return overrideStatus;
      }
    }

    return autoIsOpen;
  } catch (err) {
    console.error("Erro ao calcular checkStoreIsOpen:", err);
    return settings.isOpen;
  }
};
