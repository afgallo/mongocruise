exports.buildQueryRequest = ({ skip, limit, sort, projection, find }) => {
  const result = {
    query: {},
    options: {}
  }

  try {
    if (skip) result.options.skip = Number(skip)
    if (limit) result.options.limit = Number(limit)
    if (find) result.query = JSON.parse(find)
    if (sort) result.options.sort = JSON.parse(sort)
    if (projection) result.options.projection = JSON.parse(projection)
  } catch (error) {
    return { error: `Invalid JSON format: ${error.message}` }
  }

  return result
}
