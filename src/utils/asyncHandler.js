//? asyncHandler with simple promise
const asyncHandler = (requetsHandler) => {
  return (req, res, next) => {
    Promise.resolve(requetsHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

//? asyncHandler with async await keyword & trycatch block
/*
const asyncHandler = (requestsHandler) => async (req, res, next) => {
  try {
    await requestsHandler(req, res, next);
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
*/
