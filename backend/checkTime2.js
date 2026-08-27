function getRealEpochInSP(dayOffset, timeStr) {
   const spDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
   const [year, month, day] = spDateStr.split('-').map(Number);
   const d = new Date(Date.UTC(year, month - 1, day + dayOffset));
   const newY = d.getUTCFullYear();
   const newM = String(d.getUTCMonth() + 1).padStart(2, '0');
   const newD = String(d.getUTCDate()).padStart(2, '0');
   const isoStr = `${newY}-${newM}-${newD}T${timeStr}:00.000-03:00`;
   return new Date(isoStr).getTime();
}

console.log("Today 18:00:", new Date(getRealEpochInSP(0, "18:00")));
console.log("Yesterday 23:00:", new Date(getRealEpochInSP(-1, "23:00")));
