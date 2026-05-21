function validate(checks) {
  return async (req, res, next) => {
    for (const check of checks) {
      const error = check(req.body);
      if (error) {
        return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: error } });
      }
    }
    next();
  };
}

module.exports = validate;
