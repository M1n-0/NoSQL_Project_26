// Enveloppe les handlers async pour transmettre les erreurs au middleware d'erreur d'Express.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
