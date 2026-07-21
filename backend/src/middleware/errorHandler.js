const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 400 : res.statusCode;
  let message = err.message || 'An error occurred';
  let errors = [];

  // Handle MongoDB E11000 Duplicate Key Errors
  if (err.code === 11000 || err.name === 'MongoServerError') {
    statusCode = 400;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    if (field === 'aadhaarNumber') {
      message = 'This Aadhaar Number is already registered.';
      errors.push('Duplicate Aadhaar Number');
    } else if (field === 'phone') {
      message = 'This Mobile Number is already registered.';
      errors.push('Duplicate Mobile Number');
    } else if (field === 'email') {
      message = 'This Email address is already registered.';
      errors.push('Duplicate Email Address');
    } else if (field === 'registrationNumber') {
      message = 'Registration Number already exists.';
      errors.push('Duplicate Registration Number');
    } else {
      message = `Member already exists with this ${field || 'information'}.`;
      errors.push(`Duplicate ${field}`);
    }
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
    errors = Object.keys(err.errors);
  }

  // Handle Multer Upload Errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${err.message}${err.field ? ` (${err.field})` : ''}`;
    errors.push(err.message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : [message],
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
