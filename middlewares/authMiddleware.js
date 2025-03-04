// middleware/authMiddleware.js
export const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
      console.log("1",req.session.user)
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }
    next();
  };
  
  export const isAdmin = (req, res, next) => {
    if (!req.session.user?.role || req.session.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    next();
  };
  export const isWorker = (req, res, next) => {
    if (!req.session.user?.role || (req.session.user.role !== "worker" && req.session.user.role !== "admin")) {
      return res.status(403).json({ message: "Forbidden: Workers only" });
    }
    next();
  };
  