//Handle sucess and error response

export function success(res, data, message = "Success") {
    return res.json({ status: "success", message, data });
}

export function error(res, message = "Something went wrong", statusCode = 500, error = null) {
    const result = { status: "error", message };
    if (error) result.error = error;
    return res.status(statusCode).json(result);
}
  