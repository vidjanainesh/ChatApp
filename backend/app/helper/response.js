// 200 OK - General success
exports.successResponse = (res, data = {}, message = "Success") => {
  res.status(200).json({
    status: "success",
    message,
    data
  }).end();
};

// 201 Created - Resource successfully created
exports.successPostResponse = (res, data = {}, message = "Created successfully") => {
  res.status(201).json({
    status: "success",
    message,
    data
  }).end();
};

// 400 Bad Request - Application-specific client-side error
exports.errorResponse = (res, message = "Bad request") => {
  res.status(400).json({
    status: "error",
    message
  }).end();
};

// 401 Unauthorized - Invalid or missing authentication
exports.unAuthorizedResponse = (res, message = "Unauthorized") => {
  res.status(401).json({
    status: "error",
    message
  }).end();
};

// 403 Forbidden - Authenticated but not allowed
exports.forbiddenResponse = (res, message = "Forbidden access") => {a
  res.status(403).json({
    status: "error",
    message
  }).end();
};

// 404 Not Found - Resource not found
exports.notFoundResponse = (res, message = "Not found") => {
  res.status(404).json({
    status: "error",
    message
  }).end();
};

// 440 Login Timeout or Session Expired (custom use)
exports.forceLogoutResponse = (res, message = "Session expired. Please login again.") => {
  res.status(440).json({
    status: "error",
    message
  }).end();
};

// 500 Internal Server Error - Catch-all
exports.errorThrowResponse = (res, fallbackMessage = "Internal server error", err) => {
  console.error("Server Error:", err);
  res.status(500).json({
    status: "error",
    message: fallbackMessage
  }).end();
};