const now = new Date();
const spTimeStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
const spNow = new Date(spTimeStr);
console.log("now:", now);
console.log("spNow:", spNow);
console.log("spNow.getDay():", spNow.getDay());
console.log("spNow.getHours():", spNow.getHours());
