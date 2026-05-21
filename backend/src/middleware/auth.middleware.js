export const isAuthenticated = (req, res, next) => {
  // Passport automatically adds this helper method to the request object
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ message: 'Unauthorized. Please log in.' });
};