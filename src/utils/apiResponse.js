//Handle sucess and error response
export function success(res, data, message = "Success", code = 200) {
    return res.status(code).json({
      success: true,
      message,
      data,
    });
}

export function openaiError(res, errorCodeOrMsg, detailsOrStatus, errDetails) {
  let message = typeof errorCodeOrMsg === 'string' ? errorCodeOrMsg : (errorCodeOrMsg.message || 'Error');
  let code = 500;
  let errorObj = {};

  if (typeof detailsOrStatus === 'number') {
    code = detailsOrStatus;
    if (errDetails) errorObj = errDetails;
  } else if (detailsOrStatus && typeof detailsOrStatus === 'object') {
    errorObj = detailsOrStatus;
  }
  if (typeof errorCodeOrMsg === 'object' && errorCodeOrMsg.code) {
    errorObj.code = errorCodeOrMsg.code;
  }

  return res.status(code).json({
    success: false,
    message: "Analysis failed",
    error: {
      code: errorObj.code || "ERROR",
      message,
      ...(errorObj.details ? { details: errorObj.details } : {}),
    }
  });
}

export function error(res, message = "Something went wrong", code = 500, errors = []) {
  return res.status(code).json({
    success: false,
    message,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
  