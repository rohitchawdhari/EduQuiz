// Generate room code like "DBMS-7K29" or "PYTH-9A12"
const generateRoomCode = (subject = "QUIZ") => {
  const cleanPrefix = subject.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "QUIZ";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude confusing 0, O, 1, I
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${cleanPrefix}-${randomPart}`;
};

const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `EQ-${year}-${randomNum}`;
};

module.exports = {
  generateRoomCode,
  generateCertificateId,
};
