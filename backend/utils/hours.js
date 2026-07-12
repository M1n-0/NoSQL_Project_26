// Détermine si un magasin est actuellement ouvert à partir de ses horaires SQL (format "HH:MM:SS").
function isOpenNow(horaireOuverture, horaireFermeture) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [oh, om] = horaireOuverture.split(":").map(Number);
  const [ch, cm] = horaireFermeture.split(":").map(Number);

  return nowMinutes >= oh * 60 + om && nowMinutes < ch * 60 + cm;
}

function formatHeure(sqlTime) {
  return sqlTime.slice(0, 5).replace(":", "h");
}

module.exports = { isOpenNow, formatHeure };
