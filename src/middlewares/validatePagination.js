const validatePagination = (req, res, next) => {
    const limit = parseInt(req.query.limit, 10);
    const offset = parseInt(req.query.offset, 10);

    if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ error: "Invalid limit. Limit must be a positive number." });
    }
    if (isNaN(offset) || offset < 0) {
        return res.status(400).json({ error: "Invalid offset. Offset must be a non-negative number." });
    }

    req.pagination = { limit, offset };
    next();
}
module.exports = {
  validatePagination: validatePagination
}